import express from "express";
import {protect,restrictTo} from "../utils/auth.js"
import { addNewsAndBlog, deleteNewsAndBlog, getNewsAndBlog, updateNewsAndBlog } from "../controller/newsAndBlogController.js";

const newsAndBlogRoute = express.Router();

newsAndBlogRoute.post("/addNewsAndBlog",protect,restrictTo("admin"),addNewsAndBlog);
newsAndBlogRoute.get("/getNewsAndBlog",getNewsAndBlog);
newsAndBlogRoute.post("/updateNewsAndBlog/:newsAndBlogId",protect,restrictTo("admin","user"),updateNewsAndBlog);
newsAndBlogRoute.delete("/deleteNewsAndBlog/:newsAndBlogId",protect,restrictTo("admin"),deleteNewsAndBlog);


export default newsAndBlogRoute