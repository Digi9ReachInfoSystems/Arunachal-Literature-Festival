import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();


const connectDB = async ()=>{
try {
    await mongoose.connect(process.env.MONGO_URI);
    app.listen(3000, () => console.log("App running"));
  } catch (err) {
    console.error("DB connection failed:", err);
  }
}
export default connectDB;