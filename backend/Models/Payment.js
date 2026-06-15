const mongoose = require('mongoose');
const { Schema } = mongoose;

const PaymentSchema = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
  maintenanceId: { type: Schema.Types.ObjectId, ref: 'MaintenanceExpense', required: true },
  flatExpenseId: { type: Schema.Types.ObjectId, required: true }, // subdocument _id inside flatExpenses[]
  flatId:        { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
  apartmentId:   { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
  amount:        { type: Number, required: true, min: 0 },
  mode:          { type: String, enum: ['UPI', 'Cash', 'Cheque', 'Bank Transfer'], required: true },
  transactionId: { type: String, trim: true, default: '' },
  paidDate:      { type: Date, default: Date.now },
  recordedBy:    { type: Schema.Types.ObjectId, ref: 'User' },
  notes:         { type: String, trim: true, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
