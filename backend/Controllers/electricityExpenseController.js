const ElectricityExpense = require('../Models/ElectricityExpense');
const MaintenanceExpense = require('../Models/MaintenanceExpense');
const mongoose = require('mongoose');
const { recalculateMaintenanceHelper } = require('./maintenanceExpenseController');

// Create Electricity Expense
// Note: totalUsage, totalCost, per-reading usage & cost are auto-calculated by the model's pre-save hook.
exports.createElectricityExpense = async (req, res) => {
  try {
    const { apartmentId, billingMonth, readings, createdBy } = req.body;

    if (!apartmentId) {
      return res.status(400).json({ success: false, message: 'apartmentId is required' });
    }

    if (!readings || !Array.isArray(readings) || readings.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one meter reading is required' });
    }

    if (billingMonth) {
      const existing = await ElectricityExpense.findOne({ apartmentId, billingMonth });
      if (existing) {
        return res.status(400).json({ 
          success: false, 
          message: `An Electricity Bill for ${billingMonth} already exists! Please click 'Edit' on the existing bill to update it instead of creating a duplicate.` 
        });
      }
    }

    // Model pre-save hook auto-calculates: usage, cost per reading, totalUsage, totalCost
    const electricityExpense = new ElectricityExpense({
      apartmentId,
      billingMonth,
      readings,
      createdBy,
    });

    await electricityExpense.save();

    res.status(201).json({
      success: true,
      message: 'Electricity expense record created successfully',
      electricityExpense,
    });
  } catch (error) {
    console.error('Error creating electricity expense:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};


// Get All Electricity Expenses (optionally filter by apartmentId and billingMonth)
exports.getAllElectricityExpenses = async (req, res) => {
  try {
    const { apartmentId, billingMonth } = req.query;
    const query = {};
    if (apartmentId)  query.apartmentId  = apartmentId;
    if (billingMonth) query.billingMonth = billingMonth;

    const records = await ElectricityExpense.find(query)
      .populate('apartmentId', 'name')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, records });
  } catch (error) {
    console.error('Error fetching electricity expenses:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};


// Get Single Electricity Expense by ID
exports.getElectricityExpenseById = async (req, res) => {
  try {
    const record = await ElectricityExpense.findById(req.params.id)
      .populate('apartmentId', 'name')
      .populate('createdBy', 'name email');

    if (!record) {
      return res.status(404).json({ success: false, message: 'Electricity expense not found' });
    }

    res.json({ success: true, record });
  } catch (error) {
    console.error('Error fetching electricity expense:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};


// Update Electricity Expense
// Note: After updating readings, just call .save() — the pre-save hook re-calculates everything.
exports.updateElectricityExpense = async (req, res) => {
  try {
    const { readings, apartmentId, billingMonth, createdBy } = req.body;

    const existing = await ElectricityExpense.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Electricity expense not found' });
    }

    // Update simple fields if provided
    if (apartmentId)  existing.apartmentId  = apartmentId;
    if (billingMonth) existing.billingMonth = billingMonth;
    if (createdBy)    existing.createdBy    = createdBy;

    // Replace the entire readings array.
    // Mongoose automatically handles updating existing subdocuments, adding new ones, and deleting missing ones.
    if (readings && Array.isArray(readings)) {
      existing.readings = readings;
    }

    // pre-save hook fires here: recalculates usage, cost, totalUsage, totalCost
    const updated = await existing.save();

    // 🌟 CASCADE UPDATE: Auto-sync linked maintenance bills!
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const linkedMaintenance = await MaintenanceExpense.findOne({ electricityExpenseId: req.params.id }).session(session);
      if (linkedMaintenance) {
        await recalculateMaintenanceHelper(linkedMaintenance._id, session);
      }
      await session.commitTransaction();
    } catch (calcError) {
      console.error("Cascade recalculation error:", calcError);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }

    res.json({
      success: true,
      message: 'Electricity expense updated successfully',
      electricityExpense: updated,
    });
  } catch (error) {
    console.error('Error updating electricity expense:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};


// Delete Electricity Expense
exports.deleteElectricityExpense = async (req, res) => {
  try {
    const record = await ElectricityExpense.findByIdAndDelete(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Electricity expense not found' });
    }

    // Cascade deletion: Remove electricity charges from any linked Maintenance Bill
    const MaintenanceExpense = require('../Models/MaintenanceExpense');
    const linkedMaintenance = await MaintenanceExpense.findOne({ electricityExpenseId: req.params.id });
    
    if (linkedMaintenance) {
      let totalElecRemoved = 0;
      linkedMaintenance.flatExpenses.forEach(f => {
        totalElecRemoved += f.electricity;
        f.total = +(f.total - f.electricity).toFixed(2);
        f.electricity = 0;
      });
      linkedMaintenance.totalMaintenance = +(linkedMaintenance.totalMaintenance - totalElecRemoved).toFixed(2);
      linkedMaintenance.electricityExpenseId = null;
      await linkedMaintenance.save();
    }

    res.json({ success: true, message: 'Electricity expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting electricity expense:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};
