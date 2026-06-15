const mongoose = require('mongoose');
const Vendor = require('../Models/vendor');


exports.createVendor = async (req, res) => {
  try {
    const { createdBy, name, phone, email, category, services, assignments, documents } = req.body;
    const vendor = new Vendor({
      createdBy,name,phone,email,category,services,assignments,documents,
      communityId: req.user && req.user.community ? req.user.community : undefined
    });

    await vendor.save();
    res.status(201).json({ success: true, message: "Vendor created successfully", vendor });
  } catch (error) {
    console.error("Error creating vendor:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};


exports.getAllVendors = async (req, res) => {
  try {
    const { category, active } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (active) filter.active = active;
    if (req.user && req.user.community) filter.communityId = req.user.community;

    const vendors = await Vendor.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignments.apartmentId', 'name address')
      .populate('assignments.flats', 'number block floor flatType');

    res.json({ success: true, vendors });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.getVendorById = async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .populate('createdBy', 'name email role')
      .populate('assignments.apartmentId', 'name address')
      .populate('assignments.flats', 'number block floor flatType');

    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, vendor });
  } catch (error) {
    console.error("Error fetching vendor:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};







exports.updateVendor = async (req, res) => {
  try {
    const { name, phone, email, category, services, assignments, documents, active } = req.body;

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { name, phone, email, category, services, assignments, documents, active },
      { new: true }
    )
      .populate('createdBy', 'name email role')
      .populate('assignments.apartmentId', 'name address')
      .populate('assignments.flats', 'number block floor flatType');

    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, message: "Vendor updated successfully", vendor });
  } catch (error) {
    console.error("Error updating vendor:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.deleteVendor = async (req, res) => {
  try {
    const vendor = await Vendor.findByIdAndDelete(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    res.json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Error deleting vendor:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


exports.updateVendorRating = async (req, res) => {       //  Update Vendor Rating //
  try {
    const { rating } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: "Rating must be between 1 and 5" });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) return res.status(404).json({ success: false, message: "Vendor not found" });

    // Update rating
    vendor.rating = ((vendor.rating * vendor.ratingCount) + rating) / (vendor.ratingCount + 1);
    vendor.ratingCount += 1;

    await vendor.save();
    res.json({ success: true, message: "Vendor rating updated", vendor });
  } catch (error) {
    console.error("Error updating vendor rating:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
