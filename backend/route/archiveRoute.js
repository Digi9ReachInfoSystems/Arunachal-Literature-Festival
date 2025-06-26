import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import {
  addYear,
  deleteday,
  deleteUploadedImage,
  deleteYear,
  getImagesByItsYear,
  getUploadedImage,
  getYear,
  getYearDayWiseImages,
  getYearWiseImages,
  updateUploadedImage,
  updateYear,
  uploadImages,
} from "../controller/archiveController.js";

const archiveRoute = express.Router();

archiveRoute.post("/addyear", protect, restrictTo("admin"), addYear);
archiveRoute.post(
  "/updateyear/:yearId",
  protect,
  restrictTo("admin", "user"),
  updateYear
);
archiveRoute.delete(
  "/deleteyear/:yearId",
  protect,
  restrictTo("admin"),
  deleteYear
);
archiveRoute.post(
  "/uploadImages/:year_ref/year/:dayNumber_ref",
  protect,
  restrictTo("admin"),
  uploadImages
);
archiveRoute.post(
  "/updatedImages/:dayNumber_ref/year/:year_ref/image/:imageId",
  protect,
  restrictTo("admin", "user"),
  updateUploadedImage
);
archiveRoute.get("/getImages", getUploadedImage);
archiveRoute.get("/getImagesByYear", getYearWiseImages);
archiveRoute.delete(
  "/deleteImages/image/:imageId",
  protect,
  restrictTo("admin"),
  deleteUploadedImage
);
archiveRoute.delete(
  "/deleteday/:day_ref",
  protect,
  restrictTo("admin"),
  deleteday
);
archiveRoute.get("/getYearDayWiseImages", getYearDayWiseImages);
archiveRoute.get("/getYearImages/:yearId", getImagesByItsYear);
archiveRoute.get("/getYear",getYear );
export default archiveRoute;
