// models/MaintenanceExpense.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const FlatExpenseSchema = new Schema({
  flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
  flatNo: { type: String },
  previousReading: { type: Number, default: 0 },
  currentReading: { type: Number, default: 0 },
  consumedLiters: { type: Number, default: 0 },
  ratePerLiter: { type: Number, default: 0 },
  waterCost: { type: Number, default: 0 },
  commonWater: { type: Number, default: 0 },
  common: { type: Number, default: 0 },
  electricity: { type: Number, default: 0 },
  security: { type: Number, default: 0 },

  arrears: { type: Number, default: 0 },
  buffer: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  status: { type: String, default: 'unpaid' }, // 'unpaid', 'partial', 'paid'
});

const MaintenanceExpenseSchema = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
  month: { type: String },
  date: { type: Date, default: Date.now },
  common: { type: Number, default: 0 },
  security: { type: Number, default: 0 },
  totalMaintenance: { type: Number, default: 0 },
  totalCommonWaterCost: { type: Number, default: 0 },
  waterExpenseId: { type: Schema.Types.ObjectId, ref: 'WaterExpense' },
  electricityExpenseId: { type: Schema.Types.ObjectId, ref: 'ElectricityExpense' },
  flatExpenses: [FlatExpenseSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('MaintenanceExpense', MaintenanceExpenseSchema);
