const User = require("../models/User");
const jwt = require("jsonwebtoken");

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "travelmindsecret", {
    expiresIn: "30d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  console.log("Backend: Request received for registration");
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      console.log("Backend: Validation failed, missing fields");
      return res.status(400).json({ message: "Please enter all fields" });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log("Backend: Registration failed, user already exists");
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("Backend: Validation passed, saving user...");
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      console.log("Backend: User successfully created. Generating JWT...");
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
      console.log("Backend: Response sent for register");
    } else {
      console.log("Backend: Failed to save user");
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Backend error in registerUser:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  console.log("Backend: Request received for login");
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      console.log("Backend: Validation failed, missing fields");
      return res.status(400).json({ message: "Please enter all fields" });
    }

    console.log("Backend: Searching for user...");
    const user = await User.findOne({ email });

    if (!user) {
      console.log("Backend: User not found");
      return res.status(401).json({ message: "Invalid credentials" });
    }
    console.log("Backend: User found.");

    if (await user.matchPassword(password)) {
      console.log("Backend: Password matched. Generating JWT...");
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
      console.log("Backend: Response sent for login");
    } else {
      console.log("Backend: Password mismatch");
      res.status(401).json({ message: "Invalid credentials" });
    }
  } catch (error) {
    console.log("Backend error in loginUser:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update current user profile (name, email, password)
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name, email, password, currentPassword } = req.body;

    // Validate current password if changing password
    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Please provide your current password to set a new one." });
      }
      const isMatch = await user.matchPassword(currentPassword);
      if (!isMatch) {
        return res.status(401).json({ message: "Current password is incorrect." });
      }
      user.password = password;
    }

    if (name) user.name = name;
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) return res.status(400).json({ message: "Email already in use by another account." });
      user.email = email;
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      createdAt: updatedUser.createdAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
};
