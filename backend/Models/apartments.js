const mongoose = require('mongoose');
const { Schema } = mongoose;

const ApartmentSchema = new Schema({
  name: { type: String, required: true, trim: true, unique:true },                   // Apartment Name  //
  address: { type: String, required: true },                            // Address field   //
  location: { type: String, required: true },                           // City/Region   //
  blocks: { type: Number, default: 0 },                                 // Number of blocks   //
  flats: [{ type: Schema.Types.ObjectId, ref: 'Flat' }],
  totalFlats: { type: Number, default: 0 },                             // Total flats   //
  maintenance: { type: Number, default: 0 },                            // Monthly maintenance charge  //
  subAdmin: { type: Schema.Types.ObjectId, ref: 'User' },               // Sub Admin (Apartment Admin)  //
  community: { type: Schema.Types.ObjectId, ref: 'Community' },         // Link to Community  //
  bankDetails: {
    accountName: String,
    accountNumber: String,
    ifsc: String
  },
  settings: {
    allowPets: { type: Boolean, default: false },
    parking: {
      available: { type: Boolean, default: true },
      spots: { type: Number, default: 0 }
    },
    security: {
      securityGuard: { type: Boolean, default: false },
      cctv: { type: Boolean, default: false }
    },
    waterSupply: { type: String, enum: ['24x7', 'Limited'], default: '24x7' }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Apartment', ApartmentSchema);

