import mongoose from "mongoose";

const contactUsSchmea = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  senderMail:{
    type:[String],
    required:true
  },

  email: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const contactUs = mongoose.model("ContactUs", contactUsSchmea);

const replySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },
  contactUs: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ContactUs",
    
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const reply = mongoose.model("Reply", replySchema);

const senderSchema = new mongoose.Schema({
    mail:{
        type:String,
        required:true
    }

})
const Sender = mongoose.model("Sender",senderSchema)
export { contactUs, reply,Sender };
