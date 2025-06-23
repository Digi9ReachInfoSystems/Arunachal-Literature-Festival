import User from "../models/userModel.js";
import { generateToken } from "../utils/auth.js";
import bcrypt from "bcryptjs";


const addUser = async (req, res) => {
    try {
        const { name, email, password,confirmPassword } = req.body;
        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
            }
       
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({ name, email, password:hashedPassword });
        await user.save();
        res.status(201).json({ message: "User added successfully" });
    } catch (error) {
        console.error("Something went wrong",error.message);
        res.status(500).json({ message: "Server error" });
    }
};
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password", 
      });
    }

    // Compare passwords
    const isPasswordValid = await user.comparePassword(password); // comparePassword must be defined in schema
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password",
      });
    }
    const expiresAt = new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    );


    const token = generateToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000, 
      sameSite: "strict", 
    });
    await user.save();

    // Prepare user data response
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: userData,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
const logout = async (req, res) => {
 try {
   
    const token = req.cookies?.token || 
                 (req.headers.authorization?.startsWith("Bearer") 
                  ? req.headers.authorization.split(" ")[1] 
                  : null);

 
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/", 
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during logout",
    });
  }
};
const getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Server error" });
  }
};




export { addUser, login, logout, getUsers,deleteUser };



