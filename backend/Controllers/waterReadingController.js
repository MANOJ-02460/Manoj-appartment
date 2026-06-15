const WaterReading = require('../Models/WaterReading');
const Flat = require('../Models/flat');
const MaintenanceExpense = require('../Models/MaintenanceExpense');
const mongoose = require('mongoose');
const { recalculateMaintenanceHelper } = require('./maintenanceExpenseController');

// Create a new water reading
exports.createWaterReading = async (req, res) => {
  try {
    const { flatId, apartmentId, previousReading, currentReading, month, meterPhoto, status, notes } = req.body;
    const submittedBy = req.user ? req.user._id : req.body.submittedBy;

    if (!flatId || !apartmentId || !month) {
      return res.status(400).json({ success: false, message: 'flatId, apartmentId, and month are required' });
    }

    if (Number(currentReading) < Number(previousReading)) {
      return res.status(400).json({ success: false, message: 'Current reading cannot be less than previous reading' });
    }

    // Ensure flat exists
    const flat = await Flat.findById(flatId);
    if (!flat) {
      return res.status(404).json({ success: false, message: 'Flat not found' });
    }

    // Upsert logic: If reading for this month exists, update it, otherwise create it
    let reading = await WaterReading.findOne({ flatId, month });

    if (reading) {
      reading.previousReading = previousReading;
      reading.currentReading = currentReading;
      if (meterPhoto !== undefined) reading.meterPhoto = meterPhoto;
      if (status) reading.status = status;
      if (notes !== undefined) reading.notes = notes;
      reading.enteredBy = submittedBy;
      await reading.save(); // pre-save hook handles usage calculation
    } else {
      reading = new WaterReading({
        flatId,
        apartmentId,
        previousReading,
        currentReading,
        month,
        meterPhoto,
        status: status || 'Pending',
        notes,
        enteredBy: submittedBy
      });
      await reading.save();
    }

    // Optional: Also update the latest reading on the Flat model for quick reference
    flat.waterMeter = {
      previous: previousReading,
      current: currentReading
    };
    await flat.save();

    // 🌟 CASCADE UPDATE: Auto-sync linked maintenance bills!
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const linkedMaintenance = await MaintenanceExpense.findOne({ apartmentId, month }).session(session);
      if (linkedMaintenance) {
        await recalculateMaintenanceHelper(linkedMaintenance._id, session);
      }
      await session.commitTransaction();
    } catch (calcError) {
      console.error("Cascade recalculation error:", calcError);
      await session.abortTransaction();
    } finally {
      session.endSession();
    }

    res.status(201).json({
      success: true,
      message: 'Water reading saved successfully',
      reading
    });
  } catch (error) {
    console.error('Error creating water reading:', error);
    // Handle unique constraint error
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Reading for this month already exists' });
    }
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get all water readings for a specific apartment and month
exports.getWaterReadingsByApartmentAndMonth = async (req, res) => {
  try {
    const { apartmentId, month } = req.params;

    const readings = await WaterReading.find({ apartmentId, month })
      .populate('flatId', 'number block')
      .populate('submittedBy', 'name email');

    res.json({
      success: true,
      readings
    });
  } catch (error) {
    console.error('Error fetching water readings:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get all historical water readings for a specific flat
exports.getWaterReadingsByFlat = async (req, res) => {
  try {
    const { flatId } = req.params;

    const readings = await WaterReading.find({ flatId })
      .sort({ month: -1 })
      .populate('submittedBy', 'name email');

    res.json({
      success: true,
      readings
    });
  } catch (error) {
    console.error('Error fetching flat water readings:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Delete a water reading
exports.deleteWaterReading = async (req, res) => {
  try {
    const { id } = req.params;

    const reading = await WaterReading.findByIdAndDelete(id);

    if (!reading) {
      return res.status(404).json({ success: false, message: 'Water reading not found' });
    }

    res.json({
      success: true,
      message: 'Water reading deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting water reading:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Get water reading history for a specific flat (Last 6 months)
exports.getWaterReadingHistory = async (req, res) => {
  try {
    const { flatId } = req.params;
    const readings = await WaterReading.find({ flatId })
      .sort({ month: -1 })
      .limit(6)
      .select('month previousReading currentReading usage status meterPhoto notes enteredBy createdAt')
      .populate('enteredBy', 'name email');

    res.json({ success: true, history: readings });
  } catch (error) {
    console.error('Error fetching water reading history:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
