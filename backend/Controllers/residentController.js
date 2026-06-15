const mongoose = require('mongoose');
const Resident = require('../Models/resident');
const Flat = require('../Models/flat');
const Apartment = require('../Models/apartments');

// ✅ Create Resident (auto-link to Flat)
exports.createResident = async (req, res) => {
  try {
    const { user, apartment, flat, community, role, roleInCommittee, isVerified, emergencyContact } = req.body;

    if (!user || !apartment || !flat) {
      return res.status(400).json({
        success: false,
        message: "user, apartment, and flat fields are required"
      });
    }

    // Check if user already registered for the same flat
    const existingResident = await Resident.findOne({ user, flat });
    if (existingResident) {
      return res.status(400).json({
        success: false,
        message: "Resident already exists for this flat"
      });
    }

    const resident = new Resident({
      user,
      apartment,
      flat,
      community: req.user && req.user.community ? req.user.community : community,
      role,
      roleInCommittee,
      isVerified: isVerified || false,
      emergencyContact
    });

    await resident.save();

    // ✅ Automatically add user to Flat.residents
    await Flat.findByIdAndUpdate(flat, {
      $addToSet: { residents: user }
    });

    const populatedResident = await Resident.findById(resident._id)
      .populate('user', 'name email phone role')
      .populate('apartment', 'name address')
      .populate('flat', 'number block floor flatType')
      .populate('community', 'name location');

    res.status(201).json({
      success: true,
      message: "Resident created and linked to flat successfully",
      resident: populatedResident
    });
  } catch (error) {
    console.error("Error creating resident:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get All Residents (filter by apartment, flat, or community)
exports.getAllResidents = async (req, res) => {
  try {
    const { apartment, flat, community } = req.query;
    const filter = {};
    if (apartment) filter.apartment = apartment;
    if (flat) filter.flat = flat;
    if (req.user && req.user.community) {
      filter.community = req.user.community;
    } else if (community) {
      filter.community = community;
    }

    const residents = await Resident.find(filter)
      .populate('user', 'name email phone role')
      .populate('apartment', 'name address')
      .populate('flat', 'number block floor flatType')
      .populate('community', 'name location');

    res.json({ success: true, count: residents.length, residents });
  } catch (error) {
    console.error("Error fetching residents:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Get Resident by ID
exports.getResidentById = async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id)
      .populate('user', 'name email phone role')
      .populate('apartment', 'name address')
      .populate('flat', 'number block floor flatType')
      .populate('community', 'name location');

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found"
      });
    }

    res.json({ success: true, resident });
  } catch (error) {
    console.error("Error fetching resident:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Update Resident (handle flat changes)
exports.updateResident = async (req, res) => {
  try {
    const { id } = req.params;
    const { flat, user } = req.body;

    // Find existing resident
    const existingResident = await Resident.findById(id);
    if (!existingResident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found"
      });
    }

    const oldFlatId = existingResident.flat?.toString();

    // Update resident record
    const resident = await Resident.findByIdAndUpdate(id, req.body, { new: true })
      .populate('user', 'name email phone role')
      .populate('apartment', 'name address')
      .populate('flat', 'number block floor flatType')
      .populate('community', 'name location');

    // ✅ If flat changed, update both flats
    if (flat && flat !== oldFlatId) {
      // Remove from old flat
      await Flat.findByIdAndUpdate(oldFlatId, {
        $pull: { residents: existingResident.user }
      });

      // Add to new flat
      await Flat.findByIdAndUpdate(flat, {
        $addToSet: { residents: existingResident.user }
      });
    }

    res.json({
      success: true,
      message: "Resident updated successfully",
      resident
    });
  } catch (error) {
    console.error("Error updating resident:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Delete Resident (auto-remove from Flat)
exports.deleteResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndDelete(req.params.id);
    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found"
      });
    }

    // ✅ Remove from Flat.residents
    await Flat.findByIdAndUpdate(resident.flat, {
      $pull: { residents: resident.user }
    });

    res.json({
      success: true,
      message: "Resident deleted and unlinked from flat successfully"
    });
  } catch (error) {
    console.error("Error deleting resident:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};

// ✅ Verify Resident (Admin Action)
exports.verifyResident = async (req, res) => {
  try {
    const resident = await Resident.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    )
      .populate('user', 'name email phone role')
      .populate('apartment', 'name address')
      .populate('flat', 'number block floor flatType')
      .populate('community', 'name location');

    if (!resident) {
      return res.status(404).json({
        success: false,
        message: "Resident not found"
      });
    }

    res.json({
      success: true,
      message: "Resident verified successfully",
      resident
    });
  } catch (error) {
    console.error("Error verifying resident:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message
    });
  }
};



















































// const mongoose = require('mongoose');
// const Resident = require('../Models/resident');
// const Flat = require('../Models/flat');
// const Apartment = require('../Models/apartments');

