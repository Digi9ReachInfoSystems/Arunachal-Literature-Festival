import mongoose from "mongoose";

const EventsCollectionSchema = new mongoose.Schema({
    name: String,
    description: String,
    year: Number,
    month: Number,
    startDate: Date,
    endDate: Date,
    totalDays: Number,
    createdAt: Date,
    updatedAt: Date,
    location: String,
});
const EventsCollection = mongoose.model("EventsCollection", EventsCollectionSchema);

const EventDayCollectionSchema = new mongoose.Schema({
    event_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventsCollection",
    },
    dayNumber: Number,
    name: String,
    description: String,
    createdAt: Date,
    updatedAt: Date,
});
const EventDayCollection = mongoose.model("EventDayCollection", EventDayCollectionSchema);

const TimeCollectionSchema = new mongoose.Schema({
    event_ref: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventsCollection",
    },
    day_ref:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "EventDayCollection",

    },
    startTime: Date,
    endTime: Date,
    title: String,
    description: String,
    type:{
        type: String,
        enum: ["event", "break"],
        default: "event",
    },
    speaker: String,
    createdAt: Date,
    updatedAt: Date,

})
const TimeCollection = mongoose.model("TimeCollection", TimeCollectionSchema);
export {EventsCollection, EventDayCollection, TimeCollection};