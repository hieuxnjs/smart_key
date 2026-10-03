const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "smartlock_super_secret_jwt_esp32_kma_2026";

/**
 * Middleware xác thực Bearer token JWT
 * Bảo vệ các endpoint nhạy cảm (/api/control/* và /api/settings/*)
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error:
        "Truy cập bị từ chối: Thiếu tiêu đề Authorization (yêu cầu Bearer token).",
    });
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      success: false,
      error: "Truy cập bị từ chối: Không tìm thấy Bearer token hợp lệ.",
    });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      const isExpired = err.name === "TokenExpiredError";
      return res.status(403).json({
        success: false,
        error: isExpired
          ? "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
          : "Mã xác thực token không hợp lệ.",
      });
    }

    req.user = decoded;
    next();
  });
}

module.exports = {
  verifyToken,
  JWT_SECRET,
};
