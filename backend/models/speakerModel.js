import mongoose from "mongoose";

const speakerSchema = new mongoose.Schema({
    year_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SpeakerYear",
    },
    event_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventsCollection",
    },
    name: String,
    about: String,
    image_url: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

speakerSchema.pre("save", function (next) {
    this.updatedAt = new Date();
    next();
});

const Speaker = mongoose.model("Speaker", speakerSchema);
export default Speaker;
