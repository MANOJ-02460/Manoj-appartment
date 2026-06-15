const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FeedbackSchema = new Schema({
  serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  vendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' }, // <-- ADD THIS
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true },
  givenBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  givenAt: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Feedback', FeedbackSchema);
