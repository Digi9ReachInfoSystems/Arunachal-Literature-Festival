import express from "express";
import { protect, restrictTo } from "../utils/auth.js";
import { addUser, deleteUser, getUsers, login, logout, editUser, getMyProfile } from "../controller/authController.js";
const authRoute = express.Router();

authRoute.post("/addUser",protect,restrictTo("admin"),addUser);
authRoute.get("/getUsers",protect,restrictTo("admin"), getUsers);
authRoute.get("/getMyProfile", protect, getMyProfile);
authRoute.delete("/deleteUser/:userId",protect,restrictTo("admin"),deleteUser);
authRoute.put("/editUser/:userId", protect, editUser);
authRoute.post("/login", login);
authRoute.post("/logout", logout);
export default authRoute;