"""
KMA Smart Lock - AI Face Service (headless, không giao diện)

LUỒNG 1 (bấm chuông):
  ESP32 publish MQTT  kma_lock/doorbell  ->  AI mở camera, quét mặt
    - Chủ nhà  : publish OPEN_DOOR (source=AI) -> chờ ESP32 ack -> POST log + ảnh về Backend
    - Người lạ : POST log cảnh báo + ảnh người lạ về Backend (không mở cửa)
    - Giả mạo  : POST log cảnh báo + ảnh (ảnh/video không làm được thử thách)
  Khi mở cửa bằng AI, ESP32 KHÔNG được tự gửi log nữa (xem field "source":"AI").

LUỒNG 2 (thêm mặt):
  Web/Backend gọi  POST /api/enroll  {request_id, name, mode: "new" | "add"}
    -> AI mở camera, hướng dẫn 5 góc (publish tiến trình qua MQTT)
    -> xong POST kết quả về Backend.

Cài đặt:  pip install -r requirements.txt
Chạy:     python app.py
"""
import os
import sys

# Đọc file .env nếu có
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

os.environ.setdefault("OMP_NUM_THREADS", "2")
os.environ.setdefault("OPENBLAS_NUM_THREADS", "2")
os.environ.setdefault("MKL_NUM_THREADS", "2")

import json
import random
import re
import threading
import time
import uuid
from collections import Counter, deque

import cv2
import numpy as np
import paho.mqtt.client as mqtt
import requests
from flask import Flask, jsonify, request
from insightface.app import FaceAnalysis

# ============================ CẤU HÌNH ============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MQTT_BROKER = os.getenv("MQTT_BROKER", "broker.hivemq.com")
MQTT_PORT = int(os.getenv("MQTT_PORT", "1883"))
TOPIC_BELL = "kma_lock/doorbell"          # ESP32 -> AI : có người bấm chuông
TOPIC_CONTROL = "kma_lock/control"        # AI -> ESP32 : lệnh mở cửa
TOPIC_ACK = "kma_lock/ack"                # ESP32 -> AI : xác nhận đã mở cửa
TOPIC_PROMPT = "kma_lock/prompt"          # AI -> ESP32/Web : hướng dẫn thử thách
TOPIC_ENROLL_PROGRESS = "kma_lock/enroll_progress"  # AI -> Web : tiến trình thêm mặt

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
API_PATH_ACCESS_LOG = "/api/ai/access-log"      # log ra/vào + ảnh
API_PATH_ENROLL_RESULT = "/api/ai/enroll-result"  # kết quả thêm mặt
API_KEY = os.getenv("AI_API_KEY", "smartlock_ai_secret_key_2026")  # dùng 2 chiều: Backend <-> AI

HTTP_HOST = os.getenv("AI_HOST", "0.0.0.0")
HTTP_PORT = int(os.getenv("AI_PORT", "5001"))

CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
DB_DIR = os.getenv("DB_DIR", os.path.join(BASE_DIR, "faces_db"))
LOG_DIR = os.getenv("LOG_DIR", os.path.join(BASE_DIR, "event_logs"))

# Nhận diện
THRESHOLD = float(os.getenv("FACE_THRESHOLD", "0.45"))          # cosine similarity tối thiểu để coi là chủ nhà
MARGIN = float(os.getenv("FACE_MARGIN", "0.06"))               # khoảng cách tối thiểu giữa người giống nhất và người giống nhì
MIN_DET_SCORE = 0.60      # độ tin cậy của detector
MIN_FACE_WIDTH = 90       # px, mặt quá nhỏ = đứng quá xa
MIN_SHARPNESS = 35.0      # phương sai Laplacian, thấp = ảnh mờ
VOTE_WINDOW, VOTE_NEED = 7, 4   # cần 4/7 khung hình cùng kết quả mới chốt
SESSION_TIMEOUT = 25      # giây tối đa cho 1 lần bấm chuông
ACK_TIMEOUT = 5           # giây chờ ESP32 xác nhận mở cửa
WAIT_ACK = os.getenv("WAIT_ACK", "False").lower() in ("true", "1")  # False nếu ESP32 chưa có code gửi ack
BELL_COOLDOWN = 3         # giây, chống bấm chuông liên tục

