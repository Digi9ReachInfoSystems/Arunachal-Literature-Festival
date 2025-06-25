import express from 'express';
import { protect, restrictTo } from '../utils/auth.js';
import { addVideoBlog } from '../controller/VideoBlogsController.js';

const videoBlogRoute = express.Router();

videoBlogRoute.post("/addVideoBLog",protect,restrictTo("admin"),addVideoBlog);

export default videoBlogRoute