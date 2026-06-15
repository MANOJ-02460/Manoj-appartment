const mongoose = require('mongoose');
const Flat = require('../Models/flat');
const Apartment = require('../Models/apartments');

// ✅ Create Flat
exports.createFlat = async (req, res) => {
  try {
    const {
      apartment,
      number,
      block,
      floor,
      flatType,
      sizeSqFt,
      owners,
      residents,
      parkingSlots,
      isRented,
      maintenanceDue,
      status,
      lastMaintenancePaidDate,
      notes,
      community
    } = req.body;

    if (!apartment || !number) {
      return res.status(400).json({
        success: false,
        message: "Apartment ID and flat number are required"
      });
    }

    // Check if flat already exists
    const existingFlat = await Flat.findOne({ apartment, number });
    if (existingFlat) {
      return res.status(400).json({
        success: false,
        message: "Flat number already exists in this apartment"
      });
    }

    const flat = new Flat({
      community: req.user && req.user.community ? req.user.community : undefined,
      apartment,
      number,
      block,
      floor,
      flatType,
      sizeSqFt,
      owners,
      residents,
      parkingSlots,
      isRented,
      maintenanceDue,
      status,
      lastMaintenancePaidDate,
      notes
    });

    await flat.save();

    // ✅ Add flat reference to Apartment
    await Apartment.findByIdAndUpdate(apartment, {
      $addToSet: { flats: flat._id },
      $inc: { totalFlats: 1 }
    });

    return res.status(201).json({
      success: true,
      message: "Flat created successfully",
      flat
    });
  } catch (error) {
    console.error("Error creating flat:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get All Flats (optional filter by apartment)
exports.getAllFlats = async (req, res) => {
  try {
    const { apartment } = req.query;
    const filter = {
      ...(apartment ? { apartment } : {}),
      ...(req.user && req.user.community ? { community: req.user.community } : {})
    };

    const flats = await Flat.find(filter)
      .populate('apartment', 'name address location')
      .populate('owners', 'name email phone')
      .populate('residents', 'name email phone');

    res.json({
      success: true,
      count: flats.length,
      flats
    });
  } catch (error) {
    console.error("Error fetching flats:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get Flats by Apartment ID
exports.getFlatsByApartmentId = async (req, res) => {
  try {
    const { apartmentId } = req.params;
    const filter = { apartment: apartmentId };
    if (req.user && req.user.community) {
      filter.community = req.user.community;
    }

    const flats = await Flat.find(filter)
      .populate('apartment', 'name address')
      .populate('owners', 'name email phone')
      .populate('residents', 'name email phone');

    if (!flats.length) {
      return res.status(404).json({
        success: false,
        message: "No flats found for this apartment"
      });
    }

    res.json({ success: true, count: flats.length, flats });
  } catch (error) {
    console.error("Error fetching flats by apartmentId:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get Single Flat
exports.getFlatById = async (req, res) => {
  try {
    const flat = await Flat.findById(req.params.id)
      .populate('apartment', 'name address')
      .populate('owners', 'name email phone')
      .populate('residents', 'name email phone');

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found"
      });
    }

    res.json({ success: true, flat });
  } catch (error) {
    console.error("Error fetching flat:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Update Flat
exports.updateFlat = async (req, res) => {
  try {
    const { id } = req.params;

    const flat = await Flat.findByIdAndUpdate(id, req.body, { new: true })
      .populate('apartment', 'name address')
      .populate('owners', 'name email phone')
      .populate('residents', 'name email phone');

    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found"
      });
    }

    res.json({
      success: true,
      message: "Flat updated successfully",
      flat
    });
  } catch (error) {
    console.error("Error updating flat:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};




exports.updateMeterReading = async (req, res) => {
  try {
    const { flatId } = req.params;
    const { previous, current } = req.body;

    if (previous == null || current == null) {
      return res.status(400).json({
        success: false,
        message: "Both previous and current meter readings are required"
      });
    }

    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({ success: false, message: "Flat not found" });
    }

    flat.waterMeter.previous = Number(previous);
    flat.waterMeter.current = Number(current);

    await flat.save();

    res.json({
      success: true,
      message: "Water meter updated successfully",
      flat
    });
  } catch (error) {
    console.error("Error updating meter:", error);
    res.status(500).json({ success:false, message: error.message });
  }
};




exports.resetMeterAfterBilling = async (req, res) => {
  try {
    const { flatId } = req.params;

    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found"
      });
    }

    flat.waterMeter.previous = flat.waterMeter.current;

    await flat.save();

    res.json({
      success: true,
      message: "Meter reset (current → previous)",
      flat
    });
  } catch (error) {
    console.error("Error resetting meter:", error);
    res.status(500).json({ success:false, message:error.message });
  }
};



// ✅ Delete Flat
exports.deleteFlat = async (req, res) => {
  try {
    const { id } = req.params;

    const flat = await Flat.findByIdAndDelete(id);
    if (!flat) {
      return res.status(404).json({
        success: false,
        message: "Flat not found"
      });
    }

    // ✅ Remove flat reference from Apartment
    await Apartment.findByIdAndUpdate(flat.apartment, {
      $pull: { flats: flat._id },
      $inc: { totalFlats: -1 }
    });

    res.json({
      success: true,
      message: "Flat deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting flat:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};
