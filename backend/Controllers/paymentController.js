const Payment = require('../Models/Payment');
const MaintenanceExpense = require('../Models/MaintenanceExpense');
const Flat = require('../Models/flat');
const Apartment = require('../Models/apartments');
const { sendPaymentConfirmationEmail } = require('../utils/emailService');

// ─── Record a Payment ───────────────────────────────────────────────────────
exports.recordPayment = async (req, res) => {
  try {
    const { maintenanceId, flatId, amount, mode, transactionId, paidDate, notes } = req.body;
    const recordedBy = req.body.recordedBy || null;

    if (!maintenanceId || !flatId || !amount || !mode) {
      return res.status(400).json({ success: false, message: 'maintenanceId, flatId, amount, and mode are required' });
    }

    // Find the parent maintenance bill
    const maintenance = await MaintenanceExpense.findById(maintenanceId);
    if (!maintenance) {
      return res.status(404).json({ success: false, message: 'Maintenance bill not found' });
    }

    // Find the flat's expense sub-document
    const flatExpense = maintenance.flatExpenses.find(f => f.flatId.toString() === flatId.toString());
    if (!flatExpense) {
      return res.status(404).json({ success: false, message: 'Flat not found in this maintenance bill' });
    }

    // Save the payment record
    const payment = new Payment({
      maintenanceId,
      flatExpenseId: flatExpense._id,
      flatId,
      apartmentId: maintenance.apartmentId,
      amount: Number(amount),
      mode,
      transactionId: transactionId || '',
      paidDate: paidDate || new Date(),
      recordedBy,
      notes: notes || '',
    });
    await payment.save();

    // Calculate total paid so far for this flat in this maintenance bill
    const allPayments = await Payment.find({ maintenanceId, flatId });
    const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalDue = flatExpense.total;

    // Update the flat's bill status
    let newStatus = 'unpaid';
    // Allow a 2-rupee tolerance for rounding differences between exact floating point total and sum of rounded components
    if (totalPaid >= totalDue - 2) {
      newStatus = 'paid';
    } else if (totalPaid > 0) {
      newStatus = 'partial';
    }

    await MaintenanceExpense.updateOne(
      { _id: maintenance._id, "flatExpenses._id": flatExpense._id },
      { $set: { "flatExpenses.$.status": newStatus } }
    );

    // ── Fire payment confirmation email (non-blocking) ────────────────────
    setImmediate(async () => {
      try {
        const apt = await Apartment.findById(maintenance.apartmentId);
        const flatDoc = await Flat.findById(flatId)
          .populate('owners', 'name email')
          .populate('residents', 'name email');

        if (flatDoc) {
          const allUsers = [...(flatDoc.owners || []), ...(flatDoc.residents || [])];
          const uniqueUsers = allUsers.filter((u, i, arr) =>
            u && u.email && arr.findIndex(x => x._id.toString() === u._id.toString()) === i
          );
          for (const user of uniqueUsers) {
            await sendPaymentConfirmationEmail({
              toEmail: user.email,
              toName: user.name || 'Resident',
              flatNo: flatExpense.flatNo || flatDoc.number,
              amount: Number(amount),
              mode,
              status: newStatus,
              aptName: apt?.name || 'Apartment',
            }).catch(err => console.error(`Payment email failed for ${user.email}:`, err.message));
          }
        }
      } catch (emailErr) {
        console.error('Payment email notification error:', emailErr.message);
      }
    });

    res.status(201).json({
      success: true,
      message: `Payment recorded. Bill status updated to "${newStatus}"`,
      payment,
      totalPaid,
      totalDue,
      newStatus,
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── Get All Payments (optionally filter by apartmentId or maintenanceId) ───
exports.getAllPayments = async (req, res) => {
  try {
    const { apartmentId, maintenanceId, flatId } = req.query;
    const filter = {};
    if (apartmentId)   filter.apartmentId   = apartmentId;
    if (maintenanceId) filter.maintenanceId = maintenanceId;
    if (flatId)        filter.flatId        = flatId;

    const payments = await Payment.find(filter)
      .populate('flatId', 'number block floor')
      .populate('apartmentId', 'name')
      .populate('maintenanceId', 'date')
      .populate('recordedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── Get Pending Collections (all unpaid/partial flats in the latest bill) ──
exports.getPendingCollections = async (req, res) => {
  try {
    const { apartmentId } = req.query;

    if (!apartmentId) {
      return res.status(400).json({ success: false, message: 'apartmentId is required' });
    }

    // Get the most recent maintenance bill for this apartment
    const latestBill = await MaintenanceExpense.findOne({ apartmentId })
      .sort({ createdAt: -1 })
      .populate('flatExpenses.flatId', 'number block floor');

    if (!latestBill) {
      return res.status(404).json({ success: false, message: 'No maintenance bills found for this apartment' });
    }

    // Filter only unpaid or partial flats
    const pendingFlats = latestBill.flatExpenses.filter(f => f.status !== 'paid');

    // For each pending flat, calculate total already paid
    const result = await Promise.all(pendingFlats.map(async (flatExp) => {
      const paidSoFar = await Payment.aggregate([
        { $match: { maintenanceId: latestBill._id, flatId: flatExp.flatId._id || flatExp.flatId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalPaid = paidSoFar[0]?.total || 0;

      return {
        flatExpenseId: flatExp._id,
        flatId: flatExp.flatId,
        flatNo: flatExp.flatNo,
        totalDue: flatExp.total,
        totalPaid,
        balance: Math.max(0, Math.round(flatExp.total) - totalPaid),
        status: flatExp.status,
        arrears: flatExp.arrears,
      };
    }));

    res.json({
      success: true,
      maintenanceId: latestBill._id,
      billDate: latestBill.date,
      pendingCount: result.length,
      pendingCollections: result,
    });
  } catch (error) {
    console.error('Error fetching pending collections:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

// ─── Delete a Payment (and revert the status) ───────────────────────────────
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Recalculate status after deletion
    const maintenance = await MaintenanceExpense.findById(payment.maintenanceId);
    if (maintenance) {
      const flatExpense = maintenance.flatExpenses.find(f => f.flatId.toString() === payment.flatId.toString());
      if (flatExpense) {
        const remaining = await Payment.find({ maintenanceId: payment.maintenanceId, flatId: payment.flatId });
        const totalPaid = remaining.reduce((sum, p) => sum + p.amount, 0);

        let calculatedStatus = 'unpaid';
        if (totalPaid >= flatExpense.total - 2) {
          calculatedStatus = 'paid';
        } else if (totalPaid > 0) {
          calculatedStatus = 'partial';
        }

        await MaintenanceExpense.updateOne(
          { _id: maintenance._id, "flatExpenses._id": flatExpense._id },
          { $set: { "flatExpenses.$.status": calculatedStatus } }
        );
      }
    }

    res.json({ success: true, message: 'Payment deleted and bill status recalculated' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
