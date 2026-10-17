# KMA Smart Lock - AI Face Service & Web Dashboard Integration

Dịch vụ nhận diện khuôn mặt sinh trắc học thông minh (AI Face Service) kết hợp với Web Dashboard và khóa cửa ESP32.

---

## 🏛️ Kiến Trúc Hệ Thống

```
                     ┌──────────────────┐
                     │   ESP32 Lock     │
                     └────────┬─────────┘
        kma_lock/doorbell     │     kma_lock/control (OPEN_DOOR, source=AI)
        kma_lock/ack          │     kma_lock/status
                              ▼
                     ┌──────────────────┐
                     │  HiveMQ Broker   │
                     │ (MQTT Broker)    │
                     └────────┬─────────┘
                              │
             ┌────────────────┴────────────────┐
             ▼                                 ▼
   ┌───────────────────┐             ┌───────────────────┐
   │  AI Face Service  │◄──HTTP APIs─┤   Web Backend     │
   │  (Python/Flask)   │──POST Logs─►│  (Node.js/Express)│
   │  Port 5001        │             │   Port 5000       │
   └─────────┬─────────┘             └─────────┬─────────┘
             │                                 │
             ▼                                 ▼
      [Camera & Face DB]               [Web Dashboard React]
      (InsightFace 512-dim)            [Port 5173 / Socket.io]
```

---

## 🔄 2 Luồng Hoạt Động Chính

### Luồng 1: Bấm Chuông Cửa (Doorbell & Liveness Verification)
1. **Khách bấm chuông trên ESP32**: ESP32 publish lên topic MQTT `kma_lock/doorbell`.
2. **AI kích hoạt Camera**:
   - Quét khuôn mặt, trích xuất vector embedding 512 chiều qua mô hình **InsightFace (buffalo_l)**.
   - So khớp Cosine Similarity với cơ sở dữ liệu `faces_db/*.npy` (lấy trung bình top-3 vector gần nhất).
3. **Thử thách chống giả mạo (Anti-Spoofing)**:
   - Nếu nhận diện là chủ nhà, AI phát sinh thử thách quay đầu ngẫu nhiên (*Quay đầu sang trái, quay đầu sang phải, ngẩng đầu lên, cúi đầu xuống*).
   - Publish hướng dẫn lên `kma_lock/prompt` để Web/Màn hình hiển thị cho chủ nhà.
4. **Mở cửa & Ghi nhận Log**:
   - Vượt qua thử thách: AI publish lệnh mở cửa `kma_lock/control` với payload `{"cmd":"OPEN_DOOR","source":"AI","event_id":"...","name":"..."}`.
   - Khi nhận `source: "AI"`, ESP32 **KHÔNG** tự gửi log lên web nữa để tránh trùng lặp.
   - AI gửi POST multipart kèm ảnh chụp khuôn mặt về Backend `POST /api/ai/access-log`.
   - Nếu là người lạ (`stranger`) hoặc nghi vấn giả mạo (`spoof_suspected`), AI gửi cảnh báo kèm ảnh chụp ngay lập tức lên Web Dashboard (hiển thị popup cảnh báo thời gian thực).

### Luồng 2: Thêm Khuôn Mặt (Face Enrollment)
1. Trên giao diện Web Dashboard (Tab **Khuôn Mặt AI**), nhấn **"Thêm Khuôn Mặt Mới"** hoặc **"Bổ Sung Mẫu Góc Mặt"**.
2. Web gửi yêu cầu `POST /api/ai/enroll` tới Backend, Backend chuyển tiếp tới AI Service.
3. AI Service kích hoạt camera và phát tiến trình 5 góc chụp qua `kma_lock/enroll_progress` và Socket.io:
   - Bước 1: Nhìn THẲNG vào camera (CENTER)
   - Bước 2: Quay nhẹ sang TRÁI (LEFT)
   - Bước 3: Quay nhẹ sang PHẢI (RIGHT)
   - Bước 4: Ngẩng đầu nhẹ LÊN (UP)
   - Bước 5: Cúi đầu nhẹ XUỐNG (DOWN)
4. AI kiểm tra chống trùng lặp khuôn mặt, lưu vector vào `faces_db/<name>.npy` và POST kết quả về `POST /api/ai/enroll-result`.

---

## 🚀 Cài Đặt & Chạy AI Face Service

### 1. Chuẩn bị môi trường Python

Yêu cầu: Python 3.9 - 3.12 trên máy tính / thiết bị có gắn webcam hoặc camera USB.

