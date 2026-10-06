require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Lấy toàn bộ model từ index.js
const {
  sequelize,
  User,
  AccessLog,
  Setting,
  User,
  initSetting,
} = require("./models");

const authRoutes = require("./routes/auth");
const { verifyToken, JWT_SECRET } = require("./middleware/auth");

const app = express();
const PORT = process.env.PORT || 5000;
const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

// Định nghĩa Topic MQTT
const TOPIC_CONTROL = "kma_lock/control";
const TOPIC_STATUS = "kma_lock/status";

// Express Middleware
app.use(cors());
app.use(express.json());

// In-memory state tracking
let isMqttConnected = false;
let doorOpenState = false;
let doorState = 0;
let buzzerActive = false;
let lastDoorEventTime = new Date();

function parseDeviceBoolean(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const state = value.trim().toLowerCase();
    return ["1", "true", "on", "active", "locked", "kêu", "beeping", "sounding"].includes(state)
      || state.startsWith("on_")
      || state.endsWith("_on")
      || state.includes("active")
      || state.includes("beep")
      || state.includes("sound");
  }
  return false;
}

// ----------------------------------------------------
// Khởi tạo MQTT Client kết nối HiveMQ Broker
// ----------------------------------------------------
console.log(`[MQTT] Connecting to broker: ${MQTT_BROKER_URL}...`);
const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  clientId: `smartlock_server_${Math.random().toString(16).substring(2, 10)}`,
});

mqttClient.on("connect", () => {
  isMqttConnected = true;
  console.log("[MQTT] Connected successfully to HiveMQ broker");

  mqttClient.subscribe(TOPIC_STATUS, (err) => {
    if (err) {
      console.error(
        `[MQTT] Failed to subscribe to ${TOPIC_STATUS}:`,
        err.message,
      );
    } else {
      console.log(`[MQTT] Subscribed to topic: ${TOPIC_STATUS}`);
    }
  });

  Setting.findByPk(1).then((setting) => {
    mqttClient.publish(
      "kma_lock/config",
      JSON.stringify({ auto_mode: false, delay: setting?.auto_close_delay || 10 }),
      { qos: 1 },
    );
  }).catch((error) => {
    console.warn("[MQTT] Could not disable automatic opening:", error.message);
  });
});

mqttClient.on("reconnect", () => {
  console.log("[MQTT] Reconnecting to HiveMQ broker...");
});

mqttClient.on("close", () => {
  isMqttConnected = false;
  console.log("[MQTT] Client went offline");
});

mqttClient.on("error", (err) => {
  console.error("[MQTT] Connection error:", err.message);
});

// Hàm hỗ trợ publish lệnh MQTT an toàn
function publishMqtt(topic, message) {
  return new Promise((resolve, reject) => {
    if (!isMqttConnected) {
      console.warn(`[MQTT] Cannot publish to ${topic}: Client offline`);
      return resolve();
    }

    mqttClient.publish(topic, message, { qos: 1 }, (err) => {
      if (err) {
        console.error(
          `[MQTT Publish Error] Failed to publish ${message} to ${topic}:`,
          err.message,
        );
        return reject(err);
      }
      console.log(`[MQTT Published] ${topic} -> ${message}`);
      resolve();
    });
  });
}

// ----------------------------------------------------
// Xử lý Telemetry gửi từ ESP32 qua MQTT
// ----------------------------------------------------
mqttClient.on("message", async (topic, payload) => {
  if (topic !== TOPIC_STATUS) return;

  const rawMessage = payload.toString().trim();
  console.log(`[MQTT Inbound] Received on ${topic}:`, rawMessage);

  try {
    let data;
    try {
      data = JSON.parse(rawMessage);
    } catch {
      data = { action: rawMessage };
    }

    const action = data.action || data.event || "UNKNOWN_EVENT";
    const rfidUid = data.uid || data.rfid || null;
    const eventTime = data.timestamp ? new Date(data.timestamp) : new Date();

    const reportedDoorState = Number(data.door_state);
    if (data.door_state !== undefined && data.door_state !== null && [0, 1, 2].includes(reportedDoorState)) {
      doorState = reportedDoorState;
      doorOpenState = doorState === 1;
      lastDoorEventTime = eventTime;
    } else if (
      action.includes("DOOR_OPEN") ||
      action.includes("RFID_OPEN") ||
      action.includes("PIN_OPEN")
    ) {
      doorOpenState = true;
      doorState = 1;
      lastDoorEventTime = eventTime;
    } else if (action.includes("DOOR_CLOSE")) {
      doorOpenState = false;
      doorState = 0;
      lastDoorEventTime = eventTime;
    }

    const reportedBuzzer = data.buzzer_state ?? data.buzzer_active ?? data.buzzer;
    if (typeof reportedBuzzer !== "undefined") {
      buzzerActive = parseDeviceBoolean(reportedBuzzer);
    }

    if (typeof data.system_locked !== "undefined") {
      await Setting.upsert({ id: 1, system_locked: parseDeviceBoolean(data.system_locked) });
    }

    await AccessLog.create({
      rfid_uid: rfidUid,
      action: action,
      timestamp: eventTime,
    });
    console.log(
      `[MySQL] Logged access event: ${action} (RFID: ${rfidUid || "N/A"})`,
    );
  } catch (error) {
    console.error(
      "[MQTT Processing Error] Failed to process message:",
      error.message,
    );
  }
});

