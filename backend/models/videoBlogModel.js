import mongoose from "mongoose";


const videoBlogSchema = new mongoose.Schema({
    title: {
    type: String,
    required: true,
    trim: true,
  },
  videoType:{
    type:String,
    enu:["youtube","video"],
    required:true
  },
  youtubeUrl: {
    type: String,
    
    trim: true,
    validate: {
      validator: function (v) {
        return /^https:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+$/.test(v) ||
               /^https:\/\/youtu\.be\/[\w-]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid YouTube URL.`,
    },
  },
  imageUrl: {
      type: String,
      
  },
  video_url: {
      type: String,

  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});
const VideoBlog = mongoose.model("VideoBlog", videoBlogSchema);
export default VideoBlog;   
    