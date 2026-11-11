import Workshop from "../models/registrationModel.js";
import SectionTitle from "../models/sectionTitleModel.js";
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

// ---- Children's Corner section title (admin editable) ----
const SECTION_TITLE_KEY = "childrensCorner";
const DEFAULT_SECTION_TITLE = "CHILDREN'S CORNER";

export const getSectionTitle = async (req, res) => {
  try {
    const doc = await SectionTitle.findOne({ key: SECTION_TITLE_KEY });
    res.status(200).json({ title: doc?.title || DEFAULT_SECTION_TITLE });
  } catch (error) {
    console.error("Error getting section title:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSectionTitle = async (req, res) => {
  try {
    const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (title.length > 100) {
      return res.status(400).json({ message: "Title must be 100 characters or less" });
    }
    const doc = await SectionTitle.findOneAndUpdate(
      { key: SECTION_TITLE_KEY },
      { title },
      { new: true, upsert: true, runValidators: true }
    );
    res.status(200).json({ message: "Title updated successfully", title: doc.title });
  } catch (error) {
    console.error("Error updating section title:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
