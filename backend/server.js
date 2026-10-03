require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mqtt = require('mqtt');
const bcrypt = require('bcrypt');
const { sequelize, AccessLog, Setting, User, initSetting } = require('./models');
const authRoutes = require('./routes/auth');
const { verifyToken } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';

// Định nghĩa Topic MQTT
const TOPIC_CONTROL = 'kma_lock/control';
const TOPIC_STATUS = 'kma_lock/status';

// Express Middleware
app.use(cors());
app.use(express.json());

// In-memory state tracking
let isMqttConnected = false;
let doorOpenState = false;
let lastDoorEventTime = new Date();

// ----------------------------------------------------
// Khởi tạo MQTT Client kết nối HiveMQ Broker
// ----------------------------------------------------
console.log(`[MQTT] Connecting to broker: ${MQTT_BROKER_URL}...`);
const mqttClient = mqtt.connect(MQTT_BROKER_URL, {
  reconnectPeriod: 3000,
  connectTimeout: 10000,
  clientId: `smartlock_server_${Math.random().toString(16).substring(2, 10)}`,
});

mqttClient.on('connect', () => {
  isMqttConnected = true;
  console.log('[MQTT] Connected successfully to HiveMQ broker');

  mqttClient.subscribe(TOPIC_STATUS, (err) => {
    if (err) {
      console.error(`[MQTT] Failed to subscribe to ${TOPIC_STATUS}:`, err.message);
    } else {
      console.log(`[MQTT] Subscribed to topic: ${TOPIC_STATUS}`);
    }
  });
});

mqttClient.on('reconnect', () => {
  console.log('[MQTT] Reconnecting to HiveMQ broker...');
});

mqttClient.on('close', () => {
  isMqttConnected = false;
  console.log('[MQTT] Client went offline');
});

mqttClient.on('error', (err) => {
  console.error('[MQTT] Connection error:', err.message);
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
        console.error(`[MQTT Publish Error] Failed to publish ${message} to ${topic}:`, err.message);
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
mqttClient.on('message', async (topic, payload) => {
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

    const action = data.action || data.event || 'UNKNOWN_EVENT';
    const rfidUid = data.uid || data.rfid || null;
    const eventTime = data.timestamp ? new Date(data.timestamp) : new Date();

    if (action.includes('DOOR_OPEN') || action.includes('RFID_OPEN') || action.includes('PIN_OPEN')) {
      doorOpenState = true;
      lastDoorEventTime = eventTime;
    } else if (action.includes('DOOR_CLOSE')) {
      doorOpenState = false;
      lastDoorEventTime = eventTime;
    }

    await AccessLog.create({
      rfid_uid: rfidUid,
      action: action,
      timestamp: eventTime,
    });
    console.log(`[MySQL] Logged access event: ${action} (RFID: ${rfidUid || 'N/A'})`);
  } catch (error) {
    console.error('[MQTT Processing Error] Failed to process message:', error.message);
  }
});

// ----------------------------------------------------
// REST API Routes
// ----------------------------------------------------

// Router Xác Thực Người Dùng (KHÔNG dùng verifyToken ở đây để user có thể Login)
app.use('/api/auth', authRoutes);

// 1. GET /api/status - Trạng thái cửa, khóa, và cảm biến PIR (ĐÃ KHÓA BẢO MẬT)
app.get('/api/status', verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    const isLocked = setting ? setting.system_locked : false;

    res.json({
      success: true,
      online: true,
      mqttConnected: isMqttConnected,
      doorOpen: doorOpenState,
      systemLocked: isLocked,
      autoModeEnabled: setting ? setting.auto_mode_enabled : false,
      autoCloseDelay: setting ? setting.auto_close_delay : 10,
      lastEventTime: lastDoorEventTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi lấy trạng thái hệ thống: ' + error.message });
  }
});

// 2. GET /api/settings - Lấy cấu hình hệ thống (ĐÃ KHÓA BẢO MẬT)
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    res.json({
      success: true,
      data: {
        id: 1,
        system_locked: setting ? setting.system_locked : false,
        hasPassword: Boolean(setting && setting.current_password),
        auto_mode_enabled: setting ? setting.auto_mode_enabled : false,
        auto_close_delay: setting ? setting.auto_close_delay : 10,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi lấy cấu hình hệ thống: ' + error.message });
  }
});

// 3. GET /api/logs - Lấy 50 bản ghi lịch sử truy cập gần nhất (ĐÃ KHÓA BẢO MẬT)
app.get('/api/logs', verifyToken, async (req, res) => {
  try {
    const logs = await AccessLog.findAll({
      order: [['timestamp', 'DESC']],
      limit: 50,
    });

    res.json({
      success: true,
      count: logs.length,
      data: logs,
    });
  } catch (error) {
    console.error('[API Error] /api/logs:', error.message);
    res.status(500).json({ success: false, error: 'Không thể lấy dữ liệu nhật ký truy cập.' });
  }
});

// DELETE /api/logs - Xóa sạch toàn bộ nhật ký trong bảng AccessLogs
app.delete('/api/logs', verifyToken, async (req, res) => {
  try {
    await AccessLog.destroy({ where: {}, truncate: true });
    console.log('[MySQL] AccessLogs table cleared via API');
    res.json({
      success: true,
      message: 'Toàn bộ nhật ký truy cập đã được xóa sạch thành công.',
    });
  } catch (error) {
    console.error('[API Error] DELETE /api/logs:', error.message);
    res.status(500).json({ success: false, error: 'Không thể xóa nhật ký: ' + error.message });
  }
});

// ----------------------------------------------------
// Các API Điều Khiển & Cài Đặt
// ----------------------------------------------------

// 4. POST /api/control/open - Mở khóa cửa từ xa qua Web Dashboard
app.post('/api/control/open', verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    if (setting && setting.system_locked) {
      return res.status(403).json({
        success: false,
        error: 'Hệ thống đang trong chế độ Phong Tỏa Khẩn Cấp. Vui lòng hủy phong tỏa trước khi mở cửa.',
      });
    }

    doorOpenState = true;
    lastDoorEventTime = new Date();

    // Tự động phục hồi trạng thái đóng cửa sau thời gian trễ
    const delay = setting?.auto_close_delay ? setting.auto_close_delay * 1000 : 5000;
    setTimeout(() => {
      doorOpenState = false;
    }, delay);

    await publishMqtt(TOPIC_CONTROL, 'OPEN_DOOR');

    const log = await AccessLog.create({
      rfid_uid: null,
      action: 'Mở qua Web Dashboard',
      timestamp: new Date(),
    });

    res.json({
      success: true,
      doorOpen: true,
      message: 'Đã mở khóa cửa từ xa qua Web Dashboard thành công!',
      log,
    });
  } catch (error) {
    console.error('[API Error] /api/control/open:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi khi gửi lệnh mở cửa: ' + error.message });
  }
});

