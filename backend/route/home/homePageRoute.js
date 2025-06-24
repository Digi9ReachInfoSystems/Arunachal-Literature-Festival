import express from "express";
import { protect, restrictTo } from "../../utils/auth.js";
import { addBanner, addText, deleteBanner, deleteText, getBanner, getText, updateBanner, updateText } from "../../controller/Home/homePageController.js";
const homePageRoute = express.Router();


homePageRoute.post("/addBanner",protect,restrictTo("admin"),addBanner);
homePageRoute.get("/getBanner",getBanner);
homePageRoute.delete("/deleteBanner/:bannerId",protect,restrictTo("admin"),deleteBanner);
homePageRoute.post("/updateBanner/:bannerId",protect,restrictTo("admin","user"),updateBanner);
homePageRoute.post("/addBannerText",protect,restrictTo("admin"),addText);
homePageRoute.get("/getBannerText",getText);
homePageRoute.delete("/deleteBannerText/:bannerId",protect,restrictTo("admin"),deleteText);
homePageRoute.post("/updateBannerText/:bannerId",protect,restrictTo("admin","user"),updateText);


export default homePageRoute;