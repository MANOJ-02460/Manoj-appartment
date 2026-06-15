const mongoose = require('mongoose');
const { Schema } = mongoose;

const ServiceRequestSchema = new Schema(
  {
    communityId: { type: Schema.Types.ObjectId, ref: 'Community' },
    apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment' },
    flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedVendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },

    type: { type: String, required: true },
    subType: String,
    description: String,
    attachments: [{ url: String }],
    preferredTime: Date,

    status: {
      type: String,
      enum: [
        'Pending',
        'Assigned',
        'Accepted',
        'InProgress',
        'Completed',
        'Closed',
        'Cancelled'
      ],
      default: 'Pending'
    },

    read: { type: Boolean, default: false }
  },
  { timestamps: true } // ✅ automatically manages createdAt and updatedAt
);

module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);








// const mongoose = require('mongoose');
// const { Schema } = mongoose;

// const ServiceRequestSchema = new Schema(
//   {
//     apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment' },
//     flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
//     createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//     assignedVendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },

//     type: { type: String, required: true },
//     subType: String,
//     description: String,
//     attachments: [{ url: String }],
//     preferredTime: Date,

//     status: {
//       type: String,
//       enum: [
//         'Pending',
//         'Assigned',
//         'Accepted',
//         'InProgress',
//         'Completed',
//         'Closed',
//         'Cancelled'
//       ],
//       default: 'Pending'
//     },

//     read: { type: Boolean, default: false }
//   },
//   { timestamps: true } // ✅ automatically manages createdAt and updatedAt
// );

// module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);






























// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const ServiceRequestSchema = new Schema({
//   apartmentId: { type: Schema.Types.ObjectId, ref: 'Apartment' },
//   flatId: { type: Schema.Types.ObjectId, ref: 'Flat', required: true },
//   createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, 
//   assignedVendorId: { type: Schema.Types.ObjectId, ref: 'Vendor' },
//   type: { type: String, required: true }, 
//   subType: String, 
//   description: String,
//   attachments: [{ url: String }], 
//   preferredTime: Date,
//   status: { 
//     type: String, 
//     enum: ['Pending','Assigned','Accepted','InProgress','Completed','Closed','Cancelled'], 
//     default: 'Pending' 
//   },
//   createdAt: { type: Date, default: Date.now },
//   updatedAt: Date
// });

// module.exports = mongoose.model('ServiceRequest', ServiceRequestSchema);

