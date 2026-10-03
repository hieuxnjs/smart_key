# ESP32 Smart Door Lock System - Full-Stack Web Dashboard

A complete, production-ready full-stack web dashboard for an ESP32 Smart Door Lock System. Built with **React (Vite) + Tailwind CSS** on the frontend, and **Node.js + Express + MQTT.js + Sequelize (MySQL)** on the backend.

---

## 📁 Project Architecture

```
web_smartlock/
├── backend/
│   ├── config/
│   │   └── database.js      # Sequelize connection configuration
│   ├── models/
│   │   └── index.js         # AccessLog & Setting models with auto-sync
│   ├── .env                 # Environment variables (DB & MQTT broker)
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Express REST APIs & MQTT event listener
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Modern sleek dashboard with Dark/Light mode
│   │   ├── index.css        # Tailwind styling & custom scrollbars
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js       # Vite proxy config (/api -> http://localhost:5000)
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
├── package.json             # Root runner with concurrently
└── README.md
```

---

## ⚡ 1. MySQL Database Setup

1. Start your local MySQL service (e.g. XAMPP, MariaDB, or standard MySQL Server).
2. Connect to MySQL with user `root` (no password by default) and create the database `smart_lock`:

```sql
CREATE DATABASE IF NOT EXISTS smart_lock CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

> **Note:** Sequelize will automatically create the tables (`access_logs` and `settings`) and seed the default configuration row when the backend server boots up!

---

## 📦 2. Installation

From the project root directory, install dependencies for both root, backend, and frontend:

```bash
# 1. Install root orchestrator
npm install

# 2. Install all dependencies (backend & frontend)
npm run install:all
```

Alternatively, you can install them manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

## 🚀 3. Start Both Simultaneously

To run both the **Backend API (port 5000)** and the **Frontend Dashboard (port 3000)** concurrently:

```bash
npm run dev
```

- **Frontend Dashboard:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5000](http://localhost:5000)

---

## 📡 4. MQTT Architecture & Testing

- **Broker:** `broker.hivemq.com:1883`
- **Subscribed Topic (Status):** `kma_lock/status`
- **Control Topic (Commands):** `kma_lock/control`

### Simulated ESP32 MQTT Payloads

You can test the flow using MQTT Explorer or any MQTT client:

1. **Simulate RFID Card Swipe:**
   - Topic: `kma_lock/status`
   - Payload:
     ```json
     {
       "action": "RFID_OPEN",
       "uid": "C30B2407",
       "timestamp": "2026-10-01T18:45:00.000Z"
     }
     ```
   The backend catches this event and immediately stores it in MySQL `access_logs`.

2. **Simulate Door Sensor Event:**
   - Topic: `kma_lock/status`
   - Payload:
     ```json
     {
       "action": "DOOR_OPENED"
     }
     ```

3. **Remote Control Messages sent by Dashboard:**
   - Topic: `kma_lock/control`
   - Payload strings:
     - `"OPEN_DOOR"`: Triggered by "Open Door Remotely" button.
     - `"LOCK_SYSTEM"`: Triggered by Emergency Lockdown switch.
     - `"UNLOCK_SYSTEM"`: Triggered by Emergency Lockdown switch release.
