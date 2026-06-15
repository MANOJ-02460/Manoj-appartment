const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommunitySchema = new Schema({
  name: { type: String, required: true, trim: true },                       // Community name //
  address: { type: String, required: true },                                // Full community address //
  location: { type: String },                                               // City or region ( Hyderabad) //
  description: { type: String },                                            // Optional description //
  admins: [{ type: Schema.Types.ObjectId, ref: 'User' }],                   // Admins responsible for this community  //
  contactInfo: {
    phone: String,
    email: String,
    website: String
  },
  facilities: [String],                                                    //  ['Clubhouse', 'Swimming Pool', 'Gym']  //
  image: { type: String },                                                 // Cloudinary / local image URL for the community  //
  totalFlats: { type: Number, default: 0 },                                // Total number of flats  //
  residentsCount: { type: Number, default: 0 },                            // Total number of residents   //

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Community', CommunitySchema);
