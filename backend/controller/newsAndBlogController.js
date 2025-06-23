import NewsAndBlog from "../models/newsAndBlog.js";
import { bucket } from "../config/firebaseConfig.js";
import path from "path";
import multer from "multer";


const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");

export const addNewsAndBlog = async (req, res) => {
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
        const{title,contentType,publishedDate,contents,link} = req.body;
        let newsAndBlog;
         const file = req.file;
        let imageUrl = '';
                if (file) {
                    const fileName = Date.now() + path.extname(file.originalname);
                    const destination = `NewsAndBlog/${fileName}`; 
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
        if(contentType === "link"){
            if (!link) {
                return res.status(400).json({ message: "Link is required for news" });
            }
             newsAndBlog = new NewsAndBlog({
                title,contentType,publishedDate,link,image_url:imageUrl
                });
                
        }
        else if(contentType === "blog"){
            if (!contents) {
                return res.status(400).json({ message: "Contents is required for blog" });
            }

             newsAndBlog = new NewsAndBlog({
                title,contentType,publishedDate,contents,image_url:imageUrl
                });
                
        }
        else {
      return res.status(400).json({ message: "Invalid content type" });
        }
       await newsAndBlog.save();


        res.status(201).json(newsAndBlog);
    } catch (error) {
        console.error("Error adding news and blog:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};
export const getNewsAndBlog = async (req, res) =>{
    try {
        const newsAndBlog = await NewsAndBlog.find();
        res.status(200).json(newsAndBlog);
    } catch (error) {
        console.error("Error getting news and blog:", error.message);
        res.status(500).json({ message: "Server error" });
    }
}
export const updateNewsAndBlog = async (req, res) => {
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

    const { newsAndBlogId } = req.params;
    const file = req.file;

    const existing = await NewsAndBlog.findById(newsAndBlogId);
    if (!existing) {
      return res.status(404).json({ message: "News and blog not found" });
    }

    let newImageUrl = existing.image_url;

    if (file && file.buffer) {

      if (existing.image_url) {
        const urlParts = existing.image_url.split(`https://storage.googleapis.com/${bucket.name}/`);
        const oldFilePath = urlParts[1];
        if (oldFilePath) {
        await bucket.file(oldFilePath).delete();
        }
      }

      const newFileName = `${Date.now()}${path.extname(file.originalname)}`;
      const destination = `NewsAndBlog/${newFileName}`;
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

 
    const updatedNews = await NewsAndBlog.findByIdAndUpdate(
      newsAndBlogId,
      {
        ...req.body,
        image_url: newImageUrl,
      },
      { new: true }
    );

    res.status(200).json({
      message: "News or blog updated successfully",
      updatedNews,
    });
  }catch (error) {
        console.error("Error updating news and blog:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteNewsAndBlog = async(req,res)=>{
    try{
        const {newsAndBlogId} = req.params;
        const newsAndBlog = await NewsAndBlog.findById(newsAndBlogId);
        if (!newsAndBlog) {
            return res.status(404).json({ message: "News and blog not found" });
        }
         if (newsAndBlog.image_url) {
            const urlParts = newsAndBlog.image_url.split(`https://storage.googleapis.com/${bucket.name}/`);
            const filePath = urlParts[1]; 

            if (filePath) {
                await bucket.file(filePath).delete().catch((err) => {
                console.warn("Warning: Failed to delete image from Firebase:", err.message);
                });
            }
            }
        await NewsAndBlog.findByIdAndDelete(newsAndBlogId);
        res.status(200).json({ message: "News and blog deleted successfully" });

    }
    catch(err){
        console.error("Error deleting news and blog:", err);
        res.status(500).json({ message: "Server error" });
    }
}