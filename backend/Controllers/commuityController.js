const mongoose = require('mongoose');
const Community = require('../Models/community');

//  Create Community
exports.createCommunity = async (req, res) => {
  try {
    const {
      name,
      address,
      location,
      description,
      admins,
      contactInfo,
      facilities,
      image,
      totalFlats,
      residentsCount
    } = req.body;

    const community = new Community({
      name,
      address,
      location,
      description,
      admins,
      contactInfo,
      facilities,
      image,
      totalFlats,
      residentsCount
    });

    await community.save();

    res.status(201).json({
      success: true,
      message: "Community created successfully",
      community
    });
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({
      success: false,
      message: "Server error while creating community",
      error: error.message
    });
  }
};

//  Get All Communities
exports.getAllCommunities = async (req, res) => {
  try {
    const filter = req.user && req.user.community ? { _id: req.user.community } : {};
    const communities = await Community.find(filter)
      .populate('admins', 'name email role');

    res.json({
      success: true,
      count: communities.length,
      communities
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching communities",
      error: error.message
    });
  }
};

//  Get Community By ID
exports.getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate('admins', 'name email role');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found"
      });
    }

    res.json({
      success: true,
      community
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching community",
      error: error.message
    });
  }
};

//  Update Community
exports.updateCommunity = async (req, res) => {
  try {
    const {
      name,
      address,
      location,
      description,
      admins,
      contactInfo,
      facilities,
      image,
      totalFlats,
      residentsCount
    } = req.body;

    const community = await Community.findByIdAndUpdate(
      req.params.id,
      {
        name,
        address,
        location,
        description,
        admins,
        contactInfo,
        facilities,
        image,
        totalFlats,
        residentsCount
      },
      { new: true, runValidators: true }
    ).populate('admins', 'name email role');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found"
      });
    }

    res.json({
      success: true,
      message: "Community updated successfully",
      community
    });
  } catch (error) {
    console.error("Error updating community:", error);
    res.status(500).json({
      success: false,
      message: "Server error while updating community",
      error: error.message
    });
  }
};

//  Delete Community
exports.deleteCommunity = async (req, res) => {
  try {
    const community = await Community.findByIdAndDelete(req.params.id);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found"
      });
    }

    res.json({
      success: true,
      message: "Community deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting community:", error);
    res.status(500).json({
      success: false,
      message: "Server error while deleting community",
      error: error.message
    });
  }
};

//  Add Admin to Community
exports.addAdminToCommunity = async (req, res) => {
  try {
    const { adminId } = req.body;

    const community = await Community.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { admins: adminId } }, // prevent duplicates
      { new: true }
    ).populate('admins', 'name email role');

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found"
      });
    }

    res.json({
      success: true,
      message: "Admin added to community successfully",
      community
    });
  } catch (error) {
    console.error("Error adding admin to community:", error);
    res.status(500).json({
      success: false,
      message: "Server error while adding admin",
      error: error.message
    });
  }
};
