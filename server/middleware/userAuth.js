import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";

const userAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : req.headers.token;

    if (!token) {
      return res.json({
        success: false,
        message: "Not Authorized, login required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by ID from token
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    if (!user.isActive) {
      return res.json({ success: false, message: "Account is deactivated" });
    }

    // Check if password was changed after token was issued
    if (decoded.lastPasswordChange && user.lastPasswordChange) {
      const tokenPasswordChange = new Date(decoded.lastPasswordChange);
      if (user.lastPasswordChange > tokenPasswordChange) {
        return res.json({
          success: false,
          message: "Session expired due to password change, please log in again",
        });
      }
    }

    // Add user info to request object
    req.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
    next();
  } catch (error) {
    console.log("Authentication error:", error);
    res.json({ success: false, message: "Invalid token" });
  }
};

export default userAuth;