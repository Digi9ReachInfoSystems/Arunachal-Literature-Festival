import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { addUser, deleteUser, getUsers, login, logout, editUser, getMyProfile } from "../controller/authController.js";
import { decryptPayload } from "../middleware/decryptPayload.js";

const authRoute = express.Router();

// Apply decryption middleware to login and registration routes
// This supports both encrypted and plain passwords (backward compatible)
authRoute.post("/addUser", decryptPayload, protect, restrictTo("admin"), addUser);
authRoute.get("/getUsers", protect, restrictTo("admin"), getUsers);
authRoute.get("/getMyProfile", protect, getMyProfile);
authRoute.delete("/deleteUser/:userId", protect, restrictTo("admin"), deleteUser);
authRoute.put("/editUser/:userId", decryptPayload, protect, editUser);
authRoute.post("/login", decryptPayload, login);
authRoute.post("/logout", logout);

export default authRoute;