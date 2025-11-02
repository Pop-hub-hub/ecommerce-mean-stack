const jwt = require('jsonwebtoken');
const User = require('../models/userModel');


const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader) {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (!scheme || !token || scheme.toLowerCase() !== 'bearer') {
      return res.status(401).json({ status: "error", message: "Unauthorized" });
    }

    if (!process.env.JWT_SECRET_KEY) {
      console.error('JWT_SECRET_KEY is not set');
      return res.status(500).json({ status: "error", message: "Server misconfiguration" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(403).json({ status: "error", message: "Invalid or expired token" });
  }
};

module.exports = verifyToken;