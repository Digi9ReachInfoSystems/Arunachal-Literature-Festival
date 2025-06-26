import mongoose from "mongoose";

const yearSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Year = mongoose.model("Year", yearSchema);

const dayNumber = new mongoose.Schema({
  year_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Year",
  },
  dayLabel: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const DayNumber = mongoose.model("DayNumber", dayNumber);

const archiveSchmea = new mongoose.Schema({
  year_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Year",
  },
  dayNumber_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "DayNumber",
  },
  image_url: {
    type: String,
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
const Archive = mongoose.model("Archive", archiveSchmea);
export { Year, DayNumber, Archive };
