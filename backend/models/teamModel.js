import mongoose from "mongoose";

const teamMemberSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  designation: {
    type: String,
  },
  image_url: {
    type: String,
  },
  order: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

teamMemberSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);
export default TeamMember;
