const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  toUser: { type: Schema.Types.ObjectId, ref: 'User' },
  toRole: String,
  title: String,
  body: String,
  payload: Schema.Types.Mixed,
  channel: { 
    type: String, 
    enum: ['firebase', 'whatsapp', 'email', 'sms'], 
    trim: true 
  },
  status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
  sentAt: Date,
  read: { type: Boolean, default: false },     // ✅ Add this field
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);


























// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;

// const NotificationSchema = new Schema({
//   toUser: { type: Schema.Types.ObjectId, ref: 'User' },
//   toRole: String,
//   title: String,
//   body: String,
//   payload: Schema.Types.Mixed,
//   channel: { 
//     type: String, 
//     enum: ['firebase', 'whatsapp', 'email', 'sms'], 
//     trim: true 
//   },
//   status: { type: String, enum: ['queued', 'sent', 'failed'], default: 'queued' },
//   sentAt: Date,
//   createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Notification', NotificationSchema);
