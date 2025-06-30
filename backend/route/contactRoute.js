import express from 'express';
import { addSenderMail, contactUsController, deleteSenderMail, getAllSenderMail, updateSenderMail, getAllContactEmails, getAllContactMessages, getContactMessageByEmail, deleteContactMessage } from '../controller/contactEmailController.js';
import { protect, restrictTo } from '../utils/auth.js';

const contactRoute = express.Router();

contactRoute.post("/contactUsMail", contactUsController);
contactRoute.post("/addsenderMail",protect,restrictTo("admin"), addSenderMail)
contactRoute.get("/getSenderMail",getAllSenderMail)
contactRoute.delete("/deleteSenderMail/:mailId",protect,restrictTo("admin"),deleteSenderMail)
contactRoute.post("/updateSenderMail/:mailId",protect,restrictTo("admin","user"), updateSenderMail)
contactRoute.get("/getAllContactMessages", getAllContactMessages);
contactRoute.delete("/deleteContactMessage/:id", deleteContactMessage);

// contactRoute.post("/sendReply", );

export default contactRoute