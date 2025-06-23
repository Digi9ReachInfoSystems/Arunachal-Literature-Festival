import express from "express";
import { addSpeaker, deleteSpeaker, getSpeaker, updateSpeaker } from "../controller/speakerController.js";
import { protect, restrictTo } from "../utils/auth.js";

const speakerRoute = express.Router();

speakerRoute.post("/addSpeaker/:eventId",protect,restrictTo("admin"),addSpeaker)
speakerRoute.get("/getSpeaker",getSpeaker)
speakerRoute.delete("/deleteSpeaker/:speakerId",protect,restrictTo("admin"),deleteSpeaker)
speakerRoute.post("/updateSpeaker/:speakerId",protect,restrictTo("admin","user"),updateSpeaker)


export default speakerRoute