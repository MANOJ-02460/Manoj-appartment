const mongoose = require('mongoose');
const MaintenanceExpense = require('../Models/MaintenanceExpense');
const WaterExpense = require('../Models/WaterExpense');
const ElectricityExpense = require('../Models/ElectricityExpense');
const Apartment = require('../Models/apartments');
const Flat = require('../Models/flat');
const WaterReading = require('../Models/WaterReading');
const Expense = require('../Models/expense');
const User = require('../Models/users');
const { sendMaintenanceBillEmail } = require('../utils/emailService');
// generateInvoiceBuffer no longer needed (Frontend Driven Architecture)

const divide = (v, n) => n === 0 ? 0 : +(v / n).toFixed(2);

exports.createMaintenance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { apartmentId, month, common = 0, security = 0, waterExpenseId, electricityExpenseId } = req.body;
    const userId = req.user?._id || req.body.createdBy;

    if (month) {
      const existing = await MaintenanceExpense.findOne({ apartmentId, month }).session(session);
      if (existing) {
        throw new Error(`A Maintenance Bill for ${month} already exists! Please click 'Edit' on the existing bill to update it instead of generating a duplicate.`);
      }
    }

    const apartment = await Apartment.findById(apartmentId).session(session);
    if (!apartment) throw new Error('Apartment not found');

    const flats = await Flat.find({ apartment: apartmentId }).session(session);
    if (!flats.length) throw new Error('No flats in apartment');

    const water = waterExpenseId ? await WaterExpense.findById(waterExpenseId).session(session) : null;
    const elec = electricityExpenseId ? await ElectricityExpense.findById(electricityExpenseId).session(session) : null;

    const waterCost = water ? Number(water.totalCost) : 0;
    const elecCost = elec ? Number(elec.totalCost) : 0;

    const totalMaintenance = Number(common) + Number(security) + waterCost + elecCost;

    const flatsCount = flats.length;
    const commonShare = divide(common, flatsCount);
    const securityShare = divide(security, flatsCount);
    const waterShare = divide(waterCost, flatsCount);       // apartment-level shared water (if desired)
    const elecShare = divide(elecCost, flatsCount);

    const ratePerLiter = water ? Number(water.ratePerLitre) : 0; // per-litre used for meter charge

    // fetch water readings for the month if provided
    let waterReadings = [];
    if (month) {
      waterReadings = await WaterReading.find({ apartmentId, month }).session(session);
    }

    // Calculate total metered liters consumed by all flats
    let totalMeteredLiters = 0;
    const flatsData = flats.map(f => {
      const monthlyReading = waterReadings.find(r => r.flatId.toString() === f._id.toString());
      const previous = monthlyReading ? Number(monthlyReading.previousReading) : Number(f.waterMeter?.previous || 0);
      const current = monthlyReading ? Number(monthlyReading.currentReading) : Number(f.waterMeter?.current || 0);
      const consumed = Math.max(0, current - previous); // avoid negatives
      totalMeteredLiters += consumed;
      return { flat: f, previous, current, consumed };
    });

    // Calculate Common Water Cost
    const totalTankerLiters = water ? Number(water.totalLitres) : 0;
    const commonWaterLiters = Math.max(0, totalTankerLiters - totalMeteredLiters);
    const totalCommonWaterCost = +(commonWaterLiters * ratePerLiter).toFixed(2);
    const commonWaterShare = divide(totalCommonWaterCost, flatsCount);

    // fetch the previous month's maintenance bill to calculate arrears
    const previousMaintenance = await MaintenanceExpense.findOne({ apartmentId })
      .sort({ createdAt: -1 })
      .session(session);

    let previousPayments = [];
    if (previousMaintenance) {
      const Payment = require('../Models/Payment');
      previousPayments = await Payment.find({ maintenanceId: previousMaintenance._id }).session(session);
    }

    const flatExpenses = flatsData.map(data => {
      const { flat: f, previous, current, consumed } = data;
      const waterCostByMeter = +(consumed * ratePerLiter).toFixed(2);
      const finalWaterCost = waterCostByMeter;

      // Calculate Arrears from previous month
      let previousArrears = 0;
      if (previousMaintenance) {
        const prevFlatRecord = previousMaintenance.flatExpenses.find(
          prev => prev.flatId.toString() === f._id.toString()
        );
        // If they didn't pay the previous bill fully, carry over the remaining unpaid balance
        if (prevFlatRecord && prevFlatRecord.status !== 'paid') {
          const flatPayments = previousPayments.filter(p => p.flatId.toString() === f._id.toString());
          const totalPaid = flatPayments.reduce((sum, p) => sum + p.amount, 0);
          previousArrears = Math.max(0, Number(prevFlatRecord.total) - totalPaid);
        }
      }

      const totalForFlat = +(commonShare + securityShare + elecShare + finalWaterCost + commonWaterShare + previousArrears).toFixed(2);

      return {
        flatId: f._id,
        flatNo: f.number || f.flatNo || f._id.toString(),

        previousReading: previous,
        currentReading: current,
        consumedLiters: consumed,
        ratePerLiter: ratePerLiter,
        waterCost: finalWaterCost,
        commonWater: commonWaterShare,

        common: commonShare,
        security: securityShare,
        electricity: elecShare,

        arrears: previousArrears,
        buffer: 0,
        total: totalForFlat,
        status: 'unpaid'
      };
    });

    const maintenance = new MaintenanceExpense({
      apartmentId,
      month,
      common,
      security,
      totalMaintenance,
      totalCommonWaterCost,
      waterExpenseId,
      electricityExpenseId,
      flatExpenses,
      createdBy: userId,
      communityId: req.user && req.user.community ? req.user.community : undefined
    });

    await maintenance.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: 'created', maintenance });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(err);
    return res.status(400).json({ message: err.message });
  }
};

