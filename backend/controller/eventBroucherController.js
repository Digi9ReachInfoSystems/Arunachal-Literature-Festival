import { EventBroucher } from "../models/eventModel.js";
import path from "path";
import multer from "multer";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "pdf", maxCount: 1 },
]);

const uploadFileLocal = async (file, folder) => saveBufferToLocal(file, folder);
const deleteLocalFile = async (fileUrl) => deleteLocalByUrl(fileUrl);

export const addEventBroucher = async (req, res) => {
  const handleFileUpload = () => {
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

  try {
    await handleFileUpload();

    // Check if file exists (note: you were checking req.file but using req.files later)
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded.",
      });
    }
    const pdfFile = req.files.pdf[0];
    const pdfUrl = await uploadFileLocal(pdfFile, "EventBroucher/pdf");

    // Create record in database
    const eventBroucher = await EventBroucher.create({
      pdf_url: pdfUrl,
    });

    res.status(201).json({
      success: true,
      message: "Event brochure added successfully",
      data: eventBroucher,
    });
  } catch (error) {
    console.error("Error adding event brochure:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getEventBroucher = async (req, res) => {
  try {
    const eventBroucher = await EventBroucher.find();
    if (!eventBroucher) {
      return res.status(404).json({
        success: false,
        message: "Event brochure not found",
      });
    }
    res.status(200).json(eventBroucher);
  } catch (error) {
    console.error("Error getting event brochure:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
export const updateEventBroucher = async (req, res) => {
  const handleFileUpload = () => {
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
  try {
    await handleFileUpload();
    const { id } = req.params;
    const eventBroucher = await EventBroucher.findById(id);
    if (!eventBroucher) {
      return res.status(404).json({
        success: false,
        message: "Event brochure not found",
      });
    }
    if (!req.files || !req.files.pdf) {
      return res.status(400).json({
        success: false,
        message: "No PDF file uploaded.",
      });
    }
    const pdfFile = req.files.pdf[0];
    const deletePromises = [];
    if (eventBroucher.pdf_url) {
      deletePromises.push(deleteLocalFile(eventBroucher.pdf_url));
    }
    await Promise.all(deletePromises);
    const pdfUrl = await uploadFileLocal(pdfFile, "EventBroucher/pdf");
    const updatedBrochure = await EventBroucher.findByIdAndUpdate(
      id,
      { pdf_url: pdfUrl },
      { new: true, runValidators: true }
    );
    res.status(201).json({
      success: true,
      message: "Event brochure updated successfully",
      data: updatedBrochure,
    });
  } catch (error) {
    console.error("Error getting event brochure:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const deleteEventBroucher = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the event brochure
    const eventBrochure = await EventBroucher.findById(id);
    if (!eventBrochure) {
      return res.status(404).json({
        success: false,
        message: "Event brochure not found",
      });
    }

    // 2. Delete associated file from local storage
    if (eventBrochure.pdf_url) {
      try {
        await deleteLocalFile(eventBrochure.pdf_url);
      } catch (e) {
        console.error("File delete failed (continuing with DB delete):", e?.message || e);
      }
    }

    // 3. Delete brochure document from DB and return the deleted document
    const deletedDoc = await EventBroucher.findByIdAndDelete(id);

    if (!deletedDoc) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete event brochure",
      });
    }

    res.status(200).json({
      success: true,
      message: "Event brochure deleted successfully",
      data: deletedDoc,
    });
  } catch (error) {
    console.error("Error deleting event brochure:", error);

    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
