import SpeakerYear from "../models/speakerYearModel.js";
import Speaker from "../models/speakerModel.js";

export const addYear = async (req, res) => {
  try {
    const year = Number(req.body.year);

    if (!year || Number.isNaN(year)) {
      return res.status(400).json({ message: "Year is required and must be a number" });
    }

    const { label, isActive } = req.body;

    const existing = await SpeakerYear.findOne({ year });
    if (existing) {
      return res.status(400).json({ message: `Year ${year} already exists` });
    }

    const speakerYear = new SpeakerYear({
      year,
      label: label || `ALF ${year}`,
      isActive: isActive !== undefined ? isActive : true,
    });

    await speakerYear.save();
    res.status(201).json({
      message: "Speaker year created successfully",
      speakerYear,
    });
  } catch (error) {
    console.error("Error adding speaker year:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getYears = async (req, res) => {
  try {
    const years = await SpeakerYear.find().sort({ year: -1 });
    res.status(200).json({ years });
  } catch (error) {
    console.error("Error getting speaker years:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const { label, isActive } = req.body;

    const speakerYear = await SpeakerYear.findById(yearId);
    if (!speakerYear) {
      return res.status(404).json({ message: "Speaker year not found" });
    }

    if (label !== undefined) speakerYear.label = label;
    if (isActive !== undefined) speakerYear.isActive = isActive;

    await speakerYear.save();
    res.status(200).json({
      message: "Speaker year updated successfully",
      speakerYear,
    });
  } catch (error) {
    console.error("Error updating speaker year:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteYear = async (req, res) => {
  try {
    const { yearId } = req.params;

    const speakerYear = await SpeakerYear.findById(yearId);
    if (!speakerYear) {
      return res.status(404).json({ message: "Speaker year not found" });
    }

    const speakerCount = await Speaker.countDocuments({ year_ref: yearId });
    if (speakerCount > 0) {
      return res.status(400).json({
        message: `Cannot delete year with ${speakerCount} linked speaker(s)`,
        speakerCount,
      });
    }

    await SpeakerYear.findByIdAndDelete(yearId);
    res.status(200).json({ message: "Speaker year deleted successfully" });
  } catch (error) {
    console.error("Error deleting speaker year:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
