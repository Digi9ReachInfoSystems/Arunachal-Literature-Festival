import mongoose from "mongoose";

const viewCounterSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
  },
  views: {
    type: Number,
    default: 0,
  },
  uniqueUser: {
    type: [String],
  },
});

const ViewCounter = mongoose.model("ViewCounter", viewCounterSchema);
export default ViewCounter;