// ----------------------------------------------------
// REST API Routes
// ----------------------------------------------------

// Router Xác Thực Người Dùng
app.use("/api/auth", authRoutes);

app.get("/api/status", verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    const isLocked = setting ? setting.system_locked : false;

    res.json({
      success: true,
      online: true,
      mqttConnected: isMqttConnected,
      doorOpen: doorOpenState,
      doorState,
      buzzerActive,
      systemLocked: isLocked,
      autoCloseDelay: setting ? setting.auto_close_delay : 10,
      lastEventTime: lastDoorEventTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Lỗi lấy trạng thái hệ thống: " + error.message,
    });
  }
});

app.get("/api/settings", verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    res.json({
      success: true,
      data: {
        id: 1,
        system_locked: setting ? setting.system_locked : false,
        hasPassword: Boolean(setting && setting.current_password),
        auto_close_delay: setting ? setting.auto_close_delay : 10,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Lỗi lấy cấu hình hệ thống: " + error.message,
    });
  }
});

app.get("/api/logs", verifyToken, async (req, res) => {
  try {
    const logs = await AccessLog.findAll({
      order: [["timestamp", "DESC"]],
      limit: 50,
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error("[API Error] /api/logs:", error.message);
    res.status(500).json({
      success: false,
      error: "Không thể lấy dữ liệu nhật ký truy cập.",
    });
  }
});

app.delete("/api/logs", verifyToken, async (req, res) => {
  try {
    await AccessLog.destroy({ where: {}, truncate: true });
    console.log("[MySQL] AccessLogs table cleared via API");
    res.json({
      success: true,
      message: "Toàn bộ nhật ký truy cập đã được xóa sạch thành công.",
    });
  } catch (error) {
    console.error("[API Error] DELETE /api/logs:", error.message);
    res.status(500).json({
      success: false,
      error: "Không thể xóa nhật ký: " + error.message,
    });
  }
});

app.post("/api/control/command", verifyToken, async (req, res) => {
  try {
    const { command } = req.body;
    const allowedCommands = [
      "OPEN_DOOR",
      "CLOSE_DOOR",
      "LOCK_SYSTEM",
      "UNLOCK_SYSTEM",
      "BUZZER_ON",
      "BUZZER_OFF",
    ];
    if (!allowedCommands.includes(command)) {
      return res.status(400).json({ success: false, error: "Lệnh điều khiển không hợp lệ." });
    }

    const setting = await Setting.findByPk(1);
    const systemLocked = Boolean(setting?.system_locked);
    if (command === "OPEN_DOOR" && systemLocked) {
      return res.status(403).json({
        success: false,
        error: "Khóa hệ thống đang bật. Hãy mở khóa hệ thống trước.",
      });
    }
    if (!isMqttConnected) {
      return res.status(503).json({ success: false, error: "Khóa cửa hiện không kết nối. Vui lòng thử lại sau." });
    }

    await publishMqtt(TOPIC_CONTROL, command);

    let nextSystemLocked = systemLocked;
    if (command === "LOCK_SYSTEM" || command === "UNLOCK_SYSTEM") {
      nextSystemLocked = command === "LOCK_SYSTEM";
      await Setting.upsert({ id: 1, system_locked: nextSystemLocked });
    }
    if (command === "BUZZER_ON" || command === "BUZZER_OFF") {
      buzzerActive = command === "BUZZER_ON";
    }

    const actionLabels = {
      OPEN_DOOR: "Mở cửa từ bảng điều khiển",
      CLOSE_DOOR: "Đóng cửa từ bảng điều khiển",
      LOCK_SYSTEM: "Đã khóa quyền truy cập",
      UNLOCK_SYSTEM: "Đã mở lại quyền truy cập",
      BUZZER_ON: "Đã bật còi báo động",
      BUZZER_OFF: "Đã tắt còi báo động",
    };
    const log = await AccessLog.create({
      rfid_uid: null,
      action: actionLabels[command],
      timestamp: new Date(),
    });

    res.json({
      success: true,
      command,
      systemLocked: nextSystemLocked,
      buzzerActive,
      message: actionLabels[command],
      log,
    });
  } catch (error) {
    console.error("[API Error] /api/control/command:", error.message);
    res.status(500).json({ success: false, error: "Không thể gửi lệnh tới khóa cửa." });
  }
});

app.post("/api/control/open", verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    if (setting && setting.system_locked) {
      return res.status(403).json({
        success: false,
        error:
          "Hệ thống đang trong chế độ Phong Tỏa Khẩn Cấp. Vui lòng hủy phong tỏa trước khi mở cửa.",
      });
    }

    doorOpenState = true;
    lastDoorEventTime = new Date();

    const delay = setting?.auto_close_delay
      ? setting.auto_close_delay * 1000
      : 5000;
    setTimeout(() => {
      doorOpenState = false;
    }, delay);

    await publishMqtt(TOPIC_CONTROL, "OPEN_DOOR");

    const log = await AccessLog.create({
      rfid_uid: null,
      action: "Mở qua Web Dashboard",
      timestamp: new Date(),
    });

    res.json({
      success: true,
      doorOpen: true,
      message: "Đã mở khóa cửa từ xa qua Web Dashboard thành công!",
      log,
    });
  } catch (error) {
    console.error("[API Error] /api/control/open:", error.message);
    res.status(500).json({
      success: false,
      error: "Lỗi khi gửi lệnh mở cửa: " + error.message,
    });
  }
});

