const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TimelineSchema = new Schema({
  serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', required: true },
  status: { type: String, required: true },
  by: { type: Schema.Types.ObjectId, ref: 'User' },
  note: String,
  attachments: [{ url: String }],
  at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Timeline', TimelineSchema);
