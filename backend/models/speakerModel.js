import mongoose from "mongoose";

const speakerSchema = new mongoose.Schema({
    event_ref:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventsCollection",
    },
    name: String,
    about: String,
    image_url: String,
    createdAt: Date,
    updatedAt: Date,
});
const Speaker = mongoose.model("Speaker", speakerSchema);
export default Speaker;