app.post("/api/control/toggle-system-lock", verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    const currentState = setting ? setting.system_locked : false;
    const targetState = !currentState;

    const command = targetState ? "LOCK_SYSTEM" : "UNLOCK_SYSTEM";
    await publishMqtt(TOPIC_CONTROL, command);

    await Setting.upsert({
      id: 1,
      system_locked: targetState,
    });

    const actionText = targetState
      ? "Bật phong tỏa khẩn cấp"
      : "Hủy phong tỏa khẩn cấp";
    const log = await AccessLog.create({
      rfid_uid: null,
      action: actionText,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      systemLocked: targetState,
      message: targetState
        ? "Đã kích hoạt phong tỏa khẩn cấp! Bàn phím và đầu đọc RFID đã bị khóa."
        : "Đã hủy phong tỏa hệ thống. Bàn phím và RFID hoạt động bình thường.",
      log,
    });
  } catch (error) {
    console.error(
      "[API Error] /api/control/toggle-system-lock:",
      error.message,
    );
    res.status(500).json({
      success: false,
      error: "Lỗi khi chuyển trạng thái phong tỏa: " + error.message,
    });
  }
});

app.post("/api/control/lock", verifyToken, async (req, res) => {
  try {
    await publishMqtt(TOPIC_CONTROL, "LOCK_SYSTEM");
    await Setting.upsert({ id: 1, system_locked: true });
    await AccessLog.create({
      rfid_uid: null,
      action: "Bật phong tỏa khẩn cấp",
      timestamp: new Date(),
    });
    res.json({
      success: true,
      systemLocked: true,
      message:
        "Đã kích hoạt phong tỏa khẩn cấp! Bàn phím và đầu đọc RFID đã bị khóa.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Lỗi kích hoạt phong tỏa: " + error.message,
    });
  }
});

app.post("/api/control/unlock", verifyToken, async (req, res) => {
  try {
    await publishMqtt(TOPIC_CONTROL, "UNLOCK_SYSTEM");
    await Setting.upsert({ id: 1, system_locked: false });
    await AccessLog.create({
      rfid_uid: null,
      action: "Hủy phong tỏa khẩn cấp",
      timestamp: new Date(),
    });
    res.json({
      success: true,
      systemLocked: false,
      message:
        "Đã hủy phong tỏa hệ thống. Bàn phím và RFID hoạt động bình thường.",
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, error: "Lỗi hủy phong tỏa: " + error.message });
  }
});

app.post("/api/settings", verifyToken, async (req, res) => {
  try {
    const { auto_close_delay } = req.body;
    const updatePayload = {};

    updatePayload.auto_mode_enabled = false;
    if (typeof auto_close_delay !== "undefined") {
      updatePayload.auto_close_delay = Math.max(
        1,
        parseInt(auto_close_delay, 10) || 10,
      );
    }

    await Setting.update(updatePayload, { where: { id: 1 } });
    const updated = await Setting.findByPk(1);

    try {
      if (isMqttConnected) {
        mqttClient.publish(
          "kma_lock/config",
          JSON.stringify({
            auto_mode: updated.auto_mode_enabled,
            delay: updated.auto_close_delay,
          }),
          { qos: 1 },
        );
      }
    } catch (e) {
      console.warn("[MQTT] Config publish skipped:", e.message);
    }

    res.json({
      success: true,
      message: "Đã lưu thời gian tự đóng cửa.",
      data: { auto_close_delay: updated.auto_close_delay },
    });
  } catch (error) {
    console.error("[API Error] /api/settings:", error.message);
    res.status(500).json({
      success: false,
      error: "Không thể cập nhật cài đặt: " + error.message,
    });
  }
});

