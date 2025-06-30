import mongoose from "mongoose";



const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
         unique: true
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
const Category = mongoose.model("Category", categorySchema);


const newsAndBlogSchema = new mongoose.Schema({

    category_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true

    },
    author: {
        type: String,
        required: true,
        default: "Arunachal literature"
    },

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
export  {NewsAndBlog,Category};