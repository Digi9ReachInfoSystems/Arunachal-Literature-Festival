import Speaker from "../models/speakerModel.js";
import SpeakerYear from "../models/speakerYearModel.js";
import fs from "fs";
import path from "path";
import multer from "multer";
import { deleteLocalByUrl, getUploadsRoot } from "../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");

const uploadFileToLocal = async (file, folder) => {
  const fileName = Date.now() + path.extname(file.originalname);
  const uploadDir = path.join(getUploadsRoot(), folder);
  const destination = path.join(uploadDir, fileName);

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  fs.writeFileSync(destination, file.buffer);
  return `/uploads/${folder}/${fileName}`;
};

export const addSpeaker = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) {
          console.error("Multer error:", err);
          return reject(new Error("File upload failed: " + err.message));
        }
        resolve();
      });
    });

    const { yearId } = req.params;
    const { name, about } = req.body;
    const file = req.file;

    const speakerYear = await SpeakerYear.findById(yearId);
    if (!speakerYear) {
      return res.status(404).json({ message: "Speaker year not found" });
    }

    let imageUrl = "";
    if (file) {
      imageUrl = await uploadFileToLocal(file, "Speaker");
    }

    const speaker = new Speaker({
      year_ref: yearId,
      name,
      about,
      image_url: imageUrl || undefined,
    });

    await speaker.save();
    res.status(201).json({
      message: "Speaker added successfully",
      speaker: speaker.toObject(),
    });
  } catch (error) {
    console.error("Error adding speaker:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

const buildGroupedResponse = async (filter = {}) => {
  const years = await SpeakerYear.find().sort({ year: -1 });
  const speakers = await Speaker.find(filter).select("-event_ref");

  const speakersByYear = speakers.reduce((acc, speaker) => {
    const yearId = speaker.year_ref?.toString();
    if (!yearId) return acc;
    if (!acc[yearId]) acc[yearId] = [];
    acc[yearId].push(speaker);
    return acc;
  }, {});

  return years.map((y) => ({
    _id: y._id,
    year: y.year,
    label: y.label,
    isActive: y.isActive,
    speakers: speakersByYear[y._id.toString()] || [],
  }));
};

export const getSpeaker = async (req, res) => {
  try {
    const years = await buildGroupedResponse();
    res.status(200).json({ years });
  } catch (error) {
    console.error("Error getting speaker:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSpeakerByYear = async (req, res) => {
  try {
    const { yearId } = req.params;

    const speakerYear = await SpeakerYear.findById(yearId);
    if (!speakerYear) {
      return res.status(404).json({ message: "Speaker year not found" });
    }

    const speakers = await Speaker.find({ year_ref: yearId }).select("-event_ref");

    res.status(200).json({
      _id: speakerYear._id,
      year: speakerYear.year,
      label: speakerYear.label,
      isActive: speakerYear.isActive,
      speakers,
    });
  } catch (error) {
    console.error("Error getting speakers by year:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSpeaker = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    const { speakerId } = req.params;
    const speaker = await Speaker.findById(speakerId);
    if (!speaker) {
      return res.status(404).json({ message: "Speaker not found" });
    }

    const { name, about, yearId } = req.body;
    const file = req.file;
    let newImageUrl = speaker.image_url;

    if (file && file.buffer) {
      if (speaker.image_url) {
        await deleteLocalByUrl(speaker.image_url);
      }
      newImageUrl = await uploadFileToLocal(file, "Speaker");
    }

    const updateData = {
      name: name?.trim() || speaker.name,
      about: about?.trim() || speaker.about,
      image_url: newImageUrl,
    };

    if (yearId) {
      const speakerYear = await SpeakerYear.findById(yearId);
      if (!speakerYear) {
        return res.status(404).json({ message: "Speaker year not found" });
      }
      updateData.year_ref = yearId;
    }

    const updatedSpeaker = await Speaker.findByIdAndUpdate(
      speakerId,
      updateData,
      { new: true }
    );

    res.status(200).json({ message: "Speaker updated successfully", updatedSpeaker });
  } catch (error) {
    console.error("Error updating speaker:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSpeaker = async (req, res) => {
  const speakerId = req.params.speakerId;
  try {
    const speaker = await Speaker.findById(speakerId);
    if (!speaker) {
      return res.status(404).json({ message: "Speaker not found" });
    }

    if (speaker.image_url) {
      await deleteLocalByUrl(speaker.image_url);
    }
    await Speaker.findByIdAndDelete(speakerId);
    res.status(200).json({ message: "Speaker deleted successfully" });
  } catch (error) {
    console.error("Error deleting speaker:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
