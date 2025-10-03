import mongoose from "mongoose";

const WorkshopSchema = new mongoose.Schema(
  {
    eventRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventsCollection",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    about: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /\.(jpg|jpeg|png)$/i.test(v),
        message: "Only JPG, JPEG, and PNG image formats are allowed",
      },
    },
    registrationFormUrl: {
      type: String,
      required: true,
      validate: {
        validator: (v) => /^https:\/\/docs\.google\.com\/forms\/.+/i.test(v),
        message: "Must be a valid Google Form URL",
      },
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

const Workshop = mongoose.model("Workshop", WorkshopSchema);
export default Workshop;
