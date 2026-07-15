import mongoose from "mongoose";

const speakerYearSchema = new mongoose.Schema({
  year: { type: Number, required: true, unique: true },
  label: String,
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

speakerYearSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const SpeakerYear = mongoose.model("SpeakerYear", speakerYearSchema);
export default SpeakerYear;
