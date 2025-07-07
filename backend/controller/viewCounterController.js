import ViewCounter from "../models/viewCounterModel.js";
import crypto from "crypto";
export const viewCounterController = async (req, res) => {
  let userID = req.signedCookies.userID;
  if (!userID) {
    userID = crypto.randomUUID();

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("userID", userID, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
      maxAge: 30 * 24 * 60 * 60 * 1000,
      signed: true,
      path: "/",
    });
    console.log("New guest tracked:", userID);
      const today = new Date().toISOString().slice(0, 10);
    let pageView = await ViewCounter.findOne({ date: today });
    
  if (!pageView) {
    pageView = new ViewCounter({ date: today });
  }
    pageView.views += 1;
    if (!pageView.uniqueUser.includes(userID)) {
      pageView.uniqueUser.push(userID);
    }
    await pageView.save();
  } else {
    console.log("Returning user:", userID);
  }
  const responseMessage = req.hasCookieConsent
    ? "User Tracked with Cookie: " + (userID || "No tracking - no consent")
    : "Tracking requires cookie consent";

  res.send(responseMessage);
};

export const getViewCounterData = async (req, res) => {
  try {
    const viewData = await ViewCounter.find({});
    res.status(200).json({
      success: true,
      data: viewData,
    });
  } catch (error) {
    console.error("Error fetching view counter data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
