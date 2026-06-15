const Feedback = require('../Models/feedback');
const ServiceRequest = require('../Models/serviceRequest');



exports.createFeedback = async (req, res) => {
  try {
    const { serviceRequestId, rating, comment, givenBy } = req.body;

    const serviceRequest = await ServiceRequest.findById(serviceRequestId);

    if (!serviceRequest) {
      return res.status(404).json({ success: false, message: "Service request not found" });
    }

    const feedback = new Feedback({
      serviceRequestId,
      vendorId: serviceRequest.assignedVendorId,    // store vendor ID
      rating,
      comment,
      givenBy
    });

    await feedback.save();

    res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback
    });

  } catch (error) {
    console.error("Error creating feedback:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};




exports.getAllFeedbacks = async (req, res) => {
  try {
    const { serviceRequestId, givenBy, vendorId } = req.query;
    const filter = {};

    if (serviceRequestId) filter.serviceRequestId = serviceRequestId;
    if (givenBy) filter.givenBy = givenBy;
    if (vendorId) filter.vendorId = vendorId;

    const feedbacks = await Feedback.find(filter)
      .populate("serviceRequestId", "type subType status")
      .populate("vendorId", "name phone email category services rating ratingCount")   // populate vendor
      .populate("givenBy", "name email role")
      .sort({ givenAt: -1 });

    res.json({ success: true, feedbacks });

  } catch (error) {
    console.error("Error fetching feedbacks:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate("serviceRequestId", "type subType status")
      .populate("vendorId", "name phone email category services rating ratingCount")   // populate vendor
      .populate("givenBy", "name email role");

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    res.json({ success: true, feedback });

  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



exports.getFeedbackForVendor = async (req, res) => {
  try {
    const vendorId = req.user._id; // vendor logged in

    // 1️⃣ Get all service requests assigned to this vendor
    const serviceRequests = await ServiceRequest.find({
      assignedVendorId: vendorId
    }).select("_id");

    const requestIds = serviceRequests.map(sr => sr._id);

    // 2️⃣ Get feedbacks for those service requests
    const feedbacks = await Feedback.find({
      serviceRequestId: { $in: requestIds }
    })
      .populate("serviceRequestId", "type subType status")
      .populate("vendorId", "name phone email category services rating ratingCount")   // include vendor
      .populate("givenBy", "name email role")
      .sort({ givenAt: -1 });

    res.json({ success: true, feedbacks });

  } catch (error) {
    console.error("Error fetching vendor feedback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




exports.updateFeedback = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ success: false, message: "Feedback not found" });
    }

    if (feedback.givenBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this feedback" });
    }

    feedback.rating = rating ?? feedback.rating;
    feedback.comment = comment ?? feedback.comment;
    feedback.givenAt = Date.now();

    await feedback.save();

    res.json({
      success: true,
      message: "Feedback updated successfully",
      feedback
    });

  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};




exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: "Feedback not found"
      });
    }

    await feedback.deleteOne();

    res.json({
      success: true,
      message: "Feedback deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting feedback:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
