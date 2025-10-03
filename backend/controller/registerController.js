import Workshop from "../models/registrationModel.js";
import multer from "multer";
import path from "path";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("imageUrl");

export const addWorkshop = async (req, res) => {
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
    const { eventId } = req.params;
    const { name, about, registrationFormUrl } = req.body;
    const file = req.file;
    let imageUrl = "";
    if (file) {
      imageUrl = await saveBufferToLocal(file, "Workshop");
    }
    const workshop = new Workshop({
      eventRef: eventId,
      name,
      about,
      imageUrl,
      registrationFormUrl,
    });
    await workshop.save();
    res.status(200).json({ message: "Workshop added successfully" });
  } catch (error) {
    console.error("Error adding workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const getWorkshop = async (req, res) => {
  try {
    const workshops = await Workshop.find();
    res.status(200).json(workshops);
  } catch (error) {
    console.error("Error getting workshops:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
export const updateWorkshop = async (req, res) => {
  const handleFileUpload = () => {
    return new Promise((resolve, reject) => {
      upload(req, res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  };
  try {
    await handleFileUpload();
    const { workshopId } = req.params;
    const { name, about, registrationFormUrl } = req.body;
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    const file = req.file;
    let newImageUrl = workshop.imageUrl;
    if (file && file.buffer) {
      if (workshop.imageUrl) {
        await deleteLocalByUrl(workshop.imageUrl);
      }
      newImageUrl = await saveBufferToLocal(file, "Workshop");
    }

    const updatedworkshop = await Workshop.findByIdAndUpdate(
      workshopId,
      {
        name: name?.trim() || workshop.name,
        about: about?.trim() || workshop.about,
        imageUrl: newImageUrl,
        registrationFormUrl: registrationFormUrl,
      },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "workshop updated successfully", updatedworkshop });
  } catch (error) {
    console.error("Error updating workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteWorkshop = async (req, res) => {
  const { workshopId } = req.params;
  try {
    const workshop = await Workshop.findById(workshopId);
    if (!workshop) {
      return res.status(404).json({ message: "Workshop not found" });
    }
    if (workshop.imageUrl) {
      await deleteLocalByUrl(workshop.imageUrl);
    }
    await Workshop.findByIdAndDelete(workshopId);
    res.status(200).json({ message: "Workshop deleted successfully" });
  } catch (error) {
    console.error("Error deleting workshop:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
