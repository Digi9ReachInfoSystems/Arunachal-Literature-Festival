import mongoose from "mongoose";

// Admin-editable section headings (e.g. the "Children's Corner" title)
const SectionTitleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { timestamps: true }
);

const SectionTitle = mongoose.model("SectionTitle", SectionTitleSchema);
export default SectionTitle;