# Chống video giả mạo (thử thách quay đầu ngẫu nhiên)
ENABLE_LIVENESS = os.getenv("ENABLE_LIVENESS", "True").lower() in ("true", "1")
CHALLENGE_TIMEOUT = 8
CHALLENGES = [("QUAY DAU SANG TRAI", "LEFT"), ("QUAY DAU SANG PHAI", "RIGHT"),
              ("NGANG DAU LEN", "UP"), ("CUI DAU XUONG", "DOWN")]

# Đăng ký khuôn mặt
ENROLL_STEPS = [("Nhin THANG vao camera", "CENTER"), ("Quay nhe sang TRAI", "LEFT"),
                ("Quay nhe sang PHAI", "RIGHT"), ("Ngang dau nhe len", "UP"),
                ("Cui dau nhe xuong", "DOWN")]
SAMPLES_PER_STEP = 3
STEP_TIMEOUT = 25
MAX_EMB_PER_PERSON = 40
DUPLICATE_THRESHOLD = 0.60  # mặt mới giống người khác > ngưỡng này -> từ chối

os.makedirs(DB_DIR, exist_ok=True)
os.makedirs(LOG_DIR, exist_ok=True)

# ============================ MQTT ============================
try:
    mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)  # paho >= 2.0
except AttributeError:
    mqtt_client = mqtt.Client()

ack_events = {}  # event_id -> (threading.Event, [success])


def on_connect(client, userdata, flags, rc, *args):
    print(f"[MQTT] Đã kết nối broker {MQTT_BROKER}:{MQTT_PORT} (rc={rc})")
    client.subscribe([(TOPIC_BELL, 0), (TOPIC_ACK, 0)])


def on_message(client, userdata, msg):
    payload = msg.payload.decode("utf-8", errors="ignore")
    if msg.topic == TOPIC_BELL:
        print("[BELL] Có người bấm chuông")
        threading.Thread(target=ring_session, daemon=True).start()
    elif msg.topic == TOPIC_ACK:
        try:
            data = json.loads(payload)
            item = ack_events.get(data.get("event_id"))
            if item:
                item[1].append(bool(data.get("success", True)))
                item[0].set()
        except json.JSONDecodeError:
            pass


mqtt_client.on_connect = on_connect
mqtt_client.on_message = on_message
try:
    mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
    mqtt_client.loop_start()
except Exception as e:
    print(f"[MQTT] Lỗi kết nối broker: {e}")


def mqtt_pub(topic, data):
    try:
        mqtt_client.publish(topic, json.dumps(data, ensure_ascii=False))
    except Exception as e:
        print(f"[MQTT] Lỗi publish: {e}")


# ============================ MODEL & DATABASE ============================
print("[AI] Đang khởi tạo InsightFace...")
face_app = FaceAnalysis(name="buffalo_l", allowed_modules=["detection", "recognition"],
                        providers=["CPUExecutionProvider"])
face_app.prepare(ctx_id=0, det_size=(480, 480))

db_lock = threading.Lock()
gallery = {}  # name -> ndarray (N, 512): nhiều embedding cho mỗi người


def load_database():
    with db_lock:
        gallery.clear()
        if os.path.exists(DB_DIR):
            for f in os.listdir(DB_DIR):
                if f.endswith(".npy"):
                    arr = np.load(os.path.join(DB_DIR, f))
                    arr = arr.reshape(1, -1) if arr.ndim == 1 else arr  # tương thích file cũ
                    gallery[os.path.splitext(f)[0]] = arr.astype(np.float32)
    print(f"[DB] Đã nạp {len(gallery)} chủ nhà: {list(gallery.keys())}")


def person_score(embs, emb):
    """Điểm của 1 người = trung bình top-3 độ giống cao nhất (bền hơn chỉ lấy max)."""
    sims = np.sort(embs @ emb)[::-1]
    return float(np.mean(sims[:3]))


