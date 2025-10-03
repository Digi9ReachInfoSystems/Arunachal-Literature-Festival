import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import {
  addVideoBlog,
  deleteVideoBlog,
  getRawVideo,
  getRawVideoById,
  getVideoBlog,
  getVideoBlogById,
  getYoutubeVideo,
  updateVideoBlog,
} from "../controller/VideoBlogsController.js";

const videoBlogRoute = express.Router();

videoBlogRoute.post(
  "/addVideoBlog",
  protect,
  restrictTo("admin"),
  addVideoBlog
);
videoBlogRoute.get("/getVideoBlog", getVideoBlog);
videoBlogRoute.get("/getYoutubeVideo", getYoutubeVideo);
videoBlogRoute.get("/getRawVideo", getRawVideo);
videoBlogRoute.get("/getRawVideoById/:videoId", getRawVideoById);
videoBlogRoute.get("/getVideoById/:videoId", getVideoBlogById);
videoBlogRoute.post(
  "/updateVideo/:videoId",
  protect,
  restrictTo("admin", "user"),
  updateVideoBlog
);
videoBlogRoute.delete(
  "/deleteVideo/:videoId",
  protect,
  restrictTo("admin"),
  deleteVideoBlog
);

export default videoBlogRoute;
