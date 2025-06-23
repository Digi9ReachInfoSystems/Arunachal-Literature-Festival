import mongoose from "mongoose";


const videoBlogSchema = new mongoose.Schema({
     title: {
    type: String,
    required: true,
    trim: true,
  },
  youtubeUrl: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function (v) {
        return /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+$/.test(v) ||
               /^https:\/\/youtu\.be\/[\w-]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid YouTube URL.`,
    },
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});
const VideoBlog = mongoose.model("VideoBlog", videoBlogSchema);
export default VideoBlog;   
    