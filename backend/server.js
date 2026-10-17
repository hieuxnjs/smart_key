require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mqtt = require("mqtt");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const http = require("http");
const { Server } = require("socket.io");
const { Op } = require("sequelize");

// Lấy toàn bộ model từ index.js
const {
  sequelize,
  User,
  AccessLog,
  Setting,
  EnrolledFace,
  initSetting,
} = require("./models");

const authRoutes = require("./routes/auth");
const { verifyToken, JWT_SECRET } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
  maxHttpBufferSize: 1e8, // 100MB buffer for base64 image streams
});

const multer = require("multer");
const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 },
  storage: multer.memoryStorage(),
});

const PORT = process.env.PORT || 5000;
const MQTT_BROKER_URL =
  process.env.MQTT_BROKER_URL || "mqtt://broker.hivemq.com:1883";

// Cấu hình AI Face Service (hỗ trợ thay đổi động qua Web Admin)
let AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://spearhead-lens-cardstock.ngrok-free.dev";
let AI_API_KEY = process.env.AI_API_KEY || "smartlock_ai_secret_key_2026";

const getAiHeaders = (extraHeaders = {}) => ({
  "X-API-KEY": AI_API_KEY,
  "ngrok-skip-browser-warning": "true",
  "User-Agent": "SmartLock-Backend",
  ...extraHeaders,
});

// Định nghĩa Topic MQTT
const TOPIC_CONTROL = "kma_lock/control";
const TOPIC_STATUS = "kma_lock/status";
const TOPIC_CAMERA_LOG = "kma_lock/camera_log";
const TOPIC_BELL = "kma_lock/doorbell";
const TOPIC_PROMPT = "kma_lock/prompt";
const TOPIC_ENROLL_PROGRESS = "kma_lock/enroll_progress";
const TOPIC_ACK = "kma_lock/ack";

// Express Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lưu trữ cảnh báo người lạ có ảnh chụp gần nhất
let latestStrangerAlert = null;

