import express from "express";
import { protect, restrictTo } from "../../utils/auth.js";
import { addBanner, addButtonText, addPoetry, addTestimonial, addText, deleteBanner, deleteButtonText, deletePoetry, deleteTestimonial, deleteText, getBanner, getButtonText, getPoetry, getTestimonials, getText, updateBanner, updateButtonText, updatePoetry, updateTestimonial, updateText, addIntro, getIntro, updateIntro, deleteIntro } from "../../controller/Home/homePageController.js";

const homePageRoute = express.Router();


homePageRoute.post("/addBanner",protect,restrictTo("admin"),addBanner);
homePageRoute.get("/getBanner",getBanner);
homePageRoute.delete("/deleteBanner/:bannerId",protect,restrictTo("admin"),deleteBanner);
homePageRoute.post("/updateBanner/:bannerId",protect,restrictTo("admin","user"),updateBanner);
homePageRoute.post("/addBannerText",protect,restrictTo("admin"),addText);
homePageRoute.get("/getBannerText",getText);
homePageRoute.delete("/deleteBannerText/:bannerId",protect,restrictTo("admin"),deleteText);
homePageRoute.post("/updateBannerText/:bannerId",protect,restrictTo("admin","user"),updateText);
homePageRoute.post("/addButtonText",protect,restrictTo("admin"),addButtonText);
homePageRoute.get('/getButtonText',getButtonText);
homePageRoute.delete('/deleteButtonText/:buttonId',protect,restrictTo("admin"),deleteButtonText);
homePageRoute.post('/updateButtonText/:buttonId',protect,restrictTo("admin","user"),updateButtonText);
homePageRoute.post("/addPoetry",protect,restrictTo("admin"),addPoetry);
homePageRoute.get("/getPoetry",getPoetry);
homePageRoute.delete("/deletePoetry/:poetryId",protect,restrictTo("admin"),deletePoetry);
homePageRoute.post("/updatePoetry/:poetryId",protect,restrictTo("admin","user"),updatePoetry);
homePageRoute.post("/addTestimonial",protect,restrictTo("admin"),addTestimonial);
homePageRoute.get("/getTestimonial",getTestimonials);
homePageRoute.post("/updateTestimonial/:testimonyId",protect,restrictTo("admin","user"),updateTestimonial);
homePageRoute.delete("/deleteTestimonial/:testimonialId",protect,restrictTo("admin"),deleteTestimonial);

// Intro routes
homePageRoute.post("/addIntro",protect,restrictTo("admin"),addIntro);
homePageRoute.get("/getIntro",getIntro);
homePageRoute.post("/updateIntro/:introId",protect,restrictTo("admin","user"),updateIntro);
homePageRoute.delete("/deleteIntro/:introId",protect,restrictTo("admin"),deleteIntro);



export default homePageRoute;