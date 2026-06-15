const mongoose = require('mongoose');
const Timeline = require('../Models/timeline'); 


exports.createTimeline = async (req, res) => {
  try {
    const { serviceRequestId, status, by, note, attachments } = req.body;

    const timeline = new Timeline({
      serviceRequestId,
      status,
      by,
      note,
      attachments
    });

    const savedTimeline = await timeline.save();
    res.status(201).json({ success: true, timeline: savedTimeline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};


exports.getAllTimelines = async (req, res) => {
  try {
    const timelines = await Timeline.find()
      .populate('serviceRequestId', 'title status') // populate with fields from ServiceRequest
      .populate('by', 'name email'); // populate user info

    res.status(200).json({ success: true, timelines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};


exports.getTimelineById = async (req, res) => {
  try {
    const { id } = req.params;
    const timeline = await Timeline.findById(id)
      .populate('serviceRequestId', 'title status')
      .populate('by', 'name email');

    if (!timeline) {
      return res.status(404).json({ success: false, message: 'Timeline not found' });
    }

    res.status(200).json({ success: true, timeline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};


exports.updateTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, attachments, by } = req.body;

    const updatedTimeline = await Timeline.findByIdAndUpdate(
      id,
      { status, note, attachments, by },
      { new: true }
    );

    if (!updatedTimeline) {
      return res.status(404).json({ success: false, message: 'Timeline not found' });
    }

    res.status(200).json({ success: true, timeline: updatedTimeline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};


exports.deleteTimeline = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTimeline = await Timeline.findByIdAndDelete(id);

    if (!deletedTimeline) {
      return res.status(404).json({ success: false, message: 'Timeline not found' });
    }

    res.status(200).json({ success: true, message: 'Timeline deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error', error });
  }
};
