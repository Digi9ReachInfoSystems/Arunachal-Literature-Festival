import express from "express";
import {protect,restrictTo} from "../utils/auth.js"
import { addCategory, addNewsAndBlog, deleteNewsAndBlog, getCategories, getNewsAndBlog, updateNewsAndBlog } from "../controller/newsAndBlogController.js";

const newsAndBlogRoute = express.Router();

newsAndBlogRoute.post("/addNewsAndBlog",protect,restrictTo("admin"),addNewsAndBlog);
newsAndBlogRoute.get("/getNewsAndBlog",getNewsAndBlog);
newsAndBlogRoute.post("/updateNewsAndBlog/:newsAndBlogId",protect,restrictTo("admin","user"),updateNewsAndBlog);
newsAndBlogRoute.delete("/deleteNewsAndBlog/:newsAndBlogId",protect,restrictTo("admin"),deleteNewsAndBlog);
newsAndBlogRoute.post("/addCategory",protect,restrictTo("admin"),addCategory);
newsAndBlogRoute.get("/getCategory",getCategories);


export default newsAndBlogRoute