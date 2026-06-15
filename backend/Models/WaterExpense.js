const mongoose = require('mongoose');
const { Schema } = mongoose;

const TankerSchema = new Schema({
  date: { type: Date, required: true },
  tankerType: { type: String, enum: ['bore', 'manjeera'], required: true },
  tankers: { type: Number, required: true },              // count of tankers (can be 0.5 etc)
  capacity: { type: Number, required: true },             // capacity per tanker in liters
  perLiterCost: { type: Number, required: true },         // cost per liter for that record
  totalCost: { type: Number, required: true },            // derived: tankers * capacity * perLiterCost
  totalLitres: { type: Number, required: true }           // derived: tankers * capacity
});

const WaterExpenseSchema = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
  apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true, index: true },
  month: { type: String, index: true }, // e.g. "2025-08"
  totalTankers: { type: Number, default: 0 },
  totalLitres: { type: Number, default: 0 },
  totalCost: { type: Number, default: 0 },
  ratePerLitre: { type: Number, default: 0 },              // totalCost / totalLitres
  bore: [TankerSchema],
  manjeera: [TankerSchema],
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WaterExpense', WaterExpenseSchema);
