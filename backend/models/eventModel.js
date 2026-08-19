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
// Auto-delete functionality removed - events will not be automatically deleted

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

const eventBroucherSchema = new mongoose.Schema({
  event_ref: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventsCollection",
    },
    pdf_url:{
      type:String,
      required:true,
    },
    createdAt: Date,
    updatedAt: Date,
  
})
const EventBroucher = mongoose.model("EventBroucher", eventBroucherSchema);

const scheduleDayPreviewSchema = new mongoose.Schema({
  dayNumber: {
    type: Number,
    required: true,
    unique: true,
  },
  label: {
    type: String,
  },
  images: {
    type: [String],
    default: [],
  },
  downloadUrl: {
    type: String,
    required: false,
  },
  createdAt: Date,
  updatedAt: Date,
});

scheduleDayPreviewSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  if (!this.createdAt) this.createdAt = new Date();
  if (!this.label) this.label = `DAY ${this.dayNumber}`;
  next();
});

const ScheduleDayPreview = mongoose.model(
  "ScheduleDayPreview",
  scheduleDayPreviewSchema
);

export { EventsCollection, EventDayCollection, TimeCollection, EventBroucher, ScheduleDayPreview };