// 5. POST /api/control/toggle-system-lock - Bật/tắt phong tỏa khẩn cấp
app.post('/api/control/toggle-system-lock', verifyToken, async (req, res) => {
  try {
    const setting = await Setting.findByPk(1);
    const currentState = setting ? setting.system_locked : false;
    const targetState = !currentState;

    const command = targetState ? 'LOCK_SYSTEM' : 'UNLOCK_SYSTEM';
    await publishMqtt(TOPIC_CONTROL, command);

    await Setting.upsert({
      id: 1,
      system_locked: targetState,
    });

    const actionText = targetState ? 'Bật phong tỏa khẩn cấp' : 'Hủy phong tỏa khẩn cấp';
    const log = await AccessLog.create({
      rfid_uid: null,
      action: actionText,
      timestamp: new Date(),
    });

    res.json({
      success: true,
      systemLocked: targetState,
      message: targetState
        ? 'Đã kích hoạt phong tỏa khẩn cấp! Bàn phím và đầu đọc RFID đã bị khóa.'
        : 'Đã hủy phong tỏa hệ thống. Bàn phím và RFID hoạt động bình thường.',
      log,
    });
  } catch (error) {
    console.error('[API Error] /api/control/toggle-system-lock:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi khi chuyển trạng thái phong tỏa: ' + error.message });
  }
});

// 6. POST /api/control/lock & unlock endpoints
app.post('/api/control/lock', verifyToken, async (req, res) => {
  try {
    await publishMqtt(TOPIC_CONTROL, 'LOCK_SYSTEM');
    await Setting.upsert({ id: 1, system_locked: true });
    await AccessLog.create({ rfid_uid: null, action: 'Bật phong tỏa khẩn cấp', timestamp: new Date() });
    res.json({
      success: true,
      systemLocked: true,
      message: 'Đã kích hoạt phong tỏa khẩn cấp! Bàn phím và đầu đọc RFID đã bị khóa.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi kích hoạt phong tỏa: ' + error.message });
  }
});

