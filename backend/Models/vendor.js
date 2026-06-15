const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VendorSchema = new Schema({
  communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: String,
  category: {
              type: String,
              enum: ['individual','store','supermarket','cleaning','maid','plumber','electrician'],
              required: true
            },
  services: [{ type: String, required: true }],
  assignments: [{
                 apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment' },  // removed required
                 flats: [{ type: Schema.Types.ObjectId, ref: 'Flat' }]
               }],
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  documents: [{                                                                        // ✅ Fix documents type → array of objects with url + type
               url: { type: String, required: true },
               type: { type: String, required: true }
             }],
  currentLoad: { type: Number, default: 0 },
  active: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Vendor', VendorSchema);
