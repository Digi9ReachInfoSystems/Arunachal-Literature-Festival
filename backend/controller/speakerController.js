import Speaker from "../models/speakerModel.js";
import fs from 'fs';
import path from "path";
import multer from "multer";
import { deleteLocalByUrl } from "../utils/fileStorage.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");

// Local storage functions
const uploadFileToLocal = async (file, folder) => {
  const fileName = Date.now() + path.extname(file.originalname);
  const uploadDir = path.join(process.cwd(), 'uploads', folder);
  const destination = path.join(uploadDir, fileName);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  // Write file to local storage
  fs.writeFileSync(destination, file.buffer);
  
  // Return local URL
  return `/uploads/${folder}/${fileName}`;
};


export const addSpeaker = async (req, res) => {
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
        const { name, about } = req.body;
        const file = req.file;

        // If image is provided, upload it to local storage
        let imageUrl = '';
        if (file) {
            imageUrl = await uploadFileToLocal(file, "Speaker");
        }

       
        const speaker = new Speaker({
            event_ref: eventId,
            name,
            about,
            image_url: imageUrl || undefined, 
        });

        await speaker.save();
        res.status(201).json({ 
            message: "Speaker added successfully",
            speaker :speaker.toObject()
        });
    } catch (error) {
        console.error("Error adding speaker:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const getSpeaker = async (req, res) =>{
    try {
        const speaker = await Speaker.find();
        if (!speaker) {
            return res.status(404).json({ message: "Speaker not found" });
        }
        res.status(200).json({ message: "Speaker found", speaker });
    } catch (error) {
        console.error("Error getting speaker:", error.message);
        res.status(500).json({ message: "Server error" });
    }

}
export const updateSpeaker = async (req, res) =>{
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
        const {speakerId} = req.params;
        const speaker = await Speaker.findById(speakerId);
        if (!speaker) {
            return res.status(404).json({ message: "Speaker not found" });
            }
        const { name, about } = req.body;
        const file = req.file;
        let newImageUrl = speaker.image_url; 
        if (file && file.buffer) {
            // Delete old image from local storage if it exists
            if (speaker.image_url) {
                await deleteLocalByUrl(speaker.image_url);
            }

            // Upload the new image to local storage
            newImageUrl = await uploadFileToLocal(file, "Speaker");
        }
        const updatedSpeaker = await Speaker.findByIdAndUpdate(
            speakerId,
            {
                name: name?.trim() || speaker.name,
                about: about?.trim() || speaker.about,
                image_url: newImageUrl,
            },
            { new: true }
            );
        res.status(200).json({ message: "Speaker updated successfully", updatedSpeaker });
    } catch (error) {
        console.error("Error updating speaker:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}
export const deleteSpeaker = async (req, res) =>{
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
            }
            catch (error) {
                console.error("Error deleting speaker:", error.message);
                res.status(500).json({ message: "Server error" });
            }
}