app.post('/api/control/unlock', verifyToken, async (req, res) => {
  try {
    await publishMqtt(TOPIC_CONTROL, 'UNLOCK_SYSTEM');
    await Setting.upsert({ id: 1, system_locked: false });
    await AccessLog.create({ rfid_uid: null, action: 'Hủy phong tỏa khẩn cấp', timestamp: new Date() });
    res.json({
      success: true,
      systemLocked: false,
      message: 'Đã hủy phong tỏa hệ thống. Bàn phím và RFID hoạt động bình thường.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Lỗi hủy phong tỏa: ' + error.message });
  }
});

// 7. POST /api/settings - Cập nhật cài đặt cảm biến PIR
app.post('/api/settings', verifyToken, async (req, res) => {
  try {
    const { auto_mode_enabled, auto_close_delay } = req.body;
    const updatePayload = {};

    if (typeof auto_mode_enabled !== 'undefined') {
      updatePayload.auto_mode_enabled = Boolean(auto_mode_enabled);
    }
    if (typeof auto_close_delay !== 'undefined') {
      updatePayload.auto_close_delay = Math.max(1, parseInt(auto_close_delay, 10) || 10);
    }

    await Setting.update(updatePayload, { where: { id: 1 } });
    const updated = await Setting.findByPk(1);

    // Đồng bộ sang ESP32 qua MQTT
    try {
      if (isMqttConnected) {
        mqttClient.publish(
          'kma_lock/config',
          JSON.stringify({
            auto_mode: updated.auto_mode_enabled,
            delay: updated.auto_close_delay,
          }),
          { qos: 1 }
        );
      }
    } catch (e) {
      console.warn('[MQTT] Config publish skipped:', e.message);
    }

    res.json({
      success: true,
      message: 'Cập nhật cấu hình cảm biến PIR thành công!',
      data: updated,
    });
  } catch (error) {
    console.error('[API Error] /api/settings:', error.message);
    res.status(500).json({ success: false, error: 'Không thể cập nhật cài đặt: ' + error.message });
  }
});

// 8. POST /api/settings/password - Đổi mã PIN bàn phím chủ
app.post('/api/settings/password', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.toString().trim().length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Mã PIN bàn phím phải có ít nhất 4 chữ số.',
      });
    }

    const pinString = newPassword.toString().trim();

    await Setting.upsert({
      id: 1,
      current_password: pinString,
    });

    try {
      if (isMqttConnected) {
        mqttClient.publish('kma_lock/config', JSON.stringify({ pin: pinString }), { qos: 1 });
      }
    } catch {
      // Non-blocking
    }

    await AccessLog.create({
      rfid_uid: null,
      action: 'Cập nhật mã PIN bàn phím',
      timestamp: new Date(),
    });

    res.json({
      success: true,
      message: 'Đã đổi mã PIN mở cửa thành công!',
    });
  } catch (error) {
    console.error('[API Error] /api/settings/password:', error.message);
    res.status(500).json({ success: false, error: 'Lỗi cập nhật mã PIN: ' + error.message });
  }
});

// ----------------------------------------------------
// Khởi Động Server & Đảm Bảo Tài Khoản Quản Trị
// ----------------------------------------------------
async function initAdminUser() {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('[MySQL] Users table is empty. Initializing default admin user...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
      });
      console.log('[MySQL] Default admin created (username: "admin", password: "admin123").');
    }
    console.log('[MySQL] Clean start: Database initialized with 0 mock logs.');
  } catch (err) {
    console.error('[MySQL Init Warning]', err.message);
  }
}

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('[MySQL] Database connection authenticated successfully.');

    await sequelize.sync({ alter: false });
    console.log('[MySQL] Models synchronized with MySQL schema.');

    await initSetting();
    console.log('[MySQL] Default system setting initialized.');

    await initAdminUser();

    app.listen(PORT, () => {
      console.log(`[Express] Smart Lock Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('[Fatal Error] Unable to connect to MySQL database:', error.message);
    console.warn('[Notice] Ensure MySQL is running and properly configured in .env');
    app.listen(PORT, () => {
      console.log(`[Express] Server running on http://localhost:${PORT} (Waiting for MySQL to recover)`);
    });
  }
}

startServer();