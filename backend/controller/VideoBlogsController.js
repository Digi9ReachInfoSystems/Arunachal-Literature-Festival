import VideoBlog from "../models/videoBlogModel.js";
import { bucket } from "../config/firebaseConfig.js";
import path from "path";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");


export const addVideoBLog = async (req , res)=>{
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
    try{
        await handleFileUpload();
        const {title ,  video_url,videoType,youtubeUrl, addedAt} = req.body;
        const file = req.file;
        let imageUrl = '';
            if (file) {
                    const fileName = Date.now() + path.extname(file.originalname);
                    const destination = `Video/Thumbnail/${fileName}`; 
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
        
        let  newVideoBlog ;
        if(videoType === "youtube"){
            if(!youtubeUrl) return res.status(400).json({ message: "Video URL is required" });
            newVideoBlog = new VideoBlog.create({title , youtubeUrl  , addedAt })

            
        }
        else if (videoType === "video"){
            if(!video_url) return res.status(400).json({ message: "Video URL is required" });
            newVideoBlog = new VideoBlog.create({title   , addedAt })
        }
        await newVideoBlog.save();
        res.status(201).json({ message: "VideoBlog added successfully" });
    }
    catch(err){
        res.status(500).json({ message: "Failed to add VideoBlog" });


    }
}

export const getVideoBlogs = async (req , res)=>{
    try{
        const videoBlogs = await VideoBlog.find();
        res.status(200).json(videoBlogs);
    }
    catch(err){
        res.status(500).json({ message: "Failed to get VideoBlogs" });
    }
}
