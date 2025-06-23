import {Banner, Text, Button, Poetry, Testimony} from "../../models/Home/homePageModel.js"
import { bucket } from "../config/firebaseConfig.js";
import path from "path";
import multer from "multer";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");
export const addBanner = async (req, res) =>{
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
         const file = req.file;
                 let imageUrl = '';
                         if (file) {
                             const fileName = Date.now() + path.extname(file.originalname);
                             const destination = `Home/Banner/${fileName}`; 
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

        const banner = await Banner.create({image_url:imageUrl});
        res.json({message: 'Banner Added Successfully', banner: banner});


    } catch (error) {

        console.error("Error adding banner:", error);
        res.status(500).json({ message: "Server error" });

        
    }
}