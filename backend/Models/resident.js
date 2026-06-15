const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResidentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },                     // Link to user account  //
  apartment: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },           // Apartment they belong to  //
  flat: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },                     // Specific flat the resident occupies  //
  community: { type: Schema.Types.ObjectId, ref: 'Community' },                           // Optional — helps when querying by community  //
  isVerified: { type: Boolean, default: false },                                          // Verified by Apartment/Sub Admin   //
  role: { type: String, enum: ['Owner', 'Tenant', 'Family Member', 'Committee Member'], default: 'Tenant' }, // Role of the resident in the flat  //
  roleInCommittee: { type: String, trim: true },                                          //  "President", "Treasurer", "Secretary"  //
  joinedDate: { type: Date, default: Date.now },
  exitDate: { type: Date },
  emergencyContact: {name: { type: String, trim: true },phone: { type: String, trim: true }},
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Optional index for faster lookups per apartment or flat
ResidentSchema.index({ apartment: 1, flat: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Resident', ResidentSchema);