// ── Send Bill Notifications (Admin-triggered, bulk parallel dispatch) ────────
exports.sendBillNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const { pdfs } = req.body; // Array of { flatId, pdfBase64 }
    
    if (!pdfs || !Array.isArray(pdfs)) {
      return res.status(400).json({ success: false, message: 'Missing pdfs in request body' });
    }

    const maintenance = await MaintenanceExpense.findById(id)
      .populate('apartmentId', 'name');
    if (!maintenance) return res.status(404).json({ success: false, message: 'Maintenance bill not found' });

    const apartmentId = maintenance.apartmentId._id || maintenance.apartmentId;
    const aptName = maintenance.apartmentId.name || 'Apartment';

    // Load all flats with owner/resident emails
    const flatsWithOwners = await Flat.find({ apartment: apartmentId })
      .populate('owners', 'name email')
      .populate('residents', 'name email');

    // Build one task per flat (parallel)
    const tasks = maintenance.flatExpenses.map(async (flatBill) => {
      const matchedFlat = flatsWithOwners.find(f => f._id.toString() === flatBill.flatId.toString());
      if (!matchedFlat) return { flatNo: flatBill.flatNo, status: 'skipped', reason: 'flat not found' };

      const allUsers = [...(matchedFlat.owners || []), ...(matchedFlat.residents || [])];
      const uniqueUsers = allUsers.filter((u, i, arr) =>
        u && u.email && arr.findIndex(x => x._id.toString() === u._id.toString()) === i
      );

      if (!uniqueUsers.length) return { flatNo: flatBill.flatNo, status: 'skipped', reason: 'no email linked' };

      // Get the PDF generated by the frontend for this flat
      const flatPdfObj = pdfs.find(p => p.flatId.toString() === flatBill.flatId.toString());
      let pdfBuffer = null;
      if (flatPdfObj && flatPdfObj.pdfBase64) {
        pdfBuffer = Buffer.from(flatPdfObj.pdfBase64, 'base64');
      }

      // Send to all unique users of this flat
      const emailResults = await Promise.allSettled(
        uniqueUsers.map(user =>
          sendMaintenanceBillEmail({
            toEmail: user.email,
            toName: user.name || 'Resident',
            flatNo: flatBill.flatNo,
            month: maintenance.month,
            aptName,
            total: flatBill.total,
            arrears: flatBill.arrears || 0,
            pdfBuffer,
          })
        )
      );

      const failed = emailResults.filter(r => r.status === 'rejected');
      if (failed.length) {
        return { flatNo: flatBill.flatNo, status: 'partial', sent: emailResults.length - failed.length, failed: failed.length };
      }
      return { flatNo: flatBill.flatNo, status: 'sent', sent: emailResults.length };
    });

    // Run ALL flats in parallel
    const results = await Promise.all(tasks);

    const sent = results.filter(r => r.status === 'sent').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    const partial = results.filter(r => r.status === 'partial').length;

    console.log(`✉️  Notifications: ${sent} sent, ${skipped} skipped, ${partial} partial`);
    res.json({
      success: true,
      message: `Notifications dispatched`,
      summary: { sent, skipped, partial, total: results.length },
      details: results,
    });
  } catch (err) {
    console.error('sendBillNotifications error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.recalculateMaintenanceHelper = async (maintenanceId, session) => {
  const maintenance = await MaintenanceExpense.findById(maintenanceId).session(session);
  if (!maintenance) throw new Error("Maintenance record not found");

  const apartmentId = maintenance.apartmentId;
  const month = maintenance.month;
  const security = maintenance.security || 0;
  const waterExpenseId = maintenance.waterExpenseId;
  const electricityExpenseId = maintenance.electricityExpenseId;
  
  // Dynamically calculate Society Bills for the "common" charge
  let common = 0;
  if (month) {
    const startDate = new Date(`${month}-01T00:00:00.000Z`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const expenses = await Expense.find({
      apartmentId,
      expenseDate: { $gte: startDate, $lt: endDate }
    }).session(session);

    common = expenses.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
  }

  // Fetch related docs
  const flats = await Flat.find({ apartment: apartmentId }).session(session);
  if (!flats.length) return; // Silent return if no flats

  const water = waterExpenseId ? await WaterExpense.findById(waterExpenseId).session(session) : null;
  const elec = electricityExpenseId ? await ElectricityExpense.findById(electricityExpenseId).session(session) : null;

  const waterCost = water ? Number(water.totalCost) : 0;
  const elecCost = elec ? Number(elec.totalCost) : 0;

  const totalMaintenance = Number(common) + Number(security) + waterCost + elecCost;

  const flatsCount = flats.length;
  const commonShare = divide(common, flatsCount);
  const securityShare = divide(security, flatsCount);
  const elecShare = divide(elecCost, flatsCount);

  const ratePerLiter = water ? Number(water.ratePerLitre) : 0;

  // Fetch water readings
  let waterReadings = [];
  if (month) {
    waterReadings = await WaterReading.find({ apartmentId, month }).session(session);
  }

  let totalMeteredLiters = 0;
  const flatsData = flats.map(f => {
    const monthlyReading = waterReadings.find(r => r.flatId.toString() === f._id.toString());
    const previous = monthlyReading ? Number(monthlyReading.previousReading) : Number(f.waterMeter?.previous || 0);
    const current = monthlyReading ? Number(monthlyReading.currentReading) : Number(f.waterMeter?.current || 0);
    const consumed = Math.max(0, current - previous);
    totalMeteredLiters += consumed;
    return { flat: f, previous, current, consumed };
  });

  const totalTankerLiters = water ? Number(water.totalLitres) : 0;
  const commonWaterLiters = Math.max(0, totalTankerLiters - totalMeteredLiters);
  const totalCommonWaterCost = +(commonWaterLiters * ratePerLiter).toFixed(2);
  const commonWaterShare = divide(totalCommonWaterCost, flatsCount);

  // Arrears calculation
  const previousMaintenance = await MaintenanceExpense.findOne({
    apartmentId,
    createdAt: { $lt: maintenance.createdAt }
  })
    .sort({ createdAt: -1 })
    .session(session);

  const flatExpenses = flatsData.map(data => {
    const { flat: f, previous, current, consumed } = data;
    const finalWaterCost = +(consumed * ratePerLiter).toFixed(2);

    let previousArrears = 0;
    if (previousMaintenance) {
      const prevFlatRecord = previousMaintenance.flatExpenses.find(
        prev => prev.flatId.toString() === f._id.toString()
      );
      if (prevFlatRecord && prevFlatRecord.status !== 'paid') {
        previousArrears = Number(prevFlatRecord.total) || 0;
      }
    }

    const existingFlatRecord = maintenance.flatExpenses.find(ex => ex.flatId.toString() === f._id.toString());
    const status = existingFlatRecord ? existingFlatRecord.status : 'unpaid';

    const totalForFlat = +(commonShare + securityShare + elecShare + finalWaterCost + commonWaterShare + previousArrears).toFixed(2);

    return {
      flatId: f._id,
      flatNo: f.number || f.flatNo || f._id.toString(),
      previousReading: previous,
      currentReading: current,
      consumedLiters: consumed,
      ratePerLiter: ratePerLiter,
      waterCost: finalWaterCost,
      commonWater: commonWaterShare,
      common: commonShare,
      security: securityShare,
      electricity: elecShare,
      arrears: previousArrears,
      buffer: 0,
      total: totalForFlat,
      status: status
    };
  });

  maintenance.common = common;
  maintenance.totalMaintenance = totalMaintenance;
  maintenance.totalCommonWaterCost = totalCommonWaterCost;
  maintenance.flatExpenses = flatExpenses;

  await maintenance.save({ session });
};

exports.updateMaintenance = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { common = 0, security = 0, waterExpenseId, electricityExpenseId } = req.body;

    const maintenance = await MaintenanceExpense.findById(id).session(session);
    if (!maintenance) throw new Error("Maintenance record not found");

    // Update the modifiable fields
    maintenance.common = Number(common);
    maintenance.security = Number(security);
    maintenance.waterExpenseId = waterExpenseId;
    maintenance.electricityExpenseId = electricityExpenseId;
    await maintenance.save({ session });

    // Call the heavy recalculation engine
    await exports.recalculateMaintenanceHelper(id, session);

    // Re-fetch to return the fresh data
    const updatedMaintenance = await MaintenanceExpense.findById(id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ success: true, message: "Maintenance fully recalculated and updated", data: updatedMaintenance });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMaintenance = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MaintenanceExpense.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Maintenance record not found" });

    res.status(200).json({ success: true, message: "Maintenance deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



// 📋 Get All Maintenance Records (with optional apartment filter)
exports.getAllMaintenance = async (req, res) => {
  try {
    const { apartmentId } = req.query;
    const query = apartmentId ? { apartmentId } : {};
    if (req.user && req.user.community) query.communityId = req.user.community;

    const maintenanceRecords = await MaintenanceExpense.find(query)
      .populate('apartmentId', 'name')
      .populate('waterExpenseId')
      .populate('electricityExpenseId')
      .sort({ createdAt: -1 });

    res.json(maintenanceRecords);
  } catch (error) {
    console.error('Error fetching maintenance:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

//  Get Single Maintenance Record by ID
exports.getMaintenanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const maintenance = await MaintenanceExpense.findById(id)
      .populate('apartmentId', 'name')
      .populate('waterExpenseId')
      .populate('electricityExpenseId');

    if (!maintenance) return res.status(404).json({ message: 'Maintenance not found' });

    res.json(maintenance);
  } catch (error) {
    console.error('Error fetching maintenance by ID:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};

// 🧾 Get Flat-Wise Maintenance for a Resident
exports.getFlatMaintenance = async (req, res) => {
  try {
    const { flatId } = req.params;
    const records = await MaintenanceExpense.find({ 'flatExpenses.flatId': flatId })
      .populate('apartmentId', 'name')
      .sort({ createdAt: -1 });

    if (!records || records.length === 0)
      return res.status(404).json({ message: 'No maintenance found for this flat' });

    const flatData = records.map(record => {
      const flat = record.flatExpenses.find(f => f.flatId.toString() === flatId);
      return {
        apartmentName: record.apartmentId.name,
        date: record.createdAt,
        details: flat,
        totalMaintenance: record.totalMaintenance,
      };
    });

    res.json(flatData);
  } catch (error) {
    console.error('Error fetching flat maintenance:', error);
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
};
