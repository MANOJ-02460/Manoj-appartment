const mongoose = require('mongoose');
const { Schema } = mongoose;

const WaterReadingSchema = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
  flatId: {
    type: Schema.Types.ObjectId,
    ref: 'Flat',
    required: true
  },
  apartmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Apartment',
    required: true
  },
  previousReading: {
    type: Number,
    required: true,
    default: 0
  },
  currentReading: {
    type: Number,
    required: true,
    default: 0
  },
  usage: {
    type: Number,
    default: 0
  },
  month: {
    type: String,
    required: true,
    trim: true // e.g., "2025-08"
  },
  meterPhoto: {
    imageUrl: String,
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: Date
  },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Verified'],
    default: 'Pending'
  },
  notes: {
    type: String,
    trim: true
  },
  submittedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  enteredBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

// Pre-save hook to automatically calculate usage
WaterReadingSchema.pre('save', function (next) {
  this.usage = Math.max(0, this.currentReading - this.previousReading);
  next();
});

// A flat can only have one water reading per month
WaterReadingSchema.index({ flatId: 1, month: 1 }, { unique: true });
// Optimize searching by apartment and month
WaterReadingSchema.index({ apartmentId: 1, month: 1 });

module.exports = mongoose.model('WaterReading', WaterReadingSchema);
