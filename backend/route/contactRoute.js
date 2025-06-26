import express from 'express';
import { addSenderMail, contactUsController, deleteSenderMail, getAllSenderMail, updateSenderMail } from '../controller/contactEmailController.js';
import { protect, restrictTo } from '../utils/auth.js';

const contactRoute = express.Router();

contactRoute.post("/contactUsMail", contactUsController);
contactRoute.post("/addsenderMail",protect,restrictTo("admin"), addSenderMail)
contactRoute.get("/getSenderMail",getAllSenderMail)
contactRoute.delete("/deleteSenderMail/:mailId",protect,restrictTo("admin"),deleteSenderMail)
contactRoute.post("/updateSenderMail/:mailId",protect,restrictTo("admin","user"), updateSenderMail)

// contactRoute.post("/sendReply", reply);

export default contactRoute