import TeamMember from "../models/teamModel.js";
import multer from "multer";
import { saveBufferToLocal, deleteLocalByUrl } from "../utils/fileStorage.js";
import { sortByDisplayOrder } from "../utils/displayOrder.js";

const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image_url");

const handleFileUpload = (req, res) => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err) => {
      if (err) {
        console.error("Multer error:", err);
        return reject(new Error("File upload failed: " + err.message));
      }
      resolve();
    });
  });
};

export const getTeamMembers = async (req, res) => {
  try {
    const members = sortByDisplayOrder(await TeamMember.find());
    res.status(200).json({
      success: true,
      data: members,
    });
  } catch (error) {
    console.error("Error getting team members:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const getTeamMemberById = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }
    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    console.error("Error getting team member:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const addTeamMember = async (req, res) => {
  try {
    await handleFileUpload(req, res);

    const title = (req.body.title || "").trim();
    if (!title) {
      return res.status(400).json({
        success: false,
        message: "Title is required",
      });
    }

    let image_url;
    if (req.file) {
      image_url = await saveBufferToLocal(req.file, "Team");
    }

    const order = req.body.order !== undefined && req.body.order !== ""
      ? Number(req.body.order)
      : 0;

    const member = await TeamMember.create({
      title,
      description: req.body.description || "",
      designation: (req.body.designation || "").trim(),
      image_url,
      order: Number.isFinite(order) ? order : 0,
    });

    res.status(201).json({
      success: true,
      message: "Team member added successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error adding team member:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const updateTeamMember = async (req, res) => {
  try {
    await handleFileUpload(req, res);

    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    if (req.body.title !== undefined) {
      const title = req.body.title.trim();
      if (!title) {
        return res.status(400).json({
          success: false,
          message: "Title is required",
        });
      }
      member.title = title;
    }

    if (req.body.description !== undefined) {
      member.description = req.body.description;
    }

    if (req.body.designation !== undefined) {
      member.designation = req.body.designation;
    }

    if (req.body.order !== undefined && req.body.order !== "") {
      const order = Number(req.body.order);
      if (Number.isFinite(order)) member.order = order;
    }

    if (req.file) {
      if (member.image_url) {
        try {
          await deleteLocalByUrl(member.image_url);
        } catch (e) {
          console.error("Image delete failed (continuing):", e?.message || e);
        }
      }
      member.image_url = await saveBufferToLocal(req.file, "Team");
    }

    await member.save();

    res.status(200).json({
      success: true,
      message: "Team member updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error updating team member:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

export const deleteTeamMember = async (req, res) => {
  try {
    const member = await TeamMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({
        success: false,
        message: "Team member not found",
      });
    }

    if (member.image_url) {
      try {
        await deleteLocalByUrl(member.image_url);
      } catch (e) {
        console.error("File delete failed (continuing):", e?.message || e);
      }
    }

    const deleted = await TeamMember.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: "Team member deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("Error deleting team member:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};
