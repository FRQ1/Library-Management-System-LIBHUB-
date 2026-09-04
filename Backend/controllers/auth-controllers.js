const crypto = require("crypto");
const User = require("../models/user-model");
const generateToken = require("../utils/generate-token");
const sendEmail = require("../utils/send-email");

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const newUser = await User.create({
      name,
      email,
      password,
      role: "member",
    });

    const rawToken = newUser.createVerificationToken();
    await newUser.save({ validateBeforeSave: false });

    await sendEmail({
      to: newUser.email,
      subject: "Verify your LibHub account",
      text: `Welcome to LibHub! Your email verification token is: ${rawToken}`,
    });

    const token = generateToken(newUser._id);

    res.status(201).json({
      status: "success",
      message: "Account created. Please check your email to verify your account",
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

const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpires: { $gt: Date.now() },
    }).select("+verificationToken +verificationTokenExpires");

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Verification link is invalid or has expired",
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Email verified successfully. You can now log in",
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

    if (!user.isVerified) {
      return res.status(403).json({
        status: "fail",
        message: "Please verify your email before logging in",
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

const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(200).json({
        status: "success",
        message: "If that email is registered, a reset link has been sent",
      });
    }

    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    await sendEmail({
      to: user.email,
      subject: "Reset your LibHub password",
      text: `Forgot your password? Your reset token is: ${rawToken}\nThis token expires in 1 hour. If you didn't request this, ignore this email.`,
    });

    res.status(200).json({
      status: "success",
      message: "If that email is registered, a reset link has been sent",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    }).select("+resetPasswordToken +resetPasswordExpires");

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Reset link is invalid or has expired",
      });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({
      status: "success",
      message: "Password reset successfully. You can now log in",
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
};