import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { getViewCounterData, viewCounterController } from "../controller/viewCounterController.js";


const viewCounterRoute = express.Router();
viewCounterRoute.get("/",viewCounterController)
viewCounterRoute.get("/getView", protect ,restrictTo("admin","user"),getViewCounterData)

export default viewCounterRoute;