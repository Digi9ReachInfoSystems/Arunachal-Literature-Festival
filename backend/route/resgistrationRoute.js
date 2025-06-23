import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { addWorkshop, deleteWorkshop, getWorkshop, updateWorkshop } from "../controller/registerController.js";

const registerRoute = express.Router();


registerRoute.post("/addRegistration/:eventId",protect,restrictTo("admin"),addWorkshop);
registerRoute.post("/updateRegistration/:workshopId",protect,restrictTo("admin","user"),updateWorkshop);
registerRoute.delete("/deleteRegistration/:workshopId",protect,restrictTo("admin"),deleteWorkshop);
registerRoute.get("/getRegistration",getWorkshop);



export default registerRoute