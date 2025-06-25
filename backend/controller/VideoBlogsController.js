import VideoBlog from "../models/videoBlogModel.js";
import { bucket } from "../config/firebaseConfig.js";
import path from "path";
import multer from "multer";
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "video", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 },
]);

function cleanYouTubeUrl(url) {
  // Handle youtu.be links
  if (url.includes("youtu.be")) {
    const videoId = url.split("/").pop().split("?")[0];
    return `https://www.youtube.com/watch?v=${videoId}`;
  }

  // Handle YouTube URLs with additional parameters
  if (url.includes("youtube.com")) {
    // Extract video ID from various URL formats
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
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
      metadata: { contentType: file.mimetype },
    });

    stream.on("error", (err) => {
      console.error("Firebase upload error:", err);
      reject(err);
    });

    stream.on("finish", async () => {
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
const deleteFileFromFirebase = async (fileUrl) => {
  try {
    const baseUrl = `https://storage.googleapis.com/${bucket.name}/`;
    let filePath = fileUrl;

    if (fileUrl.startsWith(baseUrl)) {
      filePath = fileUrl.replace(baseUrl, "");
    } else if (fileUrl.includes(`storage.googleapis.com/${bucket.name}/`)) {
      filePath = fileUrl.split(`storage.googleapis.com/${bucket.name}/`)[1];
    } else if (
      fileUrl.includes(`firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`)
    ) {
      filePath = fileUrl.split(
        `firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`
      )[1];
      filePath = decodeURIComponent(filePath.split("?")[0]).replace(
        /%2F/g,
        "/"
      );
    }

    console.log("Attempting to delete file:", filePath);

    const file = bucket.file(filePath);
    const [exists] = await file.exists();

    if (!exists) {
      console.warn("File does not exist:", filePath);
      return;
    }

    await file.delete();
    console.log("File deleted successfully:", filePath);
    return true;
  } catch (error) {
    console.error("Error deleting file from Firebase:", error.message);
    throw error; // Consider throwing the error so the caller can handle it
  }
};
/**
 * Handles adding a new video blog to the database.
 *
 * The request body must contain the video blog's title, type (either 'youtube' or 'video'),
 * and date added. If the type is 'youtube', the request body must also contain the YouTube URL.
 * If the type is 'video', the request body must also contain the video file and thumbnail file.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 *
 * @returns {Promise<void>}
 */
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

    if (videoType === "youtube") {
      if (!youtubeUrl) {
        return res.status(400).json({ message: "Please enter YouTube URL" });
      }

      const cleanedUrl = cleanYouTubeUrl(youtubeUrl);
      videoBlog = await VideoBlog.create({
        title,
        videoType,
        addedAt,
        youtubeUrl: cleanedUrl,
      });

      return res.status(201).json(videoBlog);
    } else if (videoType === "video") {
      if (!req.files || !req.files.video || !req.files.thumbnail) {
        return res.status(400).json({
          message: "Both video and thumbnail files are required",
        });
      }

      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail[0];

      const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadFileToFirebase(videoFile, "VideoBlog/videos"),
        uploadFileToFirebase(thumbnailFile, "VideoBlog/thumbnails"),
      ]);

      videoBlog = await VideoBlog.create({
        title,
        videoType,
        addedAt,
        video_url: videoUrl,
        imageUrl: thumbnailUrl,
      });

      return res.status(201).json(videoBlog);
    }

    // If videoType is neither 'youtube' nor 'video'
    return res.status(400).json({ message: "Invalid video type" });
  } catch (err) {
    console.error("Error adding video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVideoBlog = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find();
    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getVideoBlogById = async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoBlog = await VideoBlog.findById(videoId);
    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getYoutubeVideo = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find({ videoType: "youtube" });
    if (!videoBlog) {
      return res.status(404).json({ message: "Video Blog not found" });
    }
    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getRawVideo = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find({ videoType: "video" });
    if (!videoBlog) {
      return res.status(404).json({ message: "Video Blog not found" });
    }
    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getRawVideoById = async (req, res) => {
  try {
    const { videoId } = req.params;

    const videoBlog = await VideoBlog.findOne({
      _id: videoId,
      videoType: "video",
    });

    if (!videoBlog) {
      return res.status(404).json({
        message: "Raw video not found or not a raw video type",
      });
    }

    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting raw video:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateVideoBlog = async (req, res) => {
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
    const { videoId } = req.params;
    const { title, videoType, addedAt, youtubeUrl } = req.body;
    const videoBlog = await VideoBlog.findById(videoId);
    if (!videoBlog) {
      return res.status(404).json({ message: "Video blog not found" });
    }
    let videoBlogUpdate;
    if (videoType === "youtube") {
      const cleanedUrl = cleanYouTubeUrl(youtubeUrl);
      videoBlogUpdate = await VideoBlog.findByIdAndUpdate(
        videoId,
        {
          title,
          videoType,
          addedAt,
          youtubeUrl: cleanedUrl,
        },
        { new: true }
      );
      return res
        .status(201)
        .json("youtube video updated successfully", videoBlogUpdate);
    } else if (videoType === "video") {
      if (!req.files || !req.files.video || !req.files.thumbnail) {
        return res.status(400).json({
          message: "Both video and thumbnail files are required",
        });
      }
      const videoFile = req.files.video[0];
      const thumbnailFile = req.files.thumbnail[0];
      const deletePromises = [];
      if (videoBlog.video_url) {
        deletePromises.push(deleteFileFromFirebase(videoBlog.video_url));
      }
      if (videoBlog.imageUrl) {
        deletePromises.push(deleteFileFromFirebase(videoBlog.imageUrl));
      }
      await Promise.all(deletePromises);
      const [videoUrl, thumbnailUrl] = await Promise.all([
        uploadFileToFirebase(videoFile, "VideoBlog/videos"),
        uploadFileToFirebase(thumbnailFile, "VideoBlog/thumbnails"),
      ]);
      videoBlogUpdate = await VideoBlog.findByIdAndUpdate(
        videoId,
        {
          title,
          videoType,
          addedAt,
          video_url: videoUrl,
          imageUrl: thumbnailUrl,
        },
        { new: true }
      );
      return res
        .status(201)
        .json("video updated successfully", videoBlogUpdate);
    } else {
      res.status(400).json({ message: "Invalid video type" });
    }
  } catch (err) {
    console.error("Error updating video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteVideoBlog = async (req, res) => {
  try {
    const { videoId } = req.params;
    const videoBlog = await VideoBlog.findById(videoId);
    if (!videoBlog) {
      return res.status(404).json({ message: "Video blog not found" });
    }
    if (videoBlog.video_url) {
      await deleteFileFromFirebase(videoBlog.video_url);
    }
    if (videoBlog.imageUrl) {
      await deleteFileFromFirebase(videoBlog.imageUrl);
    }
    await VideoBlog.findByIdAndDelete(videoId);
    res.status(200).json({ message: "Video blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

