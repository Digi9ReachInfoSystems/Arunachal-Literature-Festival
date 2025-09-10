import Speaker from "../models/speakerModel.js";
import { bucket } from "../config/firebaseConfig.js";
import path from "path";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");


// export const uplaodImage = async (req, res) => {
//     try {
//         const file = req.file;
//         if(!file) return res.status(400).json({ message: "No file uploaded" });
//         const fileName = Date.now() + path.extname(file.originalname);
//         const fileUpload = bucket.file(fileName);
//         const stream = fileUpload.createWriteStream();
//         stream.on("finish", () => {
//             fileUpload.makePublic().then(() => {
//                 const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
//                 res.status(200).json({ imageUrl });
//             });
//         });
//         stream.end(file.buffer);
//     } catch (error) {
//         console.error("Error uploading image:", error);
//         res.status(500).json({ message: "Server error" });
//     }
// }
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

        // If image is provided, upload it first
        let imageUrl = '';
        if (file) {
            const fileName = Date.now() + path.extname(file.originalname);
            const destination = `Speaker/${fileName}`; 
            const fileUpload = bucket.file(destination);
            
            // Upload the file to Google Cloud Storage
             await new Promise((resolve, reject) => {
                const stream = fileUpload.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                },
                });

                stream.on("error", reject);

                stream.on("finish", async () => {
                try {
                    await fileUpload.makePublic();
                    imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
                    resolve();
                } catch (error) {
                    reject(error);
                }
                });

                stream.end(file.buffer);
            });
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
            // Delete old image from storage if it exists
            if (speaker.image_url) {
                const oldObjectPath = speaker.image_url.split(`${bucket.name}/`)[1];
                await bucket
                    .file(oldObjectPath || "")
                    .delete()
                    .catch((err) => {
                        console.warn("Old image delete warning:", err.message);
                    });
            }

            // Upload the new image
            const newFileName = `${Date.now()}${path.extname(file.originalname)}`;
            const destination = `Speaker/${newFileName}`; 
            const fileUpload = bucket.file(destination);

            await new Promise((resolve, reject) => {
                const stream = fileUpload.createWriteStream({
                    metadata: {
                        contentType: file.mimetype,
                    },
                });

                stream.on("error", reject);
                stream.on("finish", async () => {
                    try {
                        await fileUpload.makePublic();
                        newImageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                });

                stream.end(file.buffer);
            });
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
                const objectPath = speaker.image_url.split(`${bucket.name}/`)[1];
                await bucket
                    .file(objectPath || "")
                    .delete()
                    .catch((err) => {
                        console.warn("Warning: Failed to delete image from Firebase:", err.message);
                    });
            }
            await Speaker.findByIdAndDelete(speakerId);
            res.status(200).json({ message: "Speaker deleted successfully" });
            }
            catch (error) {
                console.error("Error deleting speaker:", error.message);
                res.status(500).json({ message: "Server error" });
            }
}