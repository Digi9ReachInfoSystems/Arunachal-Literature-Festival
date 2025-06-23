import express from "express";
import { protect, restrictTo } from "../../utils/auth";
import { addBanner } from "../../controller/Home/homePageController";
const homePageRoute = express.Router();


homePageRoute.post("/addBanner",protect,restrictTo("admin"),addBanner);
export default homePageRoute;