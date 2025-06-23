import mongoose from "mongoose";

const newsAndBlogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    image_url: {
        type: String,
        
    },
    contentType: {
        type: String,
        enum: ['link', 'blog'],
        required: true
    },
    link : {
        type: String,
    },
    contents:{
        type: String,
    },
    publishedDate:{
        type: Date,
        default: Date.now
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});
const NewsAndBlog = mongoose.model("NewsAndBlog", newsAndBlogSchema);
export default NewsAndBlog;