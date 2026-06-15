const mongoose = require('mongoose');
const Apartment = require("../Models/apartments");

// ✅ Create Apartment
exports.createApartment = async (req, res) => {
  try {
    if (req.user && req.user.community) {
      req.body.community = req.user.community;
    }
    const apartment = new Apartment(req.body);
    await apartment.save();

    return res.status(201).json({
      success: true,
      message: "Apartment created successfully",
      data: apartment
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ Get All Apartments
exports.getApartments = async (req, res) => {
  try {
    const query = req.user && req.user.community ? { community: req.user.community } : {};
    const apartments = await Apartment.find(query)
      .populate("community", "name address")
      .populate("subAdmin", "name email role")
      .populate("flats", "number block floor flatType owners residents");

    return res.status(200).json({
      success: true,
      count: apartments.length,
      data: apartments
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Get Single Apartment by ID
exports.getApartmentById = async (req, res) => {
  try {
    const apartment = await Apartment.findById(req.params.id)
      .populate("community", "name address")
      .populate("subAdmin", "name email role")
      .populate("flats", "number block floor flatType owners residents");

    if (!apartment) {
      return res.status(404).json({ success: false, error: "Apartment not found" });
    }

    return res.status(200).json({ success: true, data: apartment });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Update Apartment
exports.updateApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate("community", "name address")
      .populate("subAdmin", "name email role")
      .populate("flats", "number block floor flatType owners residents");

    if (!apartment) {
      return res.status(404).json({ success: false, error: "Apartment not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Apartment updated successfully",
      data: apartment
    });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ Delete Apartment
exports.deleteApartment = async (req, res) => {
  try {
    const apartment = await Apartment.findByIdAndDelete(req.params.id);
    if (!apartment) {
      return res.status(404).json({ success: false, error: "Apartment not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Apartment deleted successfully"
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ Add Flat to Apartment (manual add if needed)
exports.addFlatToApartment = async (req, res) => {
  try {
    const { flatId } = req.body;

    const apartment = await Apartment.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { flats: flatId } },
      { new: true }
    )
      .populate("community", "name address")
      .populate("subAdmin", "name email role")
      .populate("flats", "number block floor flatType owners residents");

    if (!apartment) {
      return res.status(404).json({ success: false, message: "Apartment not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Flat added to apartment successfully",
      data: apartment
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};
