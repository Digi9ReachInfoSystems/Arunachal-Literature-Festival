import mongoose from "mongoose";
import dotenv from "dotenv";
import Speaker from "../models/speakerModel.js";
import SpeakerYear from "../models/speakerYearModel.js";

dotenv.config();

const migrateSpeakersTo2025 = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    let year2025 = await SpeakerYear.findOne({ year: 2025 });
    if (!year2025) {
      year2025 = new SpeakerYear({
        year: 2025,
        label: "ALF 2025",
        isActive: true,
      });
      await year2025.save();
      console.log("Created SpeakerYear 2025:", year2025._id);
    } else {
      console.log("SpeakerYear 2025 already exists:", year2025._id);
    }

    const result = await Speaker.updateMany(
      {
        $or: [
          { year_ref: { $exists: false } },
          { year_ref: null },
        ],
      },
      { $set: { year_ref: year2025._id } }
    );

    console.log(`Migration complete: ${result.modifiedCount} speaker(s) assigned to 2025`);

    const totalSpeakers = await Speaker.countDocuments({ year_ref: year2025._id });
    console.log(`Total speakers under 2025: ${totalSpeakers}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

migrateSpeakersTo2025();
