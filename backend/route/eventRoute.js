import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { addEvent, addTime, deleteEvent, genratePdf, getEvent, getEventDay, getTotalEvent, updateEvent, updateEventDay, updateTime } from "../controller/eventScheduleController.js";

const eventRoute = express.Router();



eventRoute.post("/addEvent",protect,restrictTo("admin"),addEvent);
eventRoute.post("/updateEventDay/:eventDayId",protect,restrictTo("admin","user"),updateEventDay);
eventRoute.post("/addTime/:eventId/day/:eventDay_ref",protect,restrictTo("admin"),addTime);
eventRoute.post("/updateEvent/:eventId",protect,restrictTo("admin","user"),updateEvent);
eventRoute.post("/updateTime/day/:day_ref/time/:timeId",protect,restrictTo("admin","user"),updateTime);
eventRoute.delete("/deleteEvent/:eventId",protect,restrictTo("admin"),deleteEvent);
eventRoute.get("/getEvent",protect,restrictTo("admin","user"),getEvent);
eventRoute.get("/totalEvent",getTotalEvent);
eventRoute.get("/getEventDay",protect,restrictTo("admin","user"),getEventDay);
eventRoute.get("/generatePdf",genratePdf);




export default eventRoute