app.post("/api/settings/password", verifyToken, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng nhập mật khẩu cũ và mật khẩu mới.",
      });
    }

    const setting = await Setting.findByPk(1);
    if (!setting || oldPassword.toString().trim() !== setting.current_password) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu cũ không chính xác.",
      });
    }

    if (!/^\d{4,8}$/.test(newPassword.toString().trim())) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu mới phải gồm từ 4 đến 8 chữ số.",
      });
    }

    const pinString = newPassword.toString().trim();

    await Setting.upsert({ id: 1, current_password: pinString });

    try {
      if (isMqttConnected) {
        mqttClient.publish(
          "kma_lock/config",
          JSON.stringify({ pin: pinString }),
          { qos: 1 },
        );
      }
    } catch {
      // Non-blocking
    }

    await AccessLog.create({
      rfid_uid: null,
      action: "Cập nhật mã PIN bàn phím",
      timestamp: new Date(),
    });

    res.json({ success: true, message: "Đã cập nhật mật khẩu mở cửa thành công!" });
  } catch (error) {
    console.error("[API Error] /api/settings/password:", error.message);
    res
      .status(500)
      .json({ success: false, error: "Lỗi cập nhật mã PIN: " + error.message });
  }
});

app.post("/api/settings/password/reset", verifyToken, async (req, res) => {
  try {
    const { admin_pass, pin } = req.body;
    const user = await User.findByPk(req.user.id);
    if (!user || user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Chỉ quản trị viên mới được đặt lại mật khẩu khóa.",
      });
    }
    if (!admin_pass || !/^\d{4}$/.test((pin || "").toString())) {
      return res.status(400).json({ success: false, error: "Mã PIN mới phải gồm đúng 4 chữ số." });
    }
    if (!isMqttConnected) {
      return res.status(503).json({ success: false, error: "Khóa cửa hiện không kết nối. Vui lòng thử lại sau." });
    }

    const pinString = pin.toString();
    await publishMqtt(
      "kma_lock/config",
      JSON.stringify({ admin_pass: admin_pass.toString(), pin: pinString }),
    );
    await Setting.upsert({ id: 1, current_password: pinString });
    await AccessLog.create({
      rfid_uid: null,
      action: "Quản trị viên đặt lại mật khẩu khóa",
      timestamp: new Date(),
    });

    res.json({ success: true, message: "Đã đặt lại mật khẩu khóa thành công." });
  } catch (error) {
    console.error("[API Error] PIN reset:", error.message);
    res.status(500).json({ success: false, error: "Không thể đặt lại mật khẩu khóa." });
  }
});

// ----------------------------------------------------
// Khởi Động Server & Đảm Bảo Tài Khoản Quản Trị
// ----------------------------------------------------
async function initAdminUser() {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      console.log(
        "[MySQL] Users table is empty. Initializing default admin user...",
      );
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        username: "admin",
        password: hashedPassword,
        role: "admin",
      });
      console.log(
        '[MySQL] Default admin created (username: "admin", password: "admin123").',
      );
    }
    console.log("[MySQL] Clean start: Database initialized with 0 mock logs.");
  } catch (err) {
    console.error("[MySQL Init Warning]", err.message);
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("[MySQL] Database connection authenticated successfully.");

    await sequelize.sync({ alter: false });
    console.log("[MySQL] Models synchronized with MySQL schema.");

    await initSetting();
    await Setting.update({ auto_mode_enabled: false }, { where: { id: 1 } });
    const setting = await Setting.findByPk(1);
    await publishMqtt(
      "kma_lock/config",
      JSON.stringify({ auto_mode: false, delay: setting?.auto_close_delay || 10 }),
    );
    console.log("[MySQL] Default system setting initialized.");

    await initAdminUser();

    app.listen(PORT, () => {
      console.log(
        `[Express] Smart Lock Server running on http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error(
      "[Fatal Error] Unable to connect to MySQL database:",
      error.message,
    );
    console.warn(
      "[Notice] Ensure MySQL is running and properly configured in .env",
    );
    app.listen(PORT, () => {
      console.log(
        `[Express] Server running on http://localhost:${PORT} (Waiting for MySQL to recover)`,
      );
    });
  }
}

startServer();
