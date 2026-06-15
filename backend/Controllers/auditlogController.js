const AuditLog = require('../Models/auditlog');
const Expense = require('../Models/expense');


// Update Expense & Save Audit Log
exports.updateExpense = async (req, res) => {
  try {
    const { amount, purpose, receipts } = req.body;
    const oldExpense = await Expense.findById(req.params.id);

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { amount, purpose, receipts },
      { new: true }
    );

    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }

    // Save audit log
    const newLog = await AuditLog.create({
      actor: req.user?._id || null,
      action: "update",
      collectionName: "Expense",
      documentId: expense._id,
      before: oldExpense,
      after: expense
    });

    console.log("✅ Audit log saved:", newLog); // DEBUG

    res.json({ success: true, message: "Expense updated successfully", expense });
  } catch (error) {
    console.error("Error updating expense:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get All Audit Logs
exports.getAllAuditLogs = async (req, res) => {
  try {
    const { actor, collectionName, action } = req.query;
    const filter = {};

    if (actor) filter.actor = actor;
    if (collectionName) filter.collectionName = collectionName;
    if (action) filter.action = action;

    console.log("📌 AuditLog filter:", filter); // DEBUG

    const logs = await AuditLog.find(filter)
      .populate("actor", "name email role")
      .sort({ createdAt: -1 });

    console.log("📌 Found logs:", logs.length); // DEBUG

    res.json({ success: true, logs });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};





//  Get Single Audit Log  //
exports.getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('actor', 'name email role');

    if (!log) {
      return res.status(404).json({ success: false, message: "Audit log not found" });
    }

    res.json({ success: true, log });
  } catch (error) {
    console.error("Error fetching audit log:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


//  Clear All Audit Logs (Super Admin only)  //
exports.clearAuditLogs = async (req, res) => {
  try {
    await AuditLog.deleteMany({});
    res.json({ success: true, message: "All audit logs cleared" });
  } catch (error) {
    console.error("Error clearing audit logs:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
