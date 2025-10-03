import VideoBlog from "../models/videoBlogModel.js";
import path from "path";
import multer from "multer";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";
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
const uploadFileLocal = async (file, folder) => saveBufferToLocal(file, folder);
const deleteLocalFile = async (fileUrl) => deleteLocalByUrl(fileUrl);
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
        uploadFileLocal(videoFile, "VideoBlog/videos"),
        uploadFileLocal(thumbnailFile, "VideoBlog/thumbnails"),
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
    
    if (!videoId) {
      return res.status(400).json({ message: "Video ID is required" });
    }
    
    const videoBlog = await VideoBlog.findById(videoId);
    
    if (!videoBlog) {
      return res.status(404).json({ message: "Video blog not found" });
    }
    
    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getYoutubeVideo = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find({ videoType: "youtube" });
    if (!videoBlog || videoBlog.length === 0) {
      return res.status(404).json({ message: "No YouTube videos found" });
    }
    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting YouTube videos:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getRawVideo = async (req, res) => {
  try {
    const videoBlog = await VideoBlog.find({ videoType: "video" });
    if (!videoBlog || videoBlog.length === 0) {
      return res.status(404).json({ message: "No raw videos found" });
    }
    res.status(200).json(videoBlog);
  } catch (err) {
    console.error("Error getting raw videos:", err.message);
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
      return res.status(200).json({
        message: "YouTube video updated successfully",
        videoBlog: videoBlogUpdate,
      });

    } else if (videoType === "video") {
      let videoFile = null;
      let thumbnailFile = null;
      let videoUrl = videoBlog.video_url;
      let thumbnailUrl = videoBlog.imageUrl;

      if (req.files) {
        if (req.files.video) {
          videoFile = req.files.video[0];
        }
        if (req.files.thumbnail) {
          thumbnailFile = req.files.thumbnail[0];
        }

        const deletePromises = [];
        if (videoFile && videoBlog.video_url) {
          deletePromises.push(deleteLocalFile(videoBlog.video_url));
        }
        if (thumbnailFile && videoBlog.imageUrl) {
          deletePromises.push(deleteLocalFile(videoBlog.imageUrl));
        }
        await Promise.all(deletePromises);

        if (videoFile) {
          videoUrl = await uploadFileLocal(videoFile, "VideoBlog/videos");
        }
        if (thumbnailFile) {
          thumbnailUrl = await uploadFileLocal(thumbnailFile, "VideoBlog/thumbnails");
        }
      }

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

      return res.status(200).json({
        message: "Video updated successfully",
        videoBlog: videoBlogUpdate,
      });

    } else {
      return res.status(400).json({ message: "Invalid video type" });
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
      await deleteLocalFile(videoBlog.video_url);
    }
    if (videoBlog.imageUrl) {
      await deleteLocalFile(videoBlog.imageUrl);
    }
    await VideoBlog.findByIdAndDelete(videoId);
    res.status(200).json({ message: "Video blog deleted successfully" });
  } catch (err) {
    console.error("Error deleting video blog:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
