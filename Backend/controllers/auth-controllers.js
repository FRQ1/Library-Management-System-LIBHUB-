const User = require("../models/user-model");
const generateToken = require("../utils/generate-token");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = await User.create({
      name,
      email,
      password,
      role: "member",
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      status: "success",
      message: "Account created successfully",
      token,
      data: {
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};


// Login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        status: "fail",
        message: "This account has been suspended. Please contact an admin",
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      status: "success",
      message: "Logged in successfully",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profilePicture: user.profilePicture,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const logout = async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
};


module.exports = {
  register,
  login,
  logout,
};