```bash
cd ai_service

# Tạo virtual environment
python3 -m venv venv
source venv/bin/activate

# Cài đặt thư viện
pip install -r requirements.txt
```

> **Lưu ý**: Lần đầu chạy, InsightFace sẽ tự động tải pre-trained model `buffalo_l` (~300MB) về máy.

### 2. Cấu hình file `.env` trong thư mục `ai_service`

File `.env` mẫu đã được tạo sẵn tại `ai_service/.env`:
```env
MQTT_BROKER=broker.hivemq.com
MQTT_PORT=1883
BACKEND_URL=http://localhost:5000
AI_API_KEY=smartlock_ai_secret_key_2026
AI_PORT=5001
AI_HOST=0.0.0.0
CAMERA_INDEX=0
WAIT_ACK=False
ENABLE_LIVENESS=True
```

- `BACKEND_URL`: Địa chỉ của Node.js Backend (mặc định: `http://localhost:5000`).
- `AI_PORT`: Cổng dịch vụ AI (mặc định: `5001`, tránh xung đột cổng 5000 của Backend).
- `CAMERA_INDEX`: Index của webcam (thường là `0` trên laptop/PC).
- `WAIT_ACK`: Đặt `False` nếu ESP32 chưa có mã gửi topic ack; đặt `True` nếu đã nạp code ack.
- `ENABLE_LIVENESS`: `True` để bật thử thách quay đầu ngẫu nhiên chống video/ảnh giả mạo.

### 3. Khởi động AI Service

```bash
python3 app.py
```

Khi chạy thành công, console sẽ hiển thị:
```
[AI] Smart Lock Face Service sẵn sàng!
[AI] API Server: http://0.0.0.0:5001
[AI] Backend URL: http://localhost:5000
[AI] MQTT Broker: broker.hivemq.com:1883
[AI] Topics: Bell='kma_lock/doorbell' | Control='kma_lock/control' | Ack='kma_lock/ack'
```

---

## 💻 Code Mẫu Cho ESP32 (Arduino C++)

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* TOPIC_BELL    = "kma_lock/doorbell";
const char* TOPIC_CONTROL = "kma_lock/control";
const char* TOPIC_ACK     = "kma_lock/ack";

// Callback nhận lệnh từ MQTT
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String message;
  for (unsigned int i = 0; i < length; i++) message += (char)payload[i];
  
  if (String(topic) == TOPIC_CONTROL) {
    StaticJsonDocument<256> doc;
    DeserializationError error = deserializeJson(doc, message);
    if (!error) {
      const char* cmd = doc["cmd"];
      const char* source = doc["source"];
      const char* eventId = doc["event_id"];
      
      if (String(cmd) == "OPEN_DOOR") {
        openDoorHardware(); // Kích hoạt relay / servo mở chốt cửa
        
        // NẾU KHÔNG PHẢI TỪ AI MỞ -> MỚI TỰ PUBLISH LOG LÊN STATUS
        if (String(source) != "AI") {
          publishManualDoorLog();
        }
        
        // Gửi ACK xác nhận cho AI đã mở cửa thành công
        if (eventId != NULL) {
          StaticJsonDocument<128> ackDoc;
          ackDoc["event_id"] = eventId;
          ackDoc["success"] = true;
          char ackBuffer[128];
          serializeJson(ackDoc, ackBuffer);
          client.publish(TOPIC_ACK, ackBuffer);
        }
      }
    }
  }
}

// Khi người dùng bấm nút chuông vật lý trên cửa:
void onDoorbellButtonPressed() {
  client.publish(TOPIC_BELL, "1");
}
```

---

## 🌐 Các Endpoint API Đã Tích Hợp

| Phương thức | Endpoint Backend | Mô tả |
|---|---|---|
| `POST` | `/api/ai/access-log` | Nhận log xác thực khuôn mặt & ảnh chụp từ AI (X-API-KEY) |
| `POST` | `/api/ai/enroll-result` | Nhận kết quả và thumbnail đăng ký khuôn mặt từ AI (X-API-KEY) |
| `GET` | `/api/ai/faces` | Web Admin lấy danh sách chủ nhà đã đăng ký |
| `POST` | `/api/ai/enroll` | Web Admin bắt đầu quy trình quét 5 góc mặt (`new` hoặc `add`) |
| `DELETE` | `/api/ai/faces/:name` | Web Admin xóa hồ sơ khuôn mặt chủ nhà |
| `POST` | `/api/ai/ring` | Giả lập bấm chuông cửa để test camera không cần ESP32 |
| `GET` | `/api/ai/health` | Kiểm tra trạng thái trực tuyến của AI Service |
