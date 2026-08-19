import { ScheduleDayPreview } from "../models/eventModel.js";
import multer from "multer";
import { saveBufferToLocal, saveMultipleToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).fields([
  { name: "images", maxCount: 20 },
  { name: "pdf", maxCount: 1 },
]);

const handleFileUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return reject(new Error("File upload failed: " + err.message));
      }
      resolve();
    });
  });
};

const parseDayNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : NaN;
};

export const getScheduleDayPreviews = async (req, res) => {
  try {
    const days = await ScheduleDayPreview.find().sort({ dayNumber: 1 });
    res.status(200).json({
      success: true,
      data: days,
    });
  } catch (error) {
    console.error("Error getting schedule day previews:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const addScheduleDayPreview = async (req, res) => {
  try {
    const isMultipart = req.headers["content-type"]?.includes("multipart/form-data");
    if (isMultipart) {
      await handleFileUpload(req, res);
    }

    const dayNumber = parseDayNumber(req.body.dayNumber);
    if (!Number.isInteger(dayNumber)) {
      return res.status(400).json({
        success: false,
        message: "A valid day number is required",
      });
    }

    const existing = await ScheduleDayPreview.findOne({ dayNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Day ${dayNumber} already exists`,
      });
    }

    const label = (req.body.label || "").trim() || `DAY ${dayNumber}`;
    const imageFiles = req.files?.images || [];
    const pdfFile = req.files?.pdf?.[0];

    const images = imageFiles.length
      ? await saveMultipleToLocal(imageFiles, "ScheduleDay")
      : [];

    let downloadUrl;
    if (pdfFile) {
      downloadUrl = await saveBufferToLocal(pdfFile, "ScheduleDay/pdf");
    }

    const day = await ScheduleDayPreview.create({
      dayNumber,
      label,
      images,
      downloadUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Schedule day added successfully",
      data: day,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A schedule day with this number already exists",
      });
    }
    console.error("Error adding schedule day preview:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const updateScheduleDayPreview = async (req, res) => {
  try {
    await handleFileUpload(req, res);

    const { id } = req.params;
    const day = await ScheduleDayPreview.findById(id);
    if (!day) {
      return res.status(404).json({
        success: false,
        message: "Schedule day not found",
      });
    }

    if (req.body.dayNumber !== undefined && req.body.dayNumber !== "") {
      const dayNumber = parseDayNumber(req.body.dayNumber);
      if (!Number.isInteger(dayNumber)) {
        return res.status(400).json({
          success: false,
          message: "A valid day number is required",
        });
      }
      if (dayNumber !== day.dayNumber) {
        const clash = await ScheduleDayPreview.findOne({ dayNumber });
        if (clash) {
          return res.status(400).json({
            success: false,
            message: `Day ${dayNumber} already exists`,
          });
        }
        day.dayNumber = dayNumber;
      }
    }

    if (req.body.label !== undefined) {
      const trimmed = req.body.label.trim();
      day.label = trimmed || `DAY ${day.dayNumber}`;
    }

    const imageFiles = req.files?.images || [];
    if (imageFiles.length) {
      const newUrls = await saveMultipleToLocal(imageFiles, "ScheduleDay");
      day.images = [...(day.images || []), ...newUrls];
    }

    const pdfFile = req.files?.pdf?.[0];
    if (pdfFile) {
      if (day.downloadUrl) {
        try {
          await deleteLocalByUrl(day.downloadUrl);
        } catch (e) {
          console.error("PDF delete failed (continuing):", e?.message || e);
        }
      }
      day.downloadUrl = await saveBufferToLocal(pdfFile, "ScheduleDay/pdf");
    }

    day.updatedAt = new Date();
    await day.save();

    res.status(200).json({
      success: true,
      message: "Schedule day updated successfully",
      data: day,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A schedule day with this number already exists",
      });
    }
    console.error("Error updating schedule day preview:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const removeScheduleDayImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "imageUrl is required",
      });
    }

    const day = await ScheduleDayPreview.findById(id);
    if (!day) {
      return res.status(404).json({
        success: false,
        message: "Schedule day not found",
      });
    }

    if (!day.images?.includes(imageUrl)) {
      return res.status(404).json({
        success: false,
        message: "Image not found on this day",
      });
    }

    try {
      await deleteLocalByUrl(imageUrl);
    } catch (e) {
      console.error("Image delete failed (continuing):", e?.message || e);
    }

    day.images = day.images.filter((url) => url !== imageUrl);
    day.updatedAt = new Date();
    await day.save();

    res.status(200).json({
      success: true,
      message: "Image removed successfully",
      data: day,
    });
  } catch (error) {
    console.error("Error removing schedule day image:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const reorderScheduleDayImages = async (req, res) => {
  try {
    const { id } = req.params;
    const { images } = req.body;

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        success: false,
        message: "images array is required",
      });
    }

    const day = await ScheduleDayPreview.findById(id);
    if (!day) {
      return res.status(404).json({
        success: false,
        message: "Schedule day not found",
      });
    }

    const current = day.images || [];
    const sameLength = images.length === current.length;
    const sameSet =
      sameLength &&
      current.every((url) => images.includes(url)) &&
      images.every((url) => current.includes(url));

    if (!sameSet) {
      return res.status(400).json({
        success: false,
        message: "images must be a reorder of the existing files",
      });
    }

    day.images = images;
    day.updatedAt = new Date();
    await day.save();

    res.status(200).json({
      success: true,
      message: "Image order updated",
      data: day,
    });
  } catch (error) {
    console.error("Error reordering schedule day images:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const deleteScheduleDayPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const day = await ScheduleDayPreview.findById(id);
    if (!day) {
      return res.status(404).json({
        success: false,
        message: "Schedule day not found",
      });
    }

    const files = [...(day.images || [])];
    if (day.downloadUrl) files.push(day.downloadUrl);

    for (const url of files) {
      try {
        await deleteLocalByUrl(url);
      } catch (e) {
        console.error("File delete failed (continuing):", e?.message || e);
      }
    }

    const deleted = await ScheduleDayPreview.findByIdAndDelete(id);
    res.status(200).json({
      success: true,
      message: "Schedule day deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting schedule day preview:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
