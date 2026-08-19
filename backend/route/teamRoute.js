import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import {
  addTeamMember,
  deleteTeamMember,
  getTeamMemberById,
  getTeamMembers,
  updateTeamMember,
} from "../controller/teamController.js";

const teamRoute = express.Router();

teamRoute.get("/getTeamMembers", getTeamMembers);
teamRoute.get("/getTeamMember/:id", getTeamMemberById);
teamRoute.post("/addTeamMember", protect, restrictTo("admin", "user"), addTeamMember);
teamRoute.post("/updateTeamMember/:id", protect, restrictTo("admin", "user"), updateTeamMember);
teamRoute.delete("/deleteTeamMember/:id", protect, restrictTo("admin"), deleteTeamMember);

export default teamRoute;
