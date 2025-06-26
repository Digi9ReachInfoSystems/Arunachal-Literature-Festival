import { Year, DayNumber, Archive } from "../models/archiveModel.js";
import { bucket } from "../config/firebaseConfig.js";
import path from "path";
import multer from "multer";
const storage = multer.memoryStorage();
const uploads = multer({ storage }).array("image_url", 10);
const upload = multer({ storage }).single("image_url", 10);

export const addYear = async (req, res) => {
  try {
    const { year, month, totalDays } = req.body;

    let yearMonth = await Year.findOne({ year, month });

    if (!yearMonth) {
      yearMonth = new Year({ year, month });
      await yearMonth.save();
    }
    const dayEntries = [];
    for (let i = 1; i <= totalDays; i++) {
      dayEntries.push({
        year_ref: yearMonth._id,
        dayLabel: `Day ${i}`,
      });
    }
    const savedDays = await DayNumber.insertMany(dayEntries);

    res.status(201).json({
      message: `Created ${savedDays.length} days for ${month}/${year}`,
      yearMonth,
      days: savedDays,
    });
  } catch (err) {
    console.error("Error creating year and days:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
// export const deleteDays = async (req,res)=>{
//     try{
//         const {dayId}= req.params;
//         const day = await DayNumber.findByIdAndDelete(dayId);
//         if (!day) {
//             return res.status(404).json({ message: "Day not found" });
//         }
//         res.status(200).json({ message: "Day deleted successfully", day });
//     }
//     catch(err){
//         console.error("Error deleting day:", err);
//         res.status(500).json({ message: "Server error", error: err.message });

//     }
// }
export const updateYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const { year, month, totalDays } = req.body;

    const yearDoc = await Year.findById(yearId);
    if (!yearDoc) {
      return res.status(404).json({ message: "Year not found" });
    }

    if (year) yearDoc.year = year;
    if (month) yearDoc.month = month;
    await yearDoc.save();

    const existingDays = await DayNumber.find({ year_ref: yearId });
    const existingCount = existingDays.length;

    if (totalDays > existingCount) {
      const daysToAdd = [];
      for (let i = existingCount + 1; i <= totalDays; i++) {
        daysToAdd.push({
          year_ref: yearId,
          dayLabel: `Day ${i}`,
        });
      }
      await DayNumber.insertMany(daysToAdd);
    } else if (totalDays < existingCount) {
      const daysToDelete = existingDays
        .filter((_, index) => index + 1 > totalDays)
        .map((day) => day._id);
      await DayNumber.deleteMany({ _id: { $in: daysToDelete } });
    }

    res.status(200).json({
      message: "Year updated successfully and days adjusted",
      updatedYear: yearDoc,
      currentDayCount: totalDays,
    });
  } catch (err) {
    console.error("Error updating year:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const year = await Year.findById(yearId);
    if (!year) {
      return res.status(404).json({ message: "Year not found" });
    }

    const days = await DayNumber.find({ year_ref: yearId });
    const dayIds = days.map((day) => day._id);

    // Step 3: Delete all Archives linked to those Days
    const archives = await Archive.find({ dayNumber_ref: { $in: dayIds } });
    for (const archive of archives) {
      if (archive.image_url) {
        const filePath = archive.image_url.split(
          `https://storage.googleapis.com/${bucket.name}/`
        )[1];
        if (filePath) {
          await bucket
            .file(filePath)
            .delete()
            .catch((err) => {
              console.warn("Image delete warning:", err.message);
            });
        }
      }
    }
    await Archive.deleteMany({ dayNumber_ref: dayIds });

    // Step 4: Delete all Day documents
    await DayNumber.deleteMany({ year_ref: yearId });

    // Step 5: Delete the Year itself
    await Year.findByIdAndDelete(yearId);
    res.status(200).json({ message: "Year deleted successfully", year });
  } catch (err) {
    console.error("Error deleting year:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const uploadImages = async (req, res) => {
  const handleFileUpload = () => {
    return new Promise((resolve, reject) => {
      uploads(req, res, (err) => {
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
    const { dayNumber_ref } = req.params;
    const { year_ref } = req.params;
    const yearDoc = await Year.findById(year_ref);
    const dayDoc = await DayNumber.findById(dayNumber_ref);
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    const uploadedArchives = [];

    for (const file of files) {
      const fileName = `${Date.now()}-${file.originalname}`;
      const destination = `Archive/${yearDoc.year}/${dayDoc.dayLabel}/${fileName}`;
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
            resolve();
          } catch (error) {
            reject(error);
          }
        });

        stream.end(file.buffer);
      });

      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

      const archive = await Archive.create({
        year_ref,
        dayNumber_ref,
        image_url: imageUrl,
      });

      uploadedArchives.push(archive);
    }

    res.status(201).json({
      message: "Images uploaded successfully",
      archives: uploadedArchives,
    });
  } catch (err) {
    console.error("Error uploading images:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const updateUploadedImage = async (req, res) => {
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
    const { dayNumber_ref } = req.params;
    const { year_ref } = req.params;
    const { imageId } = req.params;
    const yearDoc = await Year.findById(year_ref);
    const dayDoc = await DayNumber.findById(dayNumber_ref);
    const archive = await Archive.findById(imageId);
    if (!archive) {
      return res.status(404).json({ message: "Image not found" });
    }
    const file = req.file;
    let newImageUrl = archive.image_url;
    if (file && file.buffer) {
      if (archive.image_url) {
        // const oldFileName = archive.image_url.split("/").pop();
        const oldFilePath = archive.image_url.split(
          `https://storage.googleapis.com/${bucket.name}/`
        )[1];
        await bucket
          .file(oldFilePath)
          .delete()
          .catch((err) => {
            console.warn("Old image delete warning:", err.message);
          });
        const newFileName = `${Date.now()}${path.extname(file.originalname)}`;
        const destination = `Archive/${yearDoc.year}/${dayDoc.dayLabel}/${newFileName}`;
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
      const updatedImage = await Archive.findByIdAndUpdate(
        imageId,
        {
          image_url: newImageUrl,
        },
        { new: true }
      );
      res
        .status(200)
        .json({ message: "image updated successfully", updatedImage });
    }
  } catch (err) {
    console.error("Error updating image:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const deleteUploadedImage = async (req, res) => {
  try {
    const { imageId } = req.params;
    const archive = await Archive.findByIdAndDelete(imageId);
    if (!archive) {
      return res.status(404).json({ message: "Image not found" });
    }
    const filePath = archive.image_url.split(
      `https://storage.googleapis.com/${bucket.name}/`
    )[1];
    await bucket
      .file(filePath)
      .delete()
      .catch((err) => {
        console.warn("Image delete warning:", err.message);
      });
    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    console.error("Error deleting image:", err);
  }
};

export const getUploadedImage = async (req, res) => {
  try {
    const archives = await Archive.find()
      .populate({
        path: "year_ref",
        select: "year", // Only include the year field
      })
      .populate({
        path: "dayNumber_ref",
        select: "dayLabel", // Only include dayLabel field
      });
    if (!archives) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.status(200).json({ message: "Image found", archive: archives });
  } catch (err) {
    console.error("Error getting image:", err);
  }
};

export const deleteday = async (req, res) => {
  try {
    const { day_ref } = req.params;
    const day = await DayNumber.findById(day_ref);
    if (!day) {
      return res.status(404).json({ message: "Day not found" });
    }
    const archives = await Archive.find({ dayNumber_ref: { $in: day_ref } });
    for (const archive of archives) {
      if (archive.image_url) {
        const filePath = archive.image_url.split(
          `https://storage.googleapis.com/${bucket.name}/`
        )[1];
        if (filePath) {
          await bucket
            .file(filePath)
            .delete()
            .catch((err) => {
              console.warn("Image delete warning:", err.message);
            });
        }
      }
    }
    await Archive.deleteMany({ dayNumber_ref: day_ref });

    // Delete archive records from MongoDB
    await Archive.deleteMany({ dayNumber_ref: day_ref });

    await DayNumber.findByIdAndDelete(day_ref);
    res.status(200).json({ message: "Day deleted successfully" });
  } catch (err) {
    console.error("Error deleting day:", err.message);
  }
};

export const getYearWiseImages = async (req, res) => {
  try {
    const images = await Archive.find()
      .populate({
        path: "year_ref",
        select: "year", // Only include the year field
      })
      .populate({
        path: "dayNumber_ref",
        select: "dayLabel", // Only include dayLabel field
      });
    if (!images) {
      return res.status(404).json({ message: "Images not found" });
    }

    const yearMap = new Map();

    images.forEach((image) => {
      const year = image.year_ref.year;
      if (!yearMap.has(year)) {
        yearMap.set(year, []);
      }
      yearMap.get(year).push(image._id, image.image_url);
    });

    const result = Array.from(yearMap.entries())
      .map(([year, images]) => ({ year, images }))
      .sort((a, b) => b.year - a.year);

    res.status(200).json({
      message: "Images found",
      archive: result,
    });
  } catch (err) {
    console.error("Error getting images:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getYearDayWiseImages = async (req, res) => {
  try {
    const images = await Archive.find()
      .populate({
        path: "year_ref",
        select: "year",
      })
      .populate({
        path: "dayNumber_ref",
        select: "dayLabel",
      });
    if (!images) {
      return res.status(404).json({ message: "Images not found" });
    }
    const yearMap = new Map();

    images.forEach((image) => {
      const year = image.year_ref.year;
      if (!yearMap.has(year)) {
        yearMap.set(year, new Map()); // Each year will have its own day map
      }

      // Then group by day within each year
      const dayLabel = image.dayNumber_ref.dayLabel;
      const dayMap = yearMap.get(year);

      if (!dayMap.has(dayLabel)) {
        dayMap.set(dayLabel, []);
      }

      dayMap.get(dayLabel).push({
        id: image._id,
        url: image.image_url,
      });
    });

    // Convert to the desired output format
    const result = Array.from(yearMap.entries()).map(([year, dayMap]) => ({
      year,
      days: Array.from(dayMap.entries()).map(([dayLabel, images]) => ({
        day: dayLabel,
        images,
      })),
    }));

    // Sort years in descending order
    result.sort((a, b) => b.year - a.year);

    // Sort days within each year (Day 1, Day 2, etc.)
    result.forEach((yearGroup) => {
      yearGroup.days.sort((a, b) => {
        const dayNumA = parseInt(a.day.split(" ")[1]);
        const dayNumB = parseInt(b.day.split(" ")[1]);
        return dayNumA - dayNumB;
      });
    });

    res.status(200).json({
      message: "Images found",
      archive: result,
    });
  } catch (err) {
    console.error("Error getting images:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
export const getImagesByItsYear = async (req, res) => {
  try {
    const { yearId } = req.params;
    const images = await Archive.find({ year_ref: yearId })
      .populate({
        path: "year_ref",
        select: "year",
      })
      .populate({
        path: "dayNumber_ref",
        select: "dayLabel",
      });

    if (!images || images.length === 0) {
      return res.status(404).json({ message: "No images found for this year" });
    }

    // Transform the data to a cleaner format
    const result = {
      year: images[0].year_ref.year,
      images: images.map((img) => ({
        id: img._id,
        url: img.image_url,
      })),
    };

    res.status(200).json({
      message: "Images found for year",
      archive: result,
    });
  } catch (err) {
    console.error("Error getting images by year:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getYear = async (req, res) => {
  try {
    const year = await Year.find();
    res.status(200).json({ year });
  } catch (err) {
    console.error("Error getting years and days:", err.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
