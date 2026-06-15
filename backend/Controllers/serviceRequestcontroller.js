const mongoose = require('mongoose');
const ServiceRequest = require('../Models/serviceRequest');
const Vendor = require('../Models/vendor');
const User = require('../Models/users');


// ✅ Mark a single service request as read
exports.markServiceAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const service = await ServiceRequest.findByIdAndUpdate(
      id,
      { $set: { read: true } },
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: "Service request not found" });
    }

    // 🔔 Emit socket event if app uses socket.io
    try {
      const io = req.app.get('io');
      if (io && service.createdBy) {
        io.to(`user:${service.createdBy}`).emit('service:readOne', { id });
      }
    } catch (e) {
      console.warn("Socket emit failed:", e);
    }

    res.json({ success: true, message: "Service request marked as read", service });
  } catch (error) {
    console.error("Error marking service request as read:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Create new service request
exports.createServiceRequest = async (req, res) => {
  try {
    const { apartmentId, flatId, createdBy, type, subType, description, attachments, preferredTime } = req.body;

    const request = new ServiceRequest({
      apartmentId,
      flatId,
      createdBy,
      type,
      subType,
      description,
      attachments,
      preferredTime,
      communityId: req.user && req.user.community ? req.user.community : undefined
    });

    await request.save();

    res.status(201).json({
      success: true,
      message: "Service request created successfully",
      request
    });
  } catch (error) {
    console.error("Error creating service request:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get all service requests
exports.getAllServiceRequests = async (req, res) => {
  try {
    const { apartmentId, flatId, status } = req.query;
    const filter = {};

    if (apartmentId) filter.apartmentId = apartmentId;
    if (flatId) filter.flatId = flatId;
    if (status) filter.status = status;
    if (req.user && req.user.community) filter.communityId = req.user.community;

    const requests = await ServiceRequest.find(filter)
      .populate('apartmentId', 'name address')
      .populate('flatId', 'number block floor')
      .populate('createdBy', 'name email phone role')
      .populate('assignedVendorId', 'name phone category services')
      .lean();

    // No need for manual user check; populate handles missing refs
    res.json({ success: true, requests });
  } catch (error) {
    console.error("Error fetching service requests:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get service request by ID
exports.getServiceRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const request = await ServiceRequest.findById(id)
      .populate('apartmentId', 'name address')
      .populate('flatId', 'number block floor')
      .populate('createdBy', 'name email phone role')
      .populate('assignedVendorId', 'name phone category services');

    if (!request) {
      return res.status(404).json({ success: false, message: "Service request not found" });
    }

    res.json({ success: true, request });
  } catch (error) {
    console.error("Error fetching service request:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Assign vendor to request
exports.assignVendor = async (req, res) => {
  try {
    const { vendorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid request ID" });
    }

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { assignedVendorId: vendorId, status: 'Assigned' },
      { new: true }
    ).populate('assignedVendorId', 'name phone category services');

    if (!request) {
      return res.status(404).json({ success: false, message: "Service request not found" });
    }

    res.json({ success: true, message: "Vendor assigned successfully", request });
  } catch (error) {
    console.error("Error assigning vendor:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Get service details (clean structured output)
exports.getServiceDetails = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    const request = await ServiceRequest.findById(id)
      .populate('apartmentId', 'name address')
      .populate('flatId', 'number block floor')
      .populate('createdBy', 'name email phone role')
      .populate('assignedVendorId', 'name phone category services');

    if (!request) {
      return res.status(404).json({ success: false, message: "Service request not found" });
    }

    const responseData = {
      _id: request._id,
      type: request.type,
      subType: request.subType,
      description: request.description,
      status: request.status,
      read: request.read,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      apartment: request.apartmentId || null,
      flat: request.flatId || null,
      createdBy: request.createdBy || null,
      vendor: request.assignedVendorId || null
    };

    res.json({ success: true, serviceRequest: responseData });
  } catch (error) {
    console.error("Error fetching service details:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Update service request status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = [
      'Pending',
      'Assigned',
      'Accepted',
      'InProgress',
      'Completed',
      'Closed',
      'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const request = await ServiceRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Service request not found" });
    }

    res.json({ success: true, message: `Status updated to ${status}`, request });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

// ✅ Delete service request
exports.deleteServiceRequest = async (req, res) => {
  try {
    const request = await ServiceRequest.findByIdAndDelete(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: "Service request not found" });
    }

    res.json({ success: true, message: "Service request deleted successfully" });
  } catch (error) {
    console.error("Error deleting service request:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};
































// const mongoose = require('mongoose');
// const ServiceRequest = require('../Models/serviceRequest');
// const Vendor = require('../Models/vendor');
// const User = require('../Models/users'); 


// // ✅ Mark a single service request as read
// exports.markServiceAsRead = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({ success: false, message: "Invalid ID" });
//     }

//     const service = await ServiceRequest.findByIdAndUpdate(
//       id,
//       { $set: { read: true } },
//       { new: true }
//     );

//     if (!service) {
//       return res.status(404).json({ success: false, message: "Service request not found" });
//     }

//     // if you use Socket.IO and have io on app
//     try {
//       const io = req.app.get('io');
//       if (io && service.createdBy) {
//         io.to(`user:${service.createdBy}`).emit('service:readOne', { id });
//       }
//     } catch (e) {
//       console.warn("Socket emit failed:", e);
//     }

//     res.json({ success: true, message: "Service request marked as read", service });
//   } catch (error) {
//     console.error("Error marking service request as read:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };






// exports.createServiceRequest = async (req, res) => {
//   try {
//     const { apartmentId, flatId, createdBy, type, subType, description, attachments, preferredTime } = req.body;
//     const request = new ServiceRequest({ apartmentId, flatId, createdBy, type, subType, description, attachments, preferredTime });   // aprtment id  optional //

//     await request.save();
//     res.status(201).json({
//       success: true,
//       message: "Service request created successfully",
//       request
//     });
//   } catch (error) {
//     console.error("Error creating service request:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };


// exports.getAllServiceRequests = async (req, res) => {
//   try {
//     const { apartmentId, flatId, status } = req.query;
//     const filter = {};
//     if (apartmentId) filter.apartmentId = apartmentId;
//     if (flatId) filter.flatId = flatId;
//     if (status) filter.status = status;

//     const requests = await ServiceRequest.find(filter)
//       .populate('apartmentId', 'name address')
//       .populate('flatId', 'number block floor')
//       .populate('createdBy', 'name email phone role')
//       .populate('assignedVendorId', 'name phone category services')
//       .lean();

//     const requestsWithUserCheck = await Promise.all(
//       requests.map(async (reqItem) => {
//         if (!reqItem.createdBy && reqItem.createdBy !== undefined) {
//           const user = await User.findById(reqItem.createdBy).select('name email phone role');
//           reqItem.createdBy = user || { message: "User not found / deleted" };
//         }
//         return reqItem;
//       })
//     );

//     res.json({ success: true, requests: requestsWithUserCheck });
//   } catch (error) {
//     console.error("Error fetching service requests:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };




// exports.getServiceRequestById = async (req, res) => {
//   try {
//     const request = await ServiceRequest.findById(req.params.id)
//       .populate('apartmentId', 'name address')
//       .populate('flatId', 'number block floor')
//       .populate('createdBy', 'name email phone role')
//       .populate('assignedVendorId', 'name phone category services');

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found"
//       });
//     }

//     res.json({ success: true, request });
//   } catch (error) {
//     console.error("Error fetching service request:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };




// exports.assignVendor = async (req, res) => {
//   try {
//     const { vendorId } = req.body;

//     const request = await ServiceRequest.findByIdAndUpdate(
//       req.params.id,
//       { assignedVendorId: vendorId, status: 'Assigned', updatedAt: Date.now() },
//       { new: true }
//     ).populate('assignedVendorId', 'name phone category services');

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Vendor assigned successfully",
//       request
//     });
//   } catch (error) {
//     console.error("Error assigning vendor:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };


// exports.getServiceDetails = async (req, res) => {
//   try {
//     const { id } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid Service Request ID format"
//       });
//     }

//     const request = await ServiceRequest.findById(id)
//       .populate('apartmentId', 'name address')
//       .populate('flatId', 'number block floor')
//       .populate('createdBy', 'name email phone role')
//       .populate('assignedVendorId', 'name phone category services');

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found"
//       });
//     }

//     const responseData = {
//       _id: request._id,
//       type: request.type,
//       subType: request.subType,
//       description: request.description,
//       status: request.status,
//       createdAt: request.createdAt,
//       updatedAt: request.updatedAt,
//       apartment: request.apartmentId
//         ? { name: request.apartmentId.name, address: request.apartmentId.address }
//         : null,
//       flat: request.flatId
//         ? { number: request.flatId.number, block: request.flatId.block, floor: request.flatId.floor }
//         : null,
//       createdBy: request.createdBy
//         ? {
//             name: request.createdBy.name,
//             email: request.createdBy.email,
//             phone: request.createdBy.phone,
//             role: request.createdBy.role
//           }
//         : null,
//       vendor: request.assignedVendorId
//         ? {
//             name: request.assignedVendorId.name,
//             phone: request.assignedVendorId.phone,
//             category: request.assignedVendorId.category,
//             services: request.assignedVendorId.services
//           }
//         : null
//     };

//     res.status(200).json({
//       success: true,
//       serviceRequest: responseData
//     });
//   } catch (error) {
//     console.error("Error fetching service details:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };



// exports.updateStatus = async (req, res) => {
//   try {
//     const { status } = req.body;

//     const validStatuses = [
//       'Pending',
//       'Assigned',
//       'Accepted',
//       'InProgress',
//       'Completed',
//       'Closed',
//       'Cancelled'
//     ];

//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid status"
//       });
//     }

//     const request = await ServiceRequest.findByIdAndUpdate(
//       req.params.id,
//       { status, updatedAt: Date.now() },
//       { new: true }
//     );

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: `Status updated to ${status}`,
//       request
//     });
//   } catch (error) {
//     console.error("Error updating status:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };


// exports.deleteServiceRequest = async (req, res) => {
//   try {
//     const request = await ServiceRequest.findByIdAndDelete(req.params.id);

//     if (!request) {
//       return res.status(404).json({
//         success: false,
//         message: "Service request not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Service request deleted successfully"
//     });
//   } catch (error) {
//     console.error("Error deleting service request:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error"
//     });
//   }
// };