// Socket.io Connection Handler
io.on("connection", (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);
  if (latestStrangerAlert) {
    socket.emit("camera_alert", latestStrangerAlert);
  }
  socket.on("disconnect", () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

// In-memory state tracking
let isMqttConnected = false;
let isDeviceOnline = false;
let lastDeviceSeen = 0;
let doorOpenState = false;
let doorState = 0;
let buzzerActive = false;
let lastDoorEventTime = new Date();

// Tự động kiểm tra timeout ngoại tuyến (ESP32 không gửi heartbeat trong 35s -> đánh dấu Offline)
setInterval(() => {
  if (isDeviceOnline && Date.now() - lastDeviceSeen > 35000) {
    isDeviceOnline = false;
    console.warn("[ESP32] Không có tín hiệu trong 35s -> Thiết bị đã Ngoại Tuyến (OFFLINE)");
  }
}, 5000);

// Tự động kiểm tra và gửi cảnh báo nếu cửa mở quá lâu (sau 1 phút chưa đóng)
let doorLeftOpenAlertSent = false;
setInterval(async () => {
  if (doorOpenState) {
    const elapsedMs = Date.now() - new Date(lastDoorEventTime).getTime();
    if (elapsedMs >= 60000 && !doorLeftOpenAlertSent) {
      doorLeftOpenAlertSent = true;
      const durationMins = Math.max(1, Math.round(elapsedMs / 60000));
      const alertMsg = `CẢNH BÁO: Cửa chính đã mở hơn ${durationMins} phút chưa được đóng!`;
      console.warn(`[Door Alert] ${alertMsg}`);

      const alertPayload = {
        type: "door_left_open",
        durationSec: Math.round(elapsedMs / 1000),
        openedAt: lastDoorEventTime,
        message: alertMsg,
      };

      io.emit("door_left_open", alertPayload);

      try {
        const log = await AccessLog.create({
          rfid_uid: null,
          action: "CẢNH BÁO: Cửa chính mở hơn 1 phút chưa đóng!",
          timestamp: new Date(),
        });
        io.emit("new_log", log);
      } catch (e) {
        console.error("[Door Alert Log Error]:", e.message);
      }
    }
  } else {
    if (doorLeftOpenAlertSent) {
      doorLeftOpenAlertSent = false;
      io.emit("door_closed_resolved", { message: "Cửa chính đã được đóng an toàn." });
    }
  }
}, 5000);

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

  mqttClient.subscribe(
    [TOPIC_STATUS, TOPIC_CAMERA_LOG, TOPIC_BELL, TOPIC_PROMPT, TOPIC_ENROLL_PROGRESS],
    (err) => {
      if (err) {
        console.error(
          `[MQTT] Failed to subscribe to topics:`,
          err.message,
        );
      } else {
        console.log(
          `[MQTT] Subscribed to topics: ${TOPIC_STATUS}, ${TOPIC_CAMERA_LOG}, ${TOPIC_BELL}, ${TOPIC_PROMPT}, ${TOPIC_ENROLL_PROGRESS}`,
        );
      }
    },
  );

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
// Xử lý Telemetry gửi từ ESP32 & Camera AI qua MQTT
// ----------------------------------------------------
mqttClient.on("message", async (topic, payload) => {
  // 0. Xử lý sự kiện Bấm Chuông, Thử Thách & Tiến Trình Đăng Ký từ AI
  if (topic === TOPIC_BELL) {
    console.log(`[MQTT Inbound] Doorbell rung! Topic: ${topic}`);
    io.emit("doorbell_ring", {
      timestamp: new Date(),
      message: "Có người vừa bấm chuông cửa! AI đang kích hoạt camera quét mặt...",
    });
    return;
  }

  if (topic === TOPIC_PROMPT) {
    const rawPrompt = payload.toString().trim();
    console.log(`[MQTT Inbound] AI Prompt / Challenge: ${rawPrompt}`);
    try {
      const data = JSON.parse(rawPrompt);
      io.emit("ai_prompt", data);
    } catch (e) {
      io.emit("ai_prompt", { text: rawPrompt });
    }
    return;
  }

  if (topic === TOPIC_ENROLL_PROGRESS) {
    const rawProgress = payload.toString().trim();
    console.log(`[MQTT Inbound] AI Enroll Progress: ${rawProgress}`);
    try {
      const data = JSON.parse(rawProgress);
      io.emit("enroll_progress", data);
    } catch (e) {
      io.emit("enroll_progress", { text: rawProgress });
    }
    return;
  }

  // 1. Xử lý ảnh chụp người lạ / giả mạo từ Camera AI (Topic: kma_lock/camera_log)
  if (topic === TOPIC_CAMERA_LOG) {
    const rawPayload = payload.toString().trim();
    console.log(`[MQTT Inbound] Camera Image received on ${topic} (Length: ${rawPayload.length})`);

    let base64Image = "";
    let imageTimestamp = new Date();
    let alertAction = "CANH BAO: Phat hien nguoi la (UNKNOWN) truoc cua!";

    try {
      const parsed = JSON.parse(rawPayload);
      base64Image = parsed.image_data || parsed.image || parsed.base64 || parsed.data || parsed.image_base64 || "";
      if (parsed.timestamp) imageTimestamp = new Date(parsed.timestamp);
      if (parsed.action) {
        alertAction = parsed.action;
      } else if (parsed.spoofing || parsed.fake || (parsed.type && String(parsed.type).toUpperCase().includes("SPOOF"))) {
        alertAction = "CANH BAO: Phat hien gia mao khuon mat (Anti-Spoofing)!";
      }
    } catch {
      base64Image = rawPayload;
    }

    if (base64Image.startsWith('"') && base64Image.endsWith('"')) {
      base64Image = base64Image.slice(1, -1);
    }
    if (base64Image.startsWith("data:image")) {
      const parts = base64Image.split(",");
      if (parts.length > 1) base64Image = parts[1];
    }

    if (base64Image) {
      try {
        // Tìm log cảnh báo người lạ trong vòng 30 giây gần nhất chưa có ảnh để gán kèm
        let targetLog = await AccessLog.findOne({
          where: {
            [Op.or]: [
              { action: { [Op.like]: "%nguoi la%" } },
              { action: { [Op.like]: "%UNKNOWN%" } },
              { action: { [Op.like]: "%CANH BAO%" } },
              { action: { [Op.like]: "%gia mao%" } },
            ],
            timestamp: { [Op.gte]: new Date(Date.now() - 30000) },
            image_data: null,
            image_base64: null,
          },
          order: [["timestamp", "DESC"]],
        });

        if (targetLog) {
          await targetLog.update({
            image_data: base64Image,
            image_base64: base64Image,
          });
          console.log(`[MySQL] Đã đính kèm ảnh Camera vào nhật ký ID: ${targetLog.id}`);
        } else {
          targetLog = await AccessLog.create({
            rfid_uid: null,
            action: alertAction,
            image_data: base64Image,
            image_base64: base64Image,
            timestamp: imageTimestamp,
          });
          console.log(`[MySQL] Đã tạo mới bản ghi phát hiện người lạ ID: ${targetLog.id}`);
        }

        latestStrangerAlert = {
          id: targetLog.id,
          action: targetLog.action,
          image_data: base64Image,
          image_base64: base64Image,
          timestamp: targetLog.timestamp,
        };

        // Bắn sự kiện thời gian thực qua Socket.io tới Frontend
        io.emit("camera_alert", latestStrangerAlert);
        io.emit("new_log", targetLog);
      } catch (err) {
        console.error("[Camera Log Error] Lỗi lưu ảnh camera:", err.message);
      }
    }
    return;
  }

  // 2. Xử lý trạng thái và sự kiện từ ESP32 / Camera AI (Topic: kma_lock/status)
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

    const action = data.action || data.event || null;
    const rfidUid = data.uid || data.rfid || null;
    const eventTime = data.timestamp ? new Date(data.timestamp) : new Date();

    // Cập nhật trạng thái trực tuyến của ESP32
    if (data.online === false || action === "ESP32_OFFLINE" || action === "OFFLINE") {
      isDeviceOnline = false;
      console.log("[ESP32] Thiết bị đã ngắt kết nối (OFFLINE)");
    } else {
      isDeviceOnline = true;
      lastDeviceSeen = Date.now();
    }

    const reportedDoorState = Number(data.door_state);
    if (data.door_state !== undefined && data.door_state !== null && [0, 1, 2].includes(reportedDoorState)) {
      doorState = reportedDoorState;
      doorOpenState = doorState === 1;
      lastDoorEventTime = eventTime;
    } else if (
      action && (
        action.includes("DOOR_OPEN") ||
        action.includes("RFID_OPEN") ||
        action.includes("PIN_OPEN") ||
        action.includes("Chu_Nha")
      )
    ) {
      doorOpenState = true;
      doorState = 1;
      lastDoorEventTime = eventTime;
    } else if (action && action.includes("DOOR_CLOSE")) {
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

    // Chỉ lưu log nếu có sự kiện / hành động cụ thể từ thiết bị (tránh spam UNKNOWN_EVENT khi ESP32 chỉ cập nhật trạng thái)
    if (action && action !== "UNKNOWN_EVENT" && action !== "ESP32_OFFLINE") {
      let imageToAttach = null;
      if (
        (action.includes("nguoi la") || action.includes("CANH BAO") || action.includes("UNKNOWN") || action.includes("gia mao")) &&
        latestStrangerAlert &&
        Date.now() - new Date(latestStrangerAlert.timestamp).getTime() < 15000
      ) {
        imageToAttach = latestStrangerAlert.image_data || latestStrangerAlert.image_base64;
      }

      const log = await AccessLog.create({
        rfid_uid: rfidUid,
        action: action,
        image_data: imageToAttach,
        image_base64: imageToAttach,
        timestamp: eventTime,
      });
      console.log(
        `[MySQL] Logged access event: ${action} (RFID: ${rfidUid || "N/A"})`,
      );

      if (imageToAttach) {
        latestStrangerAlert.id = log.id;
        io.emit("camera_alert", latestStrangerAlert);
      }

      // Phát realtime cho Frontend
      io.emit("new_log", log);
      io.emit("status_change", {
        online: isDeviceOnline,
        deviceOnline: isDeviceOnline,
        doorOpen: doorOpenState,
        doorState,
        buzzerActive,
        systemLocked: (await Setting.findByPk(1))?.system_locked || false,
      });
    }
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
      online: isDeviceOnline,
      deviceOnline: isDeviceOnline,
      mqttConnected: isMqttConnected,
      doorOpen: doorOpenState,
      doorState,
      buzzerActive,
      systemLocked: isLocked,
      autoCloseDelay: setting ? setting.auto_close_delay : 10,
      lastEventTime: lastDoorEventTime,
      latestStrangerAlert,
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

app.get("/api/camera/latest", verifyToken, async (req, res) => {
  try {
    if (latestStrangerAlert) {
      return res.json({ success: true, data: latestStrangerAlert });
    }
    const lastImageLog = await AccessLog.findOne({
      where: {
        [Op.or]: [
          { image_data: { [Op.ne]: null } },
          { image_base64: { [Op.ne]: null } },
        ],
      },
      order: [["timestamp", "DESC"]],
    });
    if (lastImageLog) {
      const img = lastImageLog.image_data || lastImageLog.image_base64;
      return res.json({
        success: true,
        data: {
          id: lastImageLog.id,
          action: lastImageLog.action,
          image_data: img,
          image_base64: img,
          timestamp: lastImageLog.timestamp,
        },
      });
    }
    res.json({ success: true, data: null });
  } catch (error) {
    res.status(500).json({ success: false, error: "Không thể lấy ảnh camera: " + error.message });
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

    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

    const setting = await Setting.findByPk(1);
    const systemLocked = Boolean(setting?.system_locked);
    if (command === "OPEN_DOOR" && systemLocked) {
      return res.status(403).json({
        success: false,
        error: "Khóa hệ thống đang bật. Hãy mở khóa hệ thống trước.",
      });
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
    if (command === "OPEN_DOOR") {
      doorOpenState = true;
      doorState = 1;
      lastDoorEventTime = new Date();
    }
    if (command === "CLOSE_DOOR") {
      doorOpenState = false;
      doorState = 0;
      lastDoorEventTime = new Date();
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

    io.emit("status_change", {
      online: isDeviceOnline,
      deviceOnline: isDeviceOnline,
      doorOpen: doorOpenState,
      doorState,
      buzzerActive,
      systemLocked: nextSystemLocked,
    });
    io.emit("new_log", log);

    res.json({
      success: true,
      command,
      doorOpen: doorOpenState,
      doorState,
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
    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

    const setting = await Setting.findByPk(1);
    if (setting && setting.system_locked) {
      return res.status(403).json({
        success: false,
        error:
          "Hệ thống đang trong chế độ Phong Tỏa Khẩn Cấp. Vui lòng hủy phong tỏa trước khi mở cửa.",
      });
    }

    doorOpenState = true;
    doorState = 1;
    lastDoorEventTime = new Date();

    await publishMqtt(TOPIC_CONTROL, "OPEN_DOOR");

    const log = await AccessLog.create({
      rfid_uid: null,
      action: "Mở qua Web Dashboard",
      timestamp: new Date(),
    });

    io.emit("status_change", {
      online: isDeviceOnline,
      deviceOnline: isDeviceOnline,
      doorOpen: true,
      doorState: 1,
      buzzerActive,
      systemLocked: Boolean(setting?.system_locked),
    });
    io.emit("new_log", log);

    res.json({
      success: true,
      doorOpen: true,
      doorState: 1,
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

app.post("/api/control/close", verifyToken, async (req, res) => {
  try {
    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

    doorOpenState = false;
    doorState = 0;
    lastDoorEventTime = new Date();

    await publishMqtt(TOPIC_CONTROL, "CLOSE_DOOR");

    const setting = await Setting.findByPk(1);
    const log = await AccessLog.create({
      rfid_uid: null,
      action: "Đóng cửa từ Web Dashboard",
      timestamp: new Date(),
    });

    io.emit("status_change", {
      online: isDeviceOnline,
      deviceOnline: isDeviceOnline,
      doorOpen: false,
      doorState: 0,
      buzzerActive,
      systemLocked: Boolean(setting?.system_locked),
    });
    io.emit("new_log", log);

    res.json({
      success: true,
      doorOpen: false,
      doorState: 0,
      message: "Đã gửi lệnh đóng cửa từ xa thành công!",
      log,
    });
  } catch (error) {
    console.error("[API Error] /api/control/close:", error.message);
    res.status(500).json({
      success: false,
      error: "Lỗi khi gửi lệnh đóng cửa: " + error.message,
    });
  }
});

app.post("/api/control/toggle-system-lock", verifyToken, async (req, res) => {
  try {
    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

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
    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

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
    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

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
    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

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
    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
    }

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

    if (!/^\d{4}$/.test(newPassword.toString().trim())) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu mới phải gồm đúng 4 chữ số.",
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

    const isMatch = await bcrypt.compare(admin_pass.toString(), user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: "Mật khẩu tài khoản Web Admin không chính xác.",
      });
    }

    if (!isMqttConnected || !isDeviceOnline) {
      return res.status(503).json({ success: false, error: "Hệ thống đang ở chế độ offline không thể thao tác" });
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
// AI CAMERA INTEGRATION ENDPOINTS
// ----------------------------------------------------

// 0. Nhận Log & Cảnh báo từ máy AI FastAPI sang Web Server (POST /api/ai/sync-face-log)
// Tuyệt đối không dùng verifyToken để máy AI bên ngoài có thể gửi qua Ngrok mà không bị 401 Unauthorized
app.post("/api/ai/sync-face-log", async (req, res) => {
  try {
    const payload = req.body || {};
    const face = payload.face || {};

    // 1. Trích xuất dữ liệu: action, door_state, buzzer_active, system_locked và object face
    const action = payload.action || "face";
    const door_state = payload.door_state !== undefined ? payload.door_state : face.door_state;
    const buzzer_active = payload.buzzer_active !== undefined ? payload.buzzer_active : face.buzzer_active;
    const system_locked = payload.system_locked !== undefined ? payload.system_locked : face.system_locked;

    const name = (face.name !== undefined ? face.name : (payload.name || "")).trim();
    const event_type = (face.event_type !== undefined ? face.event_type : (payload.event_type || "")).trim();
    const rawImage = face.image_base64 !== undefined ? face.image_base64 : (payload.image_base64 || "");
    const timestamp = face.timestamp || payload.timestamp || new Date();

    // 2. Chuẩn hóa chuỗi image_base64 (loại bỏ tiền tố data:image/... và dấu ngoặc kép thừa nếu có)
    let cleanBase64 = "";
    if (typeof rawImage === "string") {
      cleanBase64 = rawImage.trim();
      if (cleanBase64.startsWith('"') && cleanBase64.endsWith('"')) {
        cleanBase64 = cleanBase64.slice(1, -1);
      }
      if (cleanBase64.startsWith("data:image")) {
        const parts = cleanBase64.split(",");
        if (parts.length > 1) cleanBase64 = parts[1];
      }
    }

    // 3. Phân loại sự kiện (Người lạ vs Chủ nhà)
    const typeUpper = event_type.toUpperCase();
    const isStranger =
      typeUpper === "STRANGER" ||
      typeUpper.includes("LẠ") ||
      typeUpper.includes("UNKNOWN") ||
      name.toLowerCase().includes("unknown") ||
      name.toLowerCase().includes("người lạ");

    const isDoorOpened =
      door_state === 1 ||
      door_state === "1" ||
      door_state === true ||
      typeUpper === "OWNER";

    // 4. Xác định nội dung ghi nhận nhật ký (AccessLog)
    let actionText = "";
    if (isStranger) {
      actionText = "CẢNH BÁO: Phát hiện người lạ (AI Camera)!";
    } else if (isDoorOpened && name) {
      actionText = `Mở cửa bằng AI Camera: ${name}`;
    } else if (isDoorOpened) {
      actionText = "Mở cửa bằng AI Camera: Chủ nhà";
    } else {
      actionText = `Nhận diện AI Camera: ${name || event_type || action}`;
    }

    const eventDate = timestamp ? new Date(timestamp) : new Date();

    // 5. Cập nhật trạng thái phần cứng thiết bị (nếu máy AI gửi kèm)
    if (door_state !== undefined && door_state !== null) {
      const parsedDoorState = Number(door_state);
      if ([0, 1, 2].includes(parsedDoorState)) {
        doorState = parsedDoorState;
        doorOpenState = doorState === 1;
        lastDoorEventTime = eventDate;
      }
    } else if (isDoorOpened) {
      doorState = 1;
      doorOpenState = true;
      lastDoorEventTime = eventDate;
    }

    if (buzzer_active !== undefined && buzzer_active !== null) {
      buzzerActive = parseDeviceBoolean(buzzer_active);
    }

    if (system_locked !== undefined && system_locked !== null) {
      await Setting.upsert({ id: 1, system_locked: parseDeviceBoolean(system_locked) });
    }

    // 6. Lưu bản ghi vào cơ sở dữ liệu AccessLog
    const log = await AccessLog.create({
      rfid_uid: isStranger ? "AI_CAMERA" : (name ? `AI: ${name}` : "AI_OWNER"),
      action: actionText,
      image_data: cleanBase64 || null,
      image_base64: cleanBase64 || null,
      timestamp: eventDate,
    });

    // Tự động lưu khuôn mặt thật của thành viên vào bảng EnrolledFace
    if (!isStranger && name && !name.toLowerCase().includes("unknown")) {
      try {
        const existingFace = await EnrolledFace.findOne({ where: { name } });
        if (existingFace) {
          if (cleanBase64) await existingFace.update({ image_base64: cleanBase64 });
        } else {
          await EnrolledFace.create({ name, image_base64: cleanBase64 || null });
        }
      } catch (faceErr) {
        console.warn("[Sync Face] Could not auto-upsert EnrolledFace:", faceErr.message);
      }
    }

    // 7. Phát sự kiện Realtime qua Socket.io
    // 7.1. Cảnh báo người lạ: Cập nhật biến bộ nhớ và bắn camera_alert để Frontend bật Pop-up
    if (isStranger) {
      latestStrangerAlert = {
        id: log.id,
        action: actionText,
        image_data: cleanBase64,
        image_base64: cleanBase64,
        timestamp: log.timestamp,
        type: "stranger",
        event_type: "STRANGER",
        name: name || "Người lạ (UNKNOWN)",
      };
      io.emit("camera_alert", latestStrangerAlert);
    }

    // 7.2. Đồng bộ trạng thái khóa / cửa ra Frontend
    const currentSetting = await Setting.findByPk(1);
    io.emit("status_change", {
      online: isDeviceOnline,
      deviceOnline: isDeviceOnline,
      doorOpen: doorOpenState,
      doorState,
      buzzerActive,
      systemLocked: currentSetting?.system_locked || false,
    });

    // 7.3. Cập nhật nhật ký mới ngay tức thì cho Dashboard & History
    io.emit("new_log", log);

    console.log(`[Sync Face Log] Đồng bộ thành công: "${actionText}" (door_state=${doorState}, stranger=${isStranger})`);

    // 8. Trả về phản hồi JSON chuẩn cho máy AI
    return res.status(200).json({
      success: true,
      message: "Đồng bộ log thành công",
    });
  } catch (err) {
    console.error("[Sync Face Log Error]:", err.message);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
});

// 1. Nhận Access Log từ AI Service (Multipart: Chủ nhà mở cửa, người lạ, giả mạo, timeout)
app.post("/api/ai/access-log", upload.single("image"), async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey !== AI_API_KEY) {
    console.warn(`[AI Access Log] Từ chối truy cập: Sai API Key (${apiKey})`);
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const {
      event_id,
      type,
      name,
      score,
      source,
      note,
      door_opened,
      timestamp,
    } = req.body;

    let base64Image = "";
    if (req.file && req.file.buffer) {
      base64Image = req.file.buffer.toString("base64");
    }

    console.log(`[AI Access Log] type=${type}, name=${name}, score=${score}, door_opened=${door_opened}`);

    let actionText = "";
    const numScore = parseFloat(score || "0");
    const scorePercent = !isNaN(numScore) && numScore > 0 ? ` (${(numScore * 100).toFixed(0)}%)` : "";

    switch (type) {
      case "owner_access":
        actionText = `Mở cửa AI Camera - Chủ nhà: ${name || "Chủ nhà"}${scorePercent}`;
        break;
      case "stranger":
        actionText = "CẢNH BÁO: Phát hiện người lạ (AI Camera)!";
        break;
      case "spoof_suspected":
        actionText = `CẢNH BÁO: Phát hiện giả mạo khuôn mặt (Anti-Spoofing - ${name || "Nghi vấn ảnh/video"})!`;
        break;
      case "timeout":
        actionText = "AI Camera: Hết thời gian quét, không nhận diện được";
        break;
      case "owner_door_fail":
        actionText = `AI Camera: Đã nhận diện ${name || "Chủ nhà"} nhưng ESP32 không mở được cửa`;
        break;
      default:
        actionText = note || `AI Camera: ${type}`;
        break;
    }

    const eventDate = timestamp ? new Date(timestamp) : new Date();

    const log = await AccessLog.create({
      rfid_uid: name ? `AI: ${name}` : (type === "owner_access" ? "AI_OWNER" : "AI_CAMERA"),
      action: actionText,
      image_data: base64Image || null,
      image_base64: base64Image || null,
      timestamp: eventDate,
    });

    if (type === "stranger" || type === "spoof_suspected") {
      latestStrangerAlert = {
        id: log.id,
        action: actionText,
        image_data: base64Image,
        image_base64: base64Image,
        timestamp: log.timestamp,
        type: type,
        name: name || "",
        score: score || "",
        note: note || "",
      };
      io.emit("camera_alert", latestStrangerAlert);
    }

    const isDoorOpened = door_opened === true || door_opened === "true";
    if (isDoorOpened) {
      doorOpenState = true;
      doorState = 1;
      lastDoorEventTime = eventDate;
      const currentSetting = await Setting.findByPk(1);
      io.emit("status_change", {
        online: isDeviceOnline,
        deviceOnline: isDeviceOnline,
        doorOpen: doorOpenState,
        doorState,
        buzzerActive,
        systemLocked: currentSetting?.system_locked || false,
      });
    }

    io.emit("new_log", log);
    return res.status(200).json({ success: true, log_id: log.id });
  } catch (err) {
    console.error("[AI Access Log Error]:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 2. Nhận kết quả Đăng ký khuôn mặt từ AI Service
app.post("/api/ai/enroll-result", upload.single("image"), async (req, res) => {
  const apiKey = req.headers["x-api-key"];
  if (apiKey && apiKey !== AI_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { request_id, name, mode, status, message } = req.body;
    let base64Image = "";
    if (req.file && req.file.buffer) {
      base64Image = req.file.buffer.toString("base64");
    }

    console.log(`[AI Enroll Result] ${name}: ${status} - ${message}`);

    io.emit("enroll_result", {
      request_id,
      name,
      mode,
      status,
      message,
      image_base64: base64Image,
      timestamp: new Date(),
    });

    const logAction = status === "success"
      ? (mode === "add" ? `AI Camera: Bổ sung mẫu mặt cho '${name}' thành công` : `AI Camera: Đăng ký thành công chủ nhà '${name}'`)
      : `AI Camera: Đăng ký khuôn mặt '${name}' thất bại (${message})`;

    const log = await AccessLog.create({
      rfid_uid: `AI: ${name}`,
      action: logAction,
      image_data: base64Image || null,
      image_base64: base64Image || null,
      timestamp: new Date(),
    });
    io.emit("new_log", log);

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("[AI Enroll Result Error]:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// 3. Web Admin APIs: Proxy tới AI Service (FastAPI / Python)
// 3.0. Lấy và cập nhật động cấu hình URL máy chủ AI
app.get("/api/ai/config", verifyToken, (req, res) => {
  return res.json({
    success: true,
    url: AI_SERVICE_URL,
    apiKey: AI_API_KEY,
  });
});

app.post("/api/ai/config", verifyToken, (req, res) => {
  const { url, apiKey } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ success: false, error: "Vui lòng nhập địa chỉ URL máy AI hợp lệ" });
  }
  let cleanUrl = url.trim().replace(/\/+$/, "");
  if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
    cleanUrl = "https://" + cleanUrl;
  }
  AI_SERVICE_URL = cleanUrl;
  if (apiKey && typeof apiKey === "string") {
    AI_API_KEY = apiKey.trim();
  }
  console.log(`[AI Config] Đã cập nhật AI_SERVICE_URL: ${AI_SERVICE_URL}`);
  return res.json({
    success: true,
    message: "Đã cập nhật địa chỉ AI Service thành công!",
    url: AI_SERVICE_URL,
  });
});

// 3.1. Lấy danh sách khuôn mặt đã đăng ký từ máy AI
app.get("/api/ai/faces", verifyToken, async (req, res) => {
  try {
    let rawData = null;
    let errorDetails = "";

    // 1. Thử GET /people (FastAPI của hệ thống AI)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const r = await fetch(`${AI_SERVICE_URL}/people`, {
        headers: getAiHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (r && r.ok) {
        rawData = await r.json();
      }
    } catch (e) {
      errorDetails += `[/people: ${e.message}] `;
    }

    // 2. Thử GET /api/ai/faces (fallback)
    if (!rawData) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const r = await fetch(`${AI_SERVICE_URL}/api/ai/faces`, {
          headers: getAiHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (r && r.ok) {
          rawData = await r.json();
        }
      } catch (e) {
        errorDetails += `[/api/ai/faces: ${e.message}] `;
      }
    }

    // 3. Thử GET /api/faces (fallback)
    if (!rawData) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const r = await fetch(`${AI_SERVICE_URL}/api/faces`, {
          headers: getAiHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (r && r.ok) {
          rawData = await r.json();
        }
      } catch (e) {
        errorDetails += `[/api/faces: ${e.message}] `;
      }
    }

    // Nếu không kết nối được máy AI, nạp danh sách thành viên thực tế đã lưu trong MySQL Database (EnrolledFace)
    if (!rawData) {
      const dbFaces = await EnrolledFace.findAll({
        order: [["created_at", "DESC"]],
      });
      const realFaces = dbFaces.map((f) => ({
        name: f.name,
        created_at: f.created_at,
        image_base64: f.image_base64,
        source: "database",
      }));

      return res.json({
        success: true,
        count: realFaces.length,
        faces: realFaces,
        ai_online: false,
        warning: realFaces.length > 0
          ? "Hệ thống AI đang tạm nghỉ. Đang hiển thị danh sách thành viên đã lưu trong cơ sở dữ liệu."
          : null,
      });
    }

    // Chuẩn hóa danh sách faces trả về dạng mảng object đồng nhất:
    // [{ name, created_at, avatar_url, image_base64, count }]
    let faceList = [];

    if (Array.isArray(rawData)) {
      faceList = rawData.map((item) =>
        typeof item === "string" ? { name: item, created_at: null } : item
      );
    } else if (Array.isArray(rawData.people)) {
      faceList = rawData.people.map((item) =>
        typeof item === "string" ? { name: item, created_at: null } : item
      );
    } else if (Array.isArray(rawData.users)) {
      faceList = rawData.users.map((item) =>
        typeof item === "string" ? { name: item, created_at: null } : item
      );
    } else if (rawData.faces && typeof rawData.faces === "object") {
      faceList = Object.entries(rawData.faces).map(([name, val]) => ({
        name,
        count: typeof val === "number" ? val : (val.count || val.sample_count || 1),
        created_at: typeof val === "object" ? val.created_at : null,
        avatar_url: typeof val === "object" ? val.avatar_url : null,
        image_base64: typeof val === "object" ? val.image_base64 : null,
      }));
    } else if (typeof rawData === "object") {
      faceList = Object.entries(rawData)
        .filter(([k]) => !["success", "count", "message", "status"].includes(k))
        .map(([name, val]) => ({
          name,
          count: typeof val === "number" ? val : 1,
        }));
    }

    // Tự động lưu / cập nhật các khuôn mặt thật từ AI API vào MySQL Database (EnrolledFace)
    for (const f of faceList) {
      if (f.name && typeof f.name === "string") {
        await EnrolledFace.findOrCreate({
          where: { name: f.name.trim() },
          defaults: {
            name: f.name.trim(),
            created_at: f.created_at || new Date(),
            image_base64: f.image_base64 || null,
          },
        });
      }
    }

    return res.json({
      success: true,
      count: faceList.length,
      faces: faceList,
      ai_online: true,
      service_url: AI_SERVICE_URL,
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: "Không thể lấy danh sách khuôn mặt: " + err.message,
    });
  }
});

// 3.2. Bắt đầu phiên đăng ký khuôn mặt (gọi tới máy AI FastAPI /register)
app.post("/api/ai/enroll", verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const cleanName = (name || "").trim();

    if (!cleanName) {
      return res.status(400).json({ success: false, error: "Vui lòng nhập tên khuôn mặt" });
    }

    let response = null;
    let data = null;

    // 1. Thử gọi POST /register (FastAPI của hệ thống AI)
    try {
      response = await fetch(`${AI_SERVICE_URL}/register`, {
        method: "POST",
        headers: getAiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ name: cleanName }),
      });
      if (response && response.ok) {
        data = await response.json();
      }
    } catch (e) {}

    // 2. Thử gọi POST /api/ai/enroll
    if (!data) {
      try {
        response = await fetch(`${AI_SERVICE_URL}/api/ai/enroll`, {
          method: "POST",
          headers: getAiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ name: cleanName }),
        });
        if (response && response.ok) {
          data = await response.json();
        }
      } catch (e) {}
    }

    // 3. Thử gọi POST /api/enroll
    if (!data) {
      try {
        response = await fetch(`${AI_SERVICE_URL}/api/enroll`, {
          method: "POST",
          headers: getAiHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ name: cleanName, mode: "new" }),
        });
        if (response && response.ok) {
          data = await response.json();
        }
      } catch (e) {}
    }

    if (!data && (!response || !response.ok)) {
      let errMsg = "Không thể kết nối tới máy AI camera để quét mặt.";
      if (response) {
        try {
          const errJson = await response.json();
          errMsg = errJson.detail || errJson.error || errJson.message || errMsg;
        } catch (_) {
          errMsg = await response.text();
        }
      }
      return res.status(response?.status || 503).json({
        success: false,
        error: errMsg,
      });
    }

    // Ghi nhận nhật ký thành công
    await AccessLog.create({
      rfid_uid: `AI: ${cleanName}`,
      action: `Đăng ký khuôn mặt AI thành công: ${cleanName}`,
      timestamp: new Date(),
    });

    return res.status(200).json({
      success: true,
      message: `Đăng ký khuôn mặt cho '${cleanName}' thành công!`,
      data: data || {},
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: "Lỗi kết nối tới máy AI: " + err.message,
    });
  }
});

// 3.3. Xóa khuôn mặt khỏi cơ sở dữ liệu AI (gọi DELETE /people/{name})
app.delete("/api/ai/faces/:name", verifyToken, async (req, res) => {
  try {
    const name = req.params.name;
    let response = null;
    let data = null;

    // 1. Thử DELETE /people/{name} (FastAPI của hệ thống AI)
    try {
      response = await fetch(`${AI_SERVICE_URL}/people/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: getAiHeaders(),
      });
      if (response && response.ok) {
        data = await response.json();
      }
    } catch (e) {}

    // 2. Thử DELETE /api/ai/faces/{name}
    if (!data) {
      try {
        response = await fetch(`${AI_SERVICE_URL}/api/ai/faces/${encodeURIComponent(name)}`, {
          method: "DELETE",
          headers: getAiHeaders(),
        });
        if (response && response.ok) {
          data = await response.json();
        }
      } catch (e) {}
    }

    // 3. Thử DELETE /api/faces/{name}
    if (!data) {
      try {
        response = await fetch(`${AI_SERVICE_URL}/api/faces/${encodeURIComponent(name)}`, {
          method: "DELETE",
          headers: getAiHeaders(),
        });
        if (response && response.ok) {
          data = await response.json();
        }
      } catch (e) {}
    }

    if (!data && (!response || !response.ok)) {
      let errMsg = `Không thể xóa khuôn mặt ${name} trên máy AI.`;
      if (response) {
        try {
          const errJson = await response.json();
          errMsg = errJson.detail || errJson.error || errJson.message || errMsg;
        } catch (_) {}
      }
      return res.status(response?.status || 500).json({
        success: false,
        error: errMsg,
      });
    }

    // Xóa khỏi bảng lưu trữ EnrolledFace
    await EnrolledFace.destroy({ where: { name } });

    await AccessLog.create({
      rfid_uid: `AI: ${name}`,
      action: `Quản trị viên xóa khuôn mặt thành viên: ${name}`,
      timestamp: new Date(),
    });

    return res.json({
      success: true,
      name,
      message: `Đã xóa khuôn mặt '${name}' thành công.`,
    });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: "Không thể kết nối tới AI Face Service: " + err.message,
    });
  }
});

// 3.4. Giả lập bấm chuông cửa (Test Doorbell / Recognition Start)
app.post("/api/ai/ring", verifyToken, async (req, res) => {
  try {
    let response = null;
    let data = null;

    // 1. Thử gọi POST /recognition/start (FastAPI AI)
    try {
      response = await fetch(`${AI_SERVICE_URL}/recognition/start`, {
        method: "POST",
        headers: getAiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ timeout_seconds: 15 }),
      });
      if (response && response.ok) data = await response.json();
    } catch (e) {}

    // 2. Thử gọi POST /api/ring
    if (!data) {
      try {
        response = await fetch(`${AI_SERVICE_URL}/api/ring`, {
          method: "POST",
          headers: getAiHeaders(),
        });
        if (response && response.ok) data = await response.json();
      } catch (e) {}
    }

    if (!data && (!response || !response.ok)) {
      return res.status(response?.status || 503).json({
        success: false,
        error: "Không thể kích hoạt quét mặt trên máy AI",
      });
    }

    return res.json({ success: true, ...data });
  } catch (err) {
    return res.status(503).json({
      success: false,
      error: "Không thể kết nối tới AI Face Service: " + err.message,
    });
  }
});

// 3.5. Kiểm tra tình trạng kết nối AI Service (tối ưu phát hiện nhanh khi ngrok offline)
app.get("/api/ai/health", verifyToken, async (req, res) => {
  try {
    let isOk = false;
    let statusMsg = "";
    let aiData = null;

    // 1. Thử GET /health với timeout 2500ms
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const response = await fetch(`${AI_SERVICE_URL}/health`, {
        headers: getAiHeaders(),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const cType = response.headers.get("content-type") || "";
      if (response.ok && cType.includes("json")) {
        aiData = await response.json();
        isOk = true;
        statusMsg = "FastAPI Health OK";
      } else if (cType.includes("html") || response.status === 404 || response.status === 502) {
        // Ngrok tunnel offline hoặc trả HTML lỗi
        return res.json({
          online: false,
          url: AI_SERVICE_URL,
          message: response.status === 404 ? "Đường dẫn Ngrok đang tắt (ERR_NGROK_3200)" : `Ngrok trả mã lỗi HTTP ${response.status}`,
          ai_data: null,
        });
      }
    } catch (e) {}

    // 2. Thử GET /people (FastAPI endpoint phụ)
    if (!isOk) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const response = await fetch(`${AI_SERVICE_URL}/people`, {
          headers: getAiHeaders(),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        const cType = response.headers.get("content-type") || "";
        if (response.ok && cType.includes("json")) {
          isOk = true;
          statusMsg = "FastAPI /people OK";
        }
      } catch (e) {}
    }

    return res.json({
      online: isOk,
      url: AI_SERVICE_URL,
      message: statusMsg || (isOk ? "Trực tuyến" : "Ngoại tuyến"),
      ai_data: aiData,
    });
  } catch (err) {
    return res.json({ online: false, error: err.message, url: AI_SERVICE_URL });
  }
});

// 3.6. Lấy trạng thái nhận diện hiện tại
app.get("/api/ai/recognition-status", verifyToken, async (req, res) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const response = await fetch(`${AI_SERVICE_URL}/recognition/status`, {
      headers: getAiHeaders(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      return res.json({ success: true, ...data });
    }
    return res.json({ success: false, running: false });
  } catch (err) {
    return res.json({ success: false, error: err.message, running: false });
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

    // Tự động kiểm tra và thêm cột image_data, image_base64 nếu bảng đã tồn tại từ trước
    try {
      await sequelize.query("ALTER TABLE access_logs ADD COLUMN image_data LONGTEXT NULL;");
      console.log("[MySQL] Added image_data column to access_logs table.");
    } catch (e) {
      // Bỏ qua nếu cột đã tồn tại
    }
    try {
      await sequelize.query("ALTER TABLE access_logs ADD COLUMN image_base64 LONGTEXT NULL;");
    } catch (e) {
      // Bỏ qua nếu cột đã tồn tại
    }
    try {
      await sequelize.query("ALTER TABLE access_logs MODIFY COLUMN action VARCHAR(255);");
    } catch (e) {
      // Bỏ qua nếu cột action đã đủ độ dài
    }

    await initSetting();
    await Setting.update({ auto_mode_enabled: false }, { where: { id: 1 } });
    const setting = await Setting.findByPk(1);
    await publishMqtt(
      "kma_lock/config",
      JSON.stringify({ auto_mode: false, delay: setting?.auto_close_delay || 10 }),
    );
    console.log("[MySQL] Default system setting initialized.");

    await initAdminUser();

    server.listen(PORT, () => {
      console.log(
        `[Express + Socket.io] Smart Lock Server running on http://localhost:${PORT}`,
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
    server.listen(PORT, () => {
      console.log(
        `[Express + Socket.io] Server running on http://localhost:${PORT} (Waiting for MySQL to recover)`,
      );
    });
  }
}

startServer();