def identify(emb):
    """Trả về (tên | 'UNKNOWN', điểm giống nhất)."""
    with db_lock:
        if not gallery:
            return "UNKNOWN", 0.0
        scores = sorted(((person_score(e, emb), n) for n, e in gallery.items()), reverse=True)
    best, name = scores[0]
    if best < THRESHOLD:
        return "UNKNOWN", best
    if len(scores) > 1 and best - scores[1][0] < MARGIN:
        return "UNKNOWN", best  # quá nhập nhằng giữa 2 người -> không mở cửa
    return name, best


load_database()


# ============================ TIỆN ÍCH KHUÔN MẶT ============================
def get_face_pose(kps):
    """Yaw (âm: quay trái, dương: quay phải) & Pitch (nhỏ: ngẩng, lớn: cúi)."""
    le, re_, nose, lm, rm = kps
    eye_dist = np.linalg.norm(re_ - le) + 1e-6
    yaw = (nose[0] - (le[0] + re_[0]) / 2.0) / eye_dist
    eye_y = (le[1] + re_[1]) / 2.0
    mouth_y = (lm[1] + rm[1]) / 2.0
    pitch = (nose[1] - eye_y) / (abs(mouth_y - eye_y) + 1e-6)
    return yaw, pitch


def pose_matches(code, yaw, pitch):
    return {
        "CENTER": -0.10 <= yaw <= 0.10 and 0.48 <= pitch <= 0.60,
        "LEFT": yaw < -0.13,
        "RIGHT": yaw > 0.13,
        "UP": pitch < 0.47,
        "DOWN": pitch > 0.61,
    }[code]


def is_good_quality(face, frame):
    x1, y1, x2, y2 = face.bbox.astype(int)
    if face.det_score < MIN_DET_SCORE or (x2 - x1) < MIN_FACE_WIDTH:
        return False
    crop = frame[max(0, y1):y2, max(0, x1):x2]
    if crop.size == 0:
        return False
    sharp = cv2.Laplacian(cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY), cv2.CV_64F).var()
    return sharp >= MIN_SHARPNESS


def largest_face(faces):
    return max(faces, key=lambda f: (f.bbox[2] - f.bbox[0]) * (f.bbox[3] - f.bbox[1]))


def encode_jpg(frame, max_w=640, quality=85):
    if frame is None or frame.size == 0:
        return None
    h, w = frame.shape[:2]
    if w > max_w:
        frame = cv2.resize(frame, (max_w, int(h * max_w / w)))
    ok, buf = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), quality])
    return buf.tobytes() if ok else None


def open_camera():
    cap = cv2.VideoCapture(CAMERA_INDEX)
    if not cap.isOpened():
        print(f"[CAMERA] CẢNH BÁO: Không thể mở camera index {CAMERA_INDEX}")
        return cap
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    for _ in range(5):  # bỏ vài khung đầu để camera ổn định độ sáng
        cap.read()
    return cap


# ============================ GỬI VỀ BACKEND ============================
def post_backend(path, fields, image_bytes=None, retries=3):
    """POST multipart (fields + ảnh) về Backend, có retry."""
    url = BACKEND_URL.rstrip("/") + path
    for attempt in range(1, retries + 1):
        try:
            files = {"image": ("capture.jpg", image_bytes, "image/jpeg")} if image_bytes else None
            r = requests.post(url, data=fields, files=files,
                              headers={"X-API-KEY": API_KEY}, timeout=10)
            if r.status_code < 300:
                print(f"[API] {path} OK ({fields.get('type') or fields.get('status')})")
                return True
            print(f"[API] {path} lỗi {r.status_code}: {r.text[:120]}")
        except requests.RequestException as e:
            print(f"[API] {path} lần {attempt} thất bại: {e}")
        time.sleep(1.5 * attempt)
    return False


def report_access(event_id, etype, name, score, frame, door_opened, note=""):
    """etype: owner_access | stranger | spoof_suspected | timeout | owner_door_fail"""
    img = encode_jpg(frame) if frame is not None else None
    ts = time.strftime("%Y%m%d_%H%M%S")
    if img:
        try:
            with open(os.path.join(LOG_DIR, f"{ts}_{etype}.jpg"), "wb") as f:
                f.write(img)
        except Exception as e:
            print(f"[LOG] Không thể ghi ảnh log: {e}")
    fields = {
        "event_id": event_id, "type": etype, "name": name or "",
        "score": f"{score:.3f}", "source": "AI_CAMERA", "note": note,
        "door_opened": "" if door_opened is None else str(door_opened).lower(),
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S%z"),
    }
    post_backend(API_PATH_ACCESS_LOG, fields, img)


# ============================ LUỒNG 1: BẤM CHUÔNG ============================
camera_lock = threading.Lock()  # camera chỉ phục vụ 1 việc tại một thời điểm
last_bell_time = 0.0


def open_door(event_id, name):
    """Gửi lệnh mở cửa, chờ ESP32 xác nhận. Trả về True/False/None (None = không chờ ack)."""
    ev, result = threading.Event(), []
    ack_events[event_id] = (ev, result)
    # source=AI -> ESP32 PHẢI bỏ qua việc tự gửi log lên web cho lần mở này
    mqtt_pub(TOPIC_CONTROL, {"cmd": "OPEN_DOOR", "source": "AI",
                             "event_id": event_id, "name": name})
    try:
        if not WAIT_ACK:
            print("[DOOR] WAIT_ACK=False, gửi lệnh mở và giả định thành công")
            return True
        return bool(ev.wait(ACK_TIMEOUT) and result and result[0])
    finally:
        ack_events.pop(event_id, None)


def ring_session():
    global last_bell_time
    now = time.time()
    if now - last_bell_time < BELL_COOLDOWN:
        return
    if not camera_lock.acquire(blocking=False):
        print("[BELL] Camera đang bận (đang đăng ký mặt hoặc quét dở), bỏ qua")
        return
    last_bell_time = now
    event_id = uuid.uuid4().hex[:12]
    cap = None
    try:
        cap = open_camera()
        if not cap.isOpened():
            print("[BELL] Không mở được camera")
            report_access(event_id, "timeout", "", 0.0, None, False, "Camera khong kha dung")
            return

        votes = deque(maxlen=VOTE_WINDOW)
        best = {}  # nhãn -> (det_score, frame): giữ khung hình đẹp nhất để gửi ảnh
        state, owner, owner_score = "IDENTIFY", None, 0.0
        challenge, challenge_start, mismatch = None, 0.0, 0
        last_frame, multiple_faces = None, False
        deadline = time.time() + SESSION_TIMEOUT

        while time.time() < deadline:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)
            last_frame = frame
            faces = face_app.get(frame)
            if not faces:
                continue
            multiple_faces = multiple_faces or len(faces) > 1
            face = largest_face(faces)
            if not is_good_quality(face, frame):
                continue

            name, score = identify(face.normed_embedding)
            if name not in best or face.det_score > best[name][0]:
                best[name] = (face.det_score, frame.copy())

            if state == "IDENTIFY":
                votes.append(name)
                if len(votes) < VOTE_NEED:
                    continue
                common, count = Counter(votes).most_common(1)[0]
                if count < VOTE_NEED:
                    continue

                if common == "UNKNOWN":
                    report_access(event_id, "stranger", "", score, best["UNKNOWN"][1], False,
                                  "Phat hien nguoi la truoc cua")
                    return
                owner, owner_score = common, score
                if ENABLE_LIVENESS:
                    state = "LIVENESS"
                    challenge = random.choice(CHALLENGES)
                    challenge_start = time.time()
                    mqtt_pub(TOPIC_PROMPT, {"event_id": event_id, "type": "challenge",
                                            "name": owner, "text": challenge[0],
                                            "code": challenge[1]})
                    print(f"[LIVENESS] Yêu cầu: {challenge[0]}")
                else:
                    break

            elif state == "LIVENESS":
                if name != owner:
                    mismatch += 1
                    if mismatch >= 3:  # đổi người giữa chừng -> coi như người lạ
                        report_access(event_id, "stranger", "", score,
                                      best.get("UNKNOWN", (0, frame))[1], False,
                                      "Doi nguoi trong luc xac thuc")
                        return
                    continue
                yaw, pitch = get_face_pose(face.kps)
                if pose_matches(challenge[1], yaw, pitch) and \
                        not pose_matches("CENTER", yaw, pitch):
                    break  # vượt thử thách
                if time.time() - challenge_start > CHALLENGE_TIMEOUT:
                    report_access(event_id, "spoof_suspected", owner, owner_score,
                                  best[owner][1], False,
                                  f"Khong thuc hien duoc thu thach, nghi dung anh/video cua {owner}")
                    return
        else:
            owner = None  # hết giờ

        if owner is None or (state == "IDENTIFY"):
            report_access(event_id, "timeout", "", 0.0, last_frame, False,
                          "Het thoi gian quet, khong xac dinh duoc khuon mat")
            return

        # ---- Chủ nhà hợp lệ -> mở cửa ----
        print(f"[AI] Mở cửa cho chủ nhà: {owner} ({owner_score:.2f})")
        opened = open_door(event_id, owner)
        etype = "owner_access" if opened is not False else "owner_door_fail"
        note = "Mo cua bang AI Camera" if opened is not False else "AI da gui lenh nhung ESP32 khong xac nhan"
        if multiple_faces:
            note += " (co nhieu nguoi trong khung hinh)"
        report_access(event_id, etype, owner, owner_score, best[owner][1], opened, note)
    except Exception as e:
        print(f"[ERROR] ring_session: {e}")
    finally:
        if cap:
            cap.release()
        camera_lock.release()


# ============================ LUỒNG 2: THÊM MẶT ============================
NAME_RE = re.compile(r"^[A-Za-z0-9_\-]{1,40}$")
enroll_busy = threading.Event()


def enroll_progress(request_id, name, step, total, text, status="running"):
    mqtt_pub(TOPIC_ENROLL_PROGRESS, {"request_id": request_id, "name": name, "step": step,
                                     "total": total, "text": text, "status": status})


def enroll_finish(request_id, name, mode, status, message, thumb=None):
    enroll_progress(request_id, name, 0, 0, message, status)
    post_backend(API_PATH_ENROLL_RESULT,
                 {"request_id": request_id, "name": name, "mode": mode,
                  "status": status, "message": message}, thumb)


def enroll_session(request_id, name, mode):
    if not camera_lock.acquire(blocking=False):
        enroll_finish(request_id, name, mode, "failed", "Camera dang ban, thu lai sau")
        enroll_busy.clear()
        return
    cap = None
    try:
        cap = open_camera()
        if not cap.isOpened():
            enroll_finish(request_id, name, mode, "failed", "Khong mo duoc camera tren thiet bi AI")
            return

        collected, thumb_frame = [], None
        total = len(ENROLL_STEPS)

        for idx, (text, pose_code) in enumerate(ENROLL_STEPS, start=1):
            enroll_progress(request_id, name, idx, total, text)
            got, last_t, step_deadline = 0, 0.0, time.time() + STEP_TIMEOUT
            while got < SAMPLES_PER_STEP and time.time() < step_deadline:
                ok, frame = cap.read()
                if not ok:
                    continue
                frame = cv2.flip(frame, 1)
                faces = face_app.get(frame)
                if len(faces) != 1:  # đăng ký chỉ chấp nhận đúng 1 người
                    continue
                face = faces[0]
                if not is_good_quality(face, frame):
                    continue
                yaw, pitch = get_face_pose(face.kps)
                if pose_matches(pose_code, yaw, pitch) and time.time() - last_t > 0.4:
                    collected.append(face.normed_embedding.copy())
                    last_t = time.time()
                    got += 1
                    if pose_code == "CENTER" and thumb_frame is None:
                        x1, y1, x2, y2 = face.bbox.astype(int)
                        pad = 40
                        thumb_frame = frame[max(0, y1 - pad):y2 + pad, max(0, x1 - pad):x2 + pad]
            if got < SAMPLES_PER_STEP:
                enroll_finish(request_id, name, mode, "failed",
                              f"Het thoi gian o buoc {idx}/{total}: {text}")
                return

        new_embs = np.array(collected, dtype=np.float32)

        # Không cho 1 khuôn mặt đăng ký dưới 2 tên khác nhau
        with db_lock:
            others = {n: e for n, e in gallery.items() if n != name}
        mean_emb = new_embs.mean(axis=0)
        mean_emb /= np.linalg.norm(mean_emb)
        for other, embs in others.items():
            if person_score(embs, mean_emb) > DUPLICATE_THRESHOLD:
                enroll_finish(request_id, name, mode, "failed",
                              f"Khuon mat nay da duoc dang ky voi ten '{other}'")
                return

        path = os.path.join(DB_DIR, f"{name}.npy")
        if mode == "add" and os.path.exists(path):
            old = np.load(path)
            old = old.reshape(1, -1) if old.ndim == 1 else old
            new_embs = np.vstack([old, new_embs])[-MAX_EMB_PER_PERSON:]
        np.save(path, new_embs)
        load_database()

        thumb = encode_jpg(thumb_frame, max_w=320) if thumb_frame is not None and thumb_frame.size else None
        msg = "Da bo sung du lieu khuon mat" if mode == "add" else "Da tao moi ho so chu nha"
        enroll_finish(request_id, name, mode, "success", msg, thumb)
        print(f"[ENROLL] {msg}: {name} ({len(new_embs)} mẫu)")
    except Exception as e:
        print(f"[ERROR] enroll_session: {e}")
        enroll_finish(request_id, name, mode, "failed", f"Loi he thong: {e}")
    finally:
        if cap:
            cap.release()
        camera_lock.release()
        enroll_busy.clear()


# ============================ REST API (Backend -> AI) ============================
api = Flask(__name__)


@api.before_request
def check_key():
    if request.headers.get("X-API-KEY") != API_KEY:
        return jsonify(error="unauthorized"), 401


@api.post("/api/enroll")
def api_enroll():
    body = request.get_json(silent=True) or {}
    name = str(body.get("name", "")).strip()
    mode = body.get("mode", "new")
    request_id = str(body.get("request_id") or uuid.uuid4().hex[:12])

    if not NAME_RE.match(name):
        return jsonify(error="Ten chi gom chu/so/_/- (toi da 40 ky tu, khong dau)"), 400
    if mode not in ("new", "add"):
        return jsonify(error="mode phai la 'new' hoac 'add'"), 400
    with db_lock:
        exists = name in gallery
    if mode == "new" and exists:
        return jsonify(error=f"'{name}' da ton tai, hay dung mode 'add'"), 409
    if mode == "add" and not exists:
        return jsonify(error=f"Khong tim thay '{name}' de bo sung"), 404
    if enroll_busy.is_set():
        return jsonify(error="Dang co phien dang ky khac"), 429

    enroll_busy.set()
    threading.Thread(target=enroll_session, args=(request_id, name, mode), daemon=True).start()
    return jsonify(status="started", request_id=request_id), 202


@api.get("/api/faces")
def api_faces():
    with db_lock:
        return jsonify({n: int(e.shape[0]) for n, e in gallery.items()})


@api.delete("/api/faces/<name>")
def api_delete_face(name):
    if not NAME_RE.match(name):
        return jsonify(error="invalid name"), 400
    path = os.path.join(DB_DIR, f"{name}.npy")
    if not os.path.exists(path):
        return jsonify(error="not found"), 404
    os.remove(path)
    load_database()
    return jsonify(status="deleted", name=name)


@api.post("/api/ring")
def api_ring():
    """Giả lập bấm chuông để test (không cần ESP32)."""
    threading.Thread(target=ring_session, daemon=True).start()
    return jsonify(status="scanning"), 202


if __name__ == "__main__":
    print(f"[AI] Smart Lock Face Service sẵn sàng!")
    print(f"[AI] API Server: http://{HTTP_HOST}:{HTTP_PORT}")
    print(f"[AI] Backend URL: {BACKEND_URL}")
    print(f"[AI] MQTT Broker: {MQTT_BROKER}:{MQTT_PORT}")
    print(f"[AI] Topics: Bell='{TOPIC_BELL}' | Control='{TOPIC_CONTROL}' | Ack='{TOPIC_ACK}' | Prompt='{TOPIC_PROMPT}' | Enroll='{TOPIC_ENROLL_PROGRESS}'")
    api.run(host=HTTP_HOST, port=HTTP_PORT, threaded=True)