// // ✅ Create Resident
// exports.createResident = async (req, res) => {
//   try {
//     const { user, apartment, flat, community, role, roleInCommittee, isVerified, emergencyContact } = req.body;

//     if (!user || !apartment || !flat) {
//       return res.status(400).json({
//         success: false,
//         message: "user, apartment, and flat fields are required"
//       });
//     }

//     // Check if user already registered for the same flat
//     const existingResident = await Resident.findOne({ user, flat });
//     if (existingResident) {
//       return res.status(400).json({
//         success: false,
//         message: "Resident already exists for this flat"
//       });
//     }

//     const resident = new Resident({
//       user,
//       apartment,
//       flat,
//       community,
//       role,
//       roleInCommittee,
//       isVerified: isVerified || false,
//       emergencyContact
//     });

//     await resident.save();

//     const populatedResident = await Resident.findById(resident._id)
//       .populate('user', 'name email phone role')
//       .populate('apartment', 'name address')
//       .populate('flat', 'number block floor flatType')
//       .populate('community', 'name location');

//     res.status(201).json({
//       success: true,
//       message: "Resident created successfully",
//       resident: populatedResident
//     });
//   } catch (error) {
//     console.error("Error creating resident:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Get All Residents (filter by apartment, flat, or community)
// exports.getAllResidents = async (req, res) => {
//   try {
//     const { apartment, flat, community } = req.query;
//     const filter = {};
//     if (apartment) filter.apartment = apartment;
//     if (flat) filter.flat = flat;
//     if (community) filter.community = community;

//     const residents = await Resident.find(filter)
//       .populate('user', 'name email phone role')
//       .populate('apartment', 'name address')
//       .populate('flat', 'number block floor flatType')
//       .populate('community', 'name location');

//     res.json({ success: true, count: residents.length, residents });
//   } catch (error) {
//     console.error("Error fetching residents:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Get Resident by ID
// exports.getResidentById = async (req, res) => {
//   try {
//     const resident = await Resident.findById(req.params.id)
//       .populate('user', 'name email phone role')
//       .populate('apartment', 'name address')
//       .populate('flat', 'number block floor flatType')
//       .populate('community', 'name location');

//     if (!resident) {
//       return res.status(404).json({
//         success: false,
//         message: "Resident not found"
//       });
//     }

//     res.json({ success: true, resident });
//   } catch (error) {
//     console.error("Error fetching resident:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Update Resident
// exports.updateResident = async (req, res) => {
//   try {
//     const { user, apartment, flat, community, role, roleInCommittee, isVerified, emergencyContact, isActive } = req.body;

//     const updateData = {};
//     if (user) updateData.user = user;
//     if (apartment) updateData.apartment = apartment;
//     if (flat) updateData.flat = flat;
//     if (community) updateData.community = community;
//     if (role) updateData.role = role;
//     if (roleInCommittee !== undefined) updateData.roleInCommittee = roleInCommittee;
//     if (isVerified !== undefined) updateData.isVerified = isVerified;
//     if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;
//     if (isActive !== undefined) updateData.isActive = isActive;

//     const resident = await Resident.findByIdAndUpdate(req.params.id, updateData, { new: true })
//       .populate('user', 'name email phone role')
//       .populate('apartment', 'name address')
//       .populate('flat', 'number block floor flatType')
//       .populate('community', 'name location');

//     if (!resident) {
//       return res.status(404).json({
//         success: false,
//         message: "Resident not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Resident updated successfully",
//       resident
//     });
//   } catch (error) {
//     console.error("Error updating resident:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Delete Resident
// exports.deleteResident = async (req, res) => {
//   try {
//     const resident = await Resident.findByIdAndDelete(req.params.id);
//     if (!resident) {
//       return res.status(404).json({
//         success: false,
//         message: "Resident not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Resident deleted successfully"
//     });
//   } catch (error) {
//     console.error("Error deleting resident:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };

// // ✅ Verify Resident (Admin Action)
// exports.verifyResident = async (req, res) => {
//   try {
//     const resident = await Resident.findByIdAndUpdate(
//       req.params.id,
//       { isVerified: true },
//       { new: true }
//     )
//       .populate('user', 'name email phone role')
//       .populate('apartment', 'name address')
//       .populate('flat', 'number block floor flatType')
//       .populate('community', 'name location');

//     if (!resident) {
//       return res.status(404).json({
//         success: false,
//         message: "Resident not found"
//       });
//     }

//     res.json({
//       success: true,
//       message: "Resident verified successfully",
//       resident
//     });
//   } catch (error) {
//     console.error("Error verifying resident:", error);
//     res.status(500).json({
//       success: false,
//       message: "Server error",
//       error: error.message
//     });
//   }
// };
