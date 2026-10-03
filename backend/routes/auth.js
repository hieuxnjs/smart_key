const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Lấy model User từ thư mục models (sẽ tự động đọc file index.js)
const { User } = require("../models");
const { JWT_SECRET, verifyToken } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Vui lòng cung cấp đầy đủ tên đăng nhập và mật khẩu.",
        });
    }

    const cleanUsername = username.toString().trim();
    const cleanPassword = password.toString().trim();

    if (cleanUsername.length < 3) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Tên đăng nhập phải có ít nhất 3 ký tự.",
        });
    }

    if (cleanPassword.length < 6) {
      return res
        .status(400)
        .json({ success: false, error: "Mật khẩu phải có ít nhất 6 ký tự." });
    }

    const existing = await User.findOne({ where: { username: cleanUsername } });
    if (existing) {
      return res
        .status(409)
        .json({
          success: false,
          error: "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.",
        });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(cleanPassword, salt);

    const newUser = await User.create({
      username: cleanUsername,
      password: hashedPassword,
      role: role || "admin",
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      success: true,
      message: "Tạo tài khoản quản trị thành công!",
      token,
      user: { id: newUser.id, username: newUser.username, role: newUser.role },
    });
  } catch (error) {
    console.error("[Auth Error] /register:", error.message);
    return res
      .status(500)
      .json({
        success: false,
        error: "Đăng ký tài khoản thất bại: " + error.message,
      });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({
          success: false,
          error: "Vui lòng nhập tên đăng nhập và mật khẩu.",
        });
    }

    const cleanUsername = username.toString().trim();
    const cleanPassword = password.toString().trim();

    const user = await User.findOne({ where: { username: cleanUsername } });
    if (!user) {
      return res
        .status(401)
        .json({
          success: false,
          error: "Tên đăng nhập hoặc mật khẩu không chính xác.",
        });
    }

    const isPasswordValid = await bcrypt.compare(cleanPassword, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({
          success: false,
          error: "Tên đăng nhập hoặc mật khẩu không chính xác.",
        });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.json({
      success: true,
      message: "Đăng nhập hệ thống thành công!",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (error) {
    console.error("[Auth Error] /login:", error.message);
    return res
      .status(500)
      .json({ success: false, error: "Đăng nhập thất bại: " + error.message });
  }
});

/**
 * GET /api/auth/me
 */
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ["id", "username", "role", "createdAt"],
    });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Không tìm thấy người dùng." });
    }

    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
