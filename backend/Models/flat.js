const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FlatSchema = new Schema({
  community: { type: Schema.Types.ObjectId, ref: 'Community' },
  apartment: { type: Schema.Types.ObjectId, ref: 'Apartment', required: true },
  number: { type: String, required: true, trim: true }, // "A-101"
  block: { type: String, trim: true },
  floor: { type: Number, default: 0 },
  flatType: { type: String, enum: ['1BHK', '2BHK', '3BHK', 'Villa', 'Penthouse'], default: '2BHK' },
  sizeSqFt: { type: Number, default: 0 },
  owners: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  residents: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  parkingSlots: [
    {
      number: { type: String, required: true },
      type: { type: String, enum: ['Car', 'Bike', 'Other'], default: 'Car' }
    }
  ],
  isRented: { type: Boolean, default: false },
  maintenanceDue: { type: Number, default: 0 },
  status: { type: String, enum: ['Occupied', 'Vacant', 'Under Maintenance'], default: 'Vacant' },
  lastMaintenancePaidDate: { type: Date },
  notes: { type: String, trim: true },
  waterMeter: {
    previous: { type: Number, default: 0 },
    current: { type: Number, default: 0 }
  },

  createdAt: { type: Date, default: Date.now }
});

FlatSchema.index({ apartment: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Flat', FlatSchema);
