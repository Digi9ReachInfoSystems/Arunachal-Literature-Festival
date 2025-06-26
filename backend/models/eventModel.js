import mongoose from "mongoose";

const EventsCollectionSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Make name required,
  description: { type: String, required: true }, // Make description required,String,
  year: { type: Number, required: true }, // Make year required,Number,
  month: { type: Number, required: true },
  startDate: { type: Date, required: true }, // Make startDate required,Date,
  endDate: { type: Date, required: true },
  totalDays: Number,
  createdAt: Date,
  updatedAt: Date,
  location: String,
});
EventsCollectionSchema.post("save", function (doc) {
  const endDate = new Date(doc.endDate);
  const now = new Date();
  const delay = endDate.getTime() - now.getTime() + 86400000; // 24h after end

  if (delay > 0) {
    setTimeout(async () => {
      try {
        // Delete event and its associated days
        await mongoose.model("EventsCollection").findByIdAndDelete(doc._id);
        await mongoose
          .model("EventDayCollection")
          .deleteMany({ event_ref: doc._id });
        await mongoose
          .model("TimeCollection")
          .deleteMany({ event_ref: doc._id });
        console.log(`Auto-deleted event: ${doc.name} (ID: ${doc._id})`);
      } catch (err) {
        console.error(`Failed to auto-delete event ${doc._id}:`, err);
      }
    }, delay);
  }
});

// Update timestamp on modification
EventsCollectionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});
const EventsCollection = mongoose.model(
  "EventsCollection",
  EventsCollectionSchema
);

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
const EventDayCollection = mongoose.model(
  "EventDayCollection",
  EventDayCollectionSchema
);

const TimeCollectionSchema = new mongoose.Schema({
  event_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventsCollection",
  },
  day_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventDayCollection",
  },
  startTime: {
    type: String,
    required: true,
  },
  endTime: {
    type: String,
    required: true,
  },
  title: String,
  description: String,
  type: {
    type: String,
    enum: ["event", "break"],
    default: "event",
  },
  speaker: String,
  createdAt: Date,
  updatedAt: Date,
});
const TimeCollection = mongoose.model("TimeCollection", TimeCollectionSchema);
export { EventsCollection, EventDayCollection, TimeCollection };
