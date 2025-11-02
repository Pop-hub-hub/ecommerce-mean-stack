const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
// Get all users (excluding sensitive data) only admin can get all users const
getAllUser = async (req, res) => {
  try {
    const users = await User.find({}, { __v: false, password: false });
    res
      .status(200)
      .json({
        status: "success",
        message: "Users retrieved successfully",
        users: users,
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Cannot get all users" });
  }
};
// Register a new user
const register = async (req, res) => {
  try {
    // Check required fields
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      console.log("Missing required fields");
      return res
        .status(400)
        .json({
          status: "error",
          message:
            "All fields are required: firstName, lastName, email, password",
          received: {
            firstName,
            lastName,
            email,
            password: password ? "***" : undefined,
          },
        });
    }
    // Check if email exists
    const userExist = await User.findOne({ email: email });
    if (userExist) {
      console.log("User already exists:", email);
      return res
        .status(400)
        .json({
          status: "error",
          message: "User with this email already exists",
        });
    }
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Password hashed successfully");
    // Create user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "user",
    });
    console.log("User created in DB:", {
      id: newUser._id,
      email: newUser.email,
    });
    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "30d",
    });
    // Prepare response (exclude sensitive data)
    const userResponse = {
      id: newUser._id,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      role: newUser.role,
      token: token,
    };
    console.log("Registration successful for:", email);
    res
      .status(201)
      .json({
        status: "success",
        message: "User registered successfully",
        user: userResponse,
      });
  } catch (error) {
    console.error("Registration error:", error);
    res
      .status(500)
      .json({
        status: "error",
        message: error.message || "Failed to register user",
        error: process.env.NODE_ENV === "development" ? error.stack : undefined,
      });
  }
};
// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and password are required" });
    }
    const foundUser = await User.findOne({ email: email });
    if (!foundUser) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid email or password" });
    }
    const validPassword = await bcrypt.compare(password, foundUser.password);
    if (validPassword) {
      const token = jwt.sign(
        { id: foundUser._id },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "30d" }
      );
      foundUser.token = token;
      await foundUser.save();
      // Send response without sensitive data
      const userResponse = {
        id: foundUser._id,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        email: foundUser.email,
        role: foundUser.role,
        token: token,
      };
      res
        .status(200)
        .json({
          status: "success",
          message: "User logged in successfully",
          user: userResponse,
        });
    } else {
      res
        .status(401)
        .json({ status: "error", message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ status: "error", message: "Cannot login user" });
  }
};
// Get user by ID only admin can get user by id
const getUserById = async (req, res) => {
  try {
    const foundUser = await User.findById(req.params.id, {
      __v: false,
      password: false,
    });
    res.status(200).json(foundUser);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Cannot get user" });
  }
};
// Delete user only admin can delete user
const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Cannot delete user" });
  }
};
// Delete all users without admin account (admin only)
const deleteAllUsers = async (req, res) => {
  try {
    const deletedUsers = await User.deleteMany({ role: { $ne: "admin" } });
    res.status(200).json(deletedUsers);
  } catch (error) {
    res.status(500).json({ status: "error", message: "Cannot delete users" });
  }
};
// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res
        .status(400)
        .json({ status: "error", message: "User ID is required" });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    // Generate new token
    const newToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "30d",
    });
    // Update user's token
    user.token = newToken;
    await user.save();
    res
      .status(200)
      .json({
        status: "success",
        message: "Token refreshed successfully",
        token: newToken,
      });
  } catch (error) {
    console.error("Error refreshing token:", error);
    res.status(500).json({ status: "error", message: "Cannot refresh token" });
  }
};
// Update user (self can update basic fields; only admin can change role or update others) only admin can update user
const updateUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const requester = req.user;
    // set by verifyToken
    const isAdmin = requester?.role === "admin";
    const isSelf = String(requester?._id) === String(targetUserId);
    if (!isAdmin && !isSelf) {
      return res
        .status(403)
        .json({ status: "error", message: "Access denied" });
    }
    // Allow fields
    const allowedForSelf = ["firstName", "lastName", "email"];
    const allowedForAdmin = [
      "firstName",
      "lastName",
      "email",
      "role",
      "isActive",
    ];
    const allowedFields = isAdmin ? allowedForAdmin : allowedForSelf;
    const updates = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }
    // prevent empty update
    if (Object.keys(updates).length === 0) {
      return res
        .status(400)
        .json({ status: "error", message: "No allowed fields to update" });
    }
    const updatedUser = await User.findByIdAndUpdate(targetUserId, updates, {
      new: true,
    });
    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }
    res
      .status(200)
      .json({
        status: "success",
        message: "User updated successfully",
        updatedUser,
      });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Cannot update user" });
  }
};
module.exports = {
  getAllUser,
  register,
  login,
  getUserById,
  updateUser,
  deleteUser,
  refreshToken,
  deleteAllUsers,
};
