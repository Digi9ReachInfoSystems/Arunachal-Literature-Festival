import {Banner, BannerText, Button, Poetry, Testimony} from "../../models/Home/homePageModel.js"
import { bucket } from "../../config/firebaseConfig.js";
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
            
            const existing = await Banner.find();
            if (existing.length > 0) {
              return res.status(400).json({ message: "Banner already exists" });
            }

    const banner = await Banner.create({ image_url: imageUrl });
        res.json({message: 'Banner Added Successfully', banner: banner});


    } catch (error) {

        console.error("Error adding banner:", error);
        res.status(500).json({ message: "Server error" });

        
    }
}
export const getBanner = async (req, res) => {
    try {
        const banner = await Banner.find();
        res.status(200).json(banner);
    } catch (error) {
        console.error("Error getting banner:", error);
        res.status(500).json({ message: "Server error" });
    }
}

export const updateBanner = async (req, res) => {
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
    const { bannerId } = req.params;
    const banner = await Banner.findById(bannerId);

    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
    }

    const file = req.file;
    let newImageUrl = banner.image_url;

    if (file) {
      // Delete old image if it exists
      if (banner.image_url && banner.image_url.includes(bucket.name)) {
        const urlParts = banner.image_url.split(`https://storage.googleapis.com/${bucket.name}/`);
        const oldFilePath = urlParts[1];
        if (oldFilePath) {
          try {
            await bucket.file(oldFilePath).delete();
          } catch (err) {
            console.warn("Failed to delete old image:", err.message);
          }
        }
      }

      // Upload new image
      const newFileName = `${Date.now()}${path.extname(file.originalname)}`;
      const destination = `Home/Banner/${newFileName}`;
      const fileUpload = bucket.file(destination);

      await new Promise((resolve, reject) => {
        const stream = fileUpload.createWriteStream({
          metadata: { contentType: file.mimetype },
        });

        stream.on("error", reject);
        stream.on("finish", async () => {
          try {
            await fileUpload.makePublic();
            newImageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
            resolve();
          } catch (err) {
            reject(err);
          }
        });

        stream.end(file.buffer);
      });
    }

    const updatedBanner = await Banner.findByIdAndUpdate(
      bannerId,
      { image_url: newImageUrl },
      { new: true }
    );

    return res.status(200).json({
      message: "Banner updated successfully",
      banner: updatedBanner,
    });

  }catch (error) {
        console.error("Error updating banner:", error);
        res.status(500).json({ message: "Server error" });
    }
}

export const deleteBanner = async(req,res)=>{
  try {
    const {bannerId} = req.params;
    const banner = await Banner.findById(bannerId);
    if (!banner) {
      return res.status(404).json({ message: "Banner not found" });
      }
     if(banner.image_url){
      const urlParts = banner.image_url.split(`https://storage.googleapis.com/${bucket.name}/`);
      const filePath = urlParts[1];
      if (filePath) {
        await bucket.file(filePath).delete().catch((err) => {
          console.warn("Warning: Failed to delete image from Firebase:", err.message);
        });
      }
     }

      await Banner.findByIdAndDelete(bannerId);
      res.status(200).json({ message: "Banner deleted successfully" });
  } catch (error) {
    console.error("Error deleting banner:", error);
    res.status(500).json({ message: "Server error" });
  }
}


export const addText = async (req, res) =>{
  try{
    const {bannerText,bannerSubText,location} = req.body;
      const existing = await BannerText.find();
            if (existing.length > 0) {
              return res.status(400).json({ message: "Banner already exists" });
            }
    const newText = await BannerText.create({bannerText,bannerSubText,location});
    res.status(201).json(newText);
  }
  catch(err){
    console.error("Error adding text:", err.message);
    res.status(500).json({ message: "Server error" });
  }
}

export const getText = async (req, res) => {
  try {
    const getText = await BannerText.find();
    res.status(200).json(getText);
  } catch (error) {
    console.error("Error getting text:", error.message);
    res.status(500).json({ message: "Server error" });
  }
}
export const updateText = async (req, res) =>{
  try{
    const {bannerText,bannerSubText,location} = req.body;
    const {bannerId} = req.params;
    const bannerTextUpdate = await BannerText.findByIdAndUpdate(bannerId, {bannerText,bannerSubText,location},{new:true});
    res.status(200).json(bannerTextUpdate);
    }
    catch(err){
      console.error("Error updating text:", err.message);
      res.status(500).json({ message: "Server error" });
    }

}
export const deleteText = async (req, res) =>{
  try{
    const {bannerId} = req.params;
    await BannerText.findByIdAndDelete(bannerId);
    res.status(200).json({ message: "Text deleted successfully" });
    }
    catch(err){
      console.error("Error deleting text:", err.message);
      res.status(500).json({ message: "Server error" });
    }
}
