import VideoBlog from "../models/videoBlogModel.js";
import { bucket } from "../config/firebaseConfig.js";
import path from "path";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({   storage: storage }).fields([ { name: 'video', maxCount: 1 },{ name: 'thumbnail', maxCount: 1 }]);



function cleanYouTubeUrl(url) {
    // Handle youtu.be links
    if (url.includes('youtu.be')) {
        const videoId = url.split('/').pop().split('?')[0];
        return `https://www.youtube.com/watch?v=${videoId}`;
    }
    
    // Handle YouTube URLs with additional parameters
    if (url.includes('youtube.com')) {
        // Extract video ID from various URL formats
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        if (match && match[2].length === 11) {
            return `https://www.youtube.com/watch?v=${match[2]}`;
        }
    }
    
    // Return original if we can't clean it (will trigger your schema validation)
    return url;
}
const uploadFileToFirebase = async (file, folder) => {
  const fileName = Date.now() + path.extname(file.originalname);
  const destination = `${folder}/${fileName}`;
  const fileUpload = bucket.file(destination);

  return new Promise((resolve, reject) => {
    const stream = fileUpload.createWriteStream({
      metadata: { contentType: file.mimetype }
    });

    stream.on('error', (err) => {
      console.error("Firebase upload error:", err);
      reject(err);
    });

    stream.on('finish', async () => {
      try {
        await fileUpload.makePublic();
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;
        resolve(publicUrl); // ✅ This is the correct place to return the URL
      } catch (error) {
        reject(error);
      }
    });

    stream.end(file.buffer);
  });
};
export const addVideoBlog = async (req, res) => {
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
    const { title, videoType, addedAt, youtubeUrl } = req.body;

    let videoBlog;

    if (videoType === 'youtube') {
      if (!youtubeUrl) {
        return res.status(400).json({ message: "Please enter YouTube URL" });
      }

      const cleanedUrl = cleanYouTubeUrl(youtubeUrl);
      videoBlog = await VideoBlog.create({
        title,
        videoType,
        addedAt,
        youtubeUrl: cleanedUrl
      });

      return res.status(201).json(videoBlog);
    }

    else if (videoType === 'video') {
      if (!req.files || !req.files.video || !req.files.thumbnail) {
        return res.status(400).json({
          message: "Both video and thumbnail files are required"
        });
      }

      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail[0];

      const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadFileToFirebase(videoFile, 'VideoBlog/videos'),
        uploadFileToFirebase(thumbnailFile, 'VideoBlog/thumbnails')
      ]);

      videoBlog = await VideoBlog.create({
        title,
        videoType,
        addedAt,
        video_url: videoUrl,
        imageUrl: thumbnailUrl
      });

      return res.status(201).json(videoBlog);
    }

    // If videoType is neither 'youtube' nor 'video'
    return res.status(400).json({ message: "Invalid video type" });
  } catch (err) {
    console.error("Error adding video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
