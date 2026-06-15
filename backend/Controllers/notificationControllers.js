const mongoose = require('mongoose');
const Notification = require('../Models/notifications');


exports.markAllAsRead = async (req, res) => {
  try {
    const { toUser } = req.body;
    if (!toUser) {
      return res.status(400).json({ success: false, message: "User ID required" });
    }

    await Notification.updateMany({ toUser, read: false }, { $set: { read: true } });

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${toUser}`).emit('notification:readAll', { userId: toUser });
    }

    res.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("❌ Error marking notifications as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// ✅ mark single notification as read
exports.markOneAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );

    if (!notification)
      return res.status(404).json({ success: false, message: "Notification not found" });

    const io = req.app.get("io");
    if (io) {
      io.to(`user:${notification.toUser}`).emit("notification:readOne", { id });
    }

    res.json({ success: true, message: "Notification marked as read", notification });
  } catch (error) {
    console.error("❌ Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};





exports.createNotification = async (req, res) => {
  try {
    const { toUser, toRole, title, body, payload, channel } = req.body;
    const cleanChannel = channel?.trim().toLowerCase();

    const notification = new Notification({
      toUser,
      toRole,
      title,
      body,
      payload,
      channel: cleanChannel
    });

    await notification.save();

    
    const io = req.app.get('io');
    if (io) {
      if (toUser) io.to(`user:${toUser}`).emit('notification:new', notification);
      if (toRole) io.to(`role:${toRole}`).emit('notification:new', notification);
      io.emit('notification:created', notification);
    }

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error("❌ Error creating notification:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};



exports.getAllNotifications = async (req, res) => {
  try {
    const { toUser, toRole, status } = req.query;
    const filter = {};
    if (toUser) filter.toUser = toUser;
    if (toRole) filter.toRole = toRole;
    if (status) filter.status = status;

    const notifications = await Notification.find(filter)
      .populate('toUser', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('toUser', 'name email role');
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error("❌ Error fetching notification:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getNotificationsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await Notification.find({ toUser: userId })
      .populate('toUser', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("❌ Error fetching notifications:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.updateNotificationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['queued', 'sent', 'failed'].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { status, sentAt: status === 'sent' ? new Date() : null },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

   
    const io = req.app.get('io');
    if (io) {
      if (notification.toUser) io.to(`user:${notification.toUser}`).emit('notification:updated', notification);
      if (notification.toRole) io.to(`role:${notification.toRole}`).emit('notification:updated', notification);
    }

    res.json({ success: true, notification });
  } catch (error) {
    console.error("❌ Error updating notification:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }

    const io = req.app.get('io');
    if (io) {
      if (notification.toUser) io.to(`user:${notification.toUser}`).emit('notification:deleted', { id: notification._id });
      if (notification.toRole) io.to(`role:${notification.toRole}`).emit('notification:deleted', { id: notification._id });
    }

    res.json({ success: true, message: "Notification deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting notification:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
