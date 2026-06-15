const Expense = require('../Models/expense');
const MaintenanceExpense = require('../Models/MaintenanceExpense');
const mongoose = require('mongoose');
const { recalculateMaintenanceHelper } = require('./maintenanceExpenseController');

// Create Expense
exports.createExpense = async (req, res) => {
  try {
    const { 
      apartmentId, 
      category, 
      expenseDate, 
      vendor, 
      amount, 
      attachmentUrl, 
      notes, 
      createdBy 
    } = req.body;

    const expense = new Expense({
      apartmentId,
      category,
      expenseDate,
      vendor,
      amount,
      attachmentUrl,
      notes,
      createdBy,
      communityId: req.user && req.user.community ? req.user.community : undefined
    });

    await expense.save();

    // 🌟 CASCADE UPDATE: Auto-sync linked maintenance bills!
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const monthStr = new Date(expenseDate).toISOString().substring(0, 7); // e.g., "2026-08"
      const linkedMaintenance = await MaintenanceExpense.findOne({ apartmentId, month: monthStr }).session(session);
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

    res.status(201).json({ 
      success: true, 
      message: "Expense recorded successfully", 
      expense 
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get All Expenses (optionally filter by apartment)
exports.getAllExpenses = async (req, res) => {
  try {
    const { apartmentId } = req.query;
    const filter = {};
    if (apartmentId) filter.apartmentId = apartmentId;
    if (req.user && req.user.community) filter.communityId = req.user.community;

    const expenses = await Expense.find(filter)
      .populate('apartmentId', 'name address')
      .populate('createdBy', 'name email role')
      .sort({ expenseDate: -1 });

    res.json({ success: true, expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get Single Expense by ID
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('apartmentId', 'name address')
      .populate('createdBy', 'name email role');

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    res.json({ success: true, expense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update Expense
exports.updateExpense = async (req, res) => {
  try {
    const { 
      category, 
      expenseDate, 
      vendor, 
      amount, 
      attachmentUrl, 
      notes 
    } = req.body;

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { category, expenseDate, vendor, amount, attachmentUrl, notes },
      { new: true }
    )
      .populate('apartmentId', 'name address')
      .populate('createdBy', 'name email role');

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // 🌟 CASCADE UPDATE: Auto-sync linked maintenance bills!
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const monthStr = new Date(expense.expenseDate).toISOString().substring(0, 7);
      const linkedMaintenance = await MaintenanceExpense.findOne({ apartmentId: expense.apartmentId, month: monthStr }).session(session);
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
      message: "Expense updated successfully", 
      expense 
    });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Delete Expense
exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // 🌟 CASCADE UPDATE: Auto-sync linked maintenance bills!
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const monthStr = new Date(expense.expenseDate).toISOString().substring(0, 7);
      const linkedMaintenance = await MaintenanceExpense.findOne({ apartmentId: expense.apartmentId, month: monthStr }).session(session);
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

    res.status(200).json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
