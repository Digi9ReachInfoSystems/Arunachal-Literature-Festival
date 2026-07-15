import express from "express";
import {
  addSpeaker,
  deleteSpeaker,
  getSpeaker,
  getSpeakerByYear,
  updateSpeaker,
} from "../controller/speakerController.js";
import {
  addYear,
  deleteYear,
  getYears,
  updateYear,
} from "../controller/speakerYearController.js";
import { protect, restrictTo } from "../utils/auth.js";

const speakerRoute = express.Router();

speakerRoute.post("/addYear", protect, restrictTo("admin"), addYear);
speakerRoute.get("/getYears", getYears);
speakerRoute.post("/updateYear/:yearId", protect, restrictTo("admin"), updateYear);
speakerRoute.delete("/deleteYear/:yearId", protect, restrictTo("admin"), deleteYear);

speakerRoute.post("/addSpeaker/:yearId", protect, restrictTo("admin"), addSpeaker);
speakerRoute.get("/getSpeaker", getSpeaker);
speakerRoute.get("/getSpeaker/:yearId", getSpeakerByYear);
speakerRoute.delete("/deleteSpeaker/:speakerId", protect, restrictTo("admin"), deleteSpeaker);
speakerRoute.post("/updateSpeaker/:speakerId", protect, restrictTo("admin", "user"), updateSpeaker);

export default speakerRoute;
