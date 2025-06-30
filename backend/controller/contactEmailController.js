import { contactUs, reply, Sender } from "../models/contactUsModel.js";
import { contactMail } from "../utils/sendEmail.js";

export const contactUsController = async (req, res) => {
  try {
    const sender = await Sender.find();
    const { name, email, message, phone } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and message are required fields",
      });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    const newContact = await contactUs.create({
      name,
      email,
      message,
      phone: phone || null,
      senderMail: sender[0].mail,
    });

    await contactMail(name, email, phone, message, sender[0].mail);

    return res.status(201).json({
      success: true,
      message: "Contact form submitted successfully",
      data: {
        contact: newContact,
        emailSent: true,
      },
    });
  } catch (err) {
    console.error("Error in contactUsController:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const addSenderMail = async (req, res) => {
  try {
    const mail = req.body;
    const existingSender = await Sender.findOne();

    if (existingSender) {
      return res.status(400).json({
        success: false,
        message: "Only one sender is allowed. Delete the existing one first.",
      });
    }
    const senderMail = await Sender.create(mail);
    return res.status(201).json({
      success: true,
      message: "Sender mail added successfully",
      data: senderMail,
    });
  } catch (err) {
    console.error("Error in addSenderMail:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const updateSenderMail = async (req, res) => {
  try {
    const { mailId } = req.params;
    const mail = req.body;
    const existing = await Sender.findById(mailId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sender mail not found",
      });
    }
    const updatedSenderMail = await Sender.findByIdAndUpdate(mailId, mail, {
      new: true,
    });

    return res.status(200).json({
      success: true,
      message: "Sender mail updated successfully",
      data: updatedSenderMail,
    });
  } catch (err) {
    console.error("Error in updateSenderMail:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const getAllSenderMail = async (req, res) => {
  try {
    const senderMail = await Sender.find();
    return res.status(200).json({
      success: true,
      message: "Sender mail fetched successfully",
      data: senderMail,
    });
  } catch (err) {
    console.error("Error in getAllSenderMail:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteSenderMail = async (req, res) => {
  try {
    const { mailId } = req.params;
    const existing = await Sender.findById(mailId);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Sender mail not found",
      });
    }
    const deletedSenderMail = await Sender.findByIdAndDelete(mailId);
    return res.status(200).json({
      success: true,
      message: "Sender mail deleted successfully",
      data: deletedSenderMail,
    });
  } catch (err) {
    console.error("Error in deleteSenderMail:", err.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

//gitadd