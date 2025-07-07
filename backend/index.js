import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/mongoConnect.js";
import cookieParser from "cookie-parser";
import authRoute from "./route/authRoute.js";
import eventRoute from "./route/eventRoute.js";
import speakerRoute from "./route/speaskerRoute.js";
import registerRoute from "./route/resgistrationRoute.js";
import archiveRoute from "./route/archiveRoute.js";
import newsAndBlogRoute from "./route/newsAndBlogRoute.js";
import homePageRoute from "./route/home/homePageRoute.js";
import videoBlogRoute from "./route/videoBlogRoute.js";
import contactRoute from "./route/contactRoute.js";
import { checkCookieConsent } from "./utils/auth.js";
import { viewCounterController } from "./controller/viewCounterController.js";
import viewCounterRoute from "./route/viewCounterRoute.js";

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = [
  "http://localhost:3000",
  "http://192.168.1.21:3000",
  "https://arunachalwebapp.vercel.app",
  "https://arunchalwebapp.gully2global.in",
];
dotenv.config();
await connectDB();
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser(process.env.SECRET_KEY));
app.get("/", (req, res) => {
  res.send("Welcome to Arunachal Literature Fest API");}
);
app.use("/api/v1", checkCookieConsent,viewCounterRoute)
app.use("/api/v1/onboarding", authRoute);
app.use("/api/v1/event", eventRoute);
app.use("/api/v1/speaker", speakerRoute);
app.use("/api/v1/registration", registerRoute);
app.use("/api/v1/archive", archiveRoute);
app.use("/api/v1/newsAndBlog", newsAndBlogRoute);
app.use("/api/v1/homePage", homePageRoute);
app.use("/api/v1/videoBlog", videoBlogRoute);
app.use("/api/v1/sendMail", contactRoute);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
