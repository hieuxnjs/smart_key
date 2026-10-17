const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

// Import trực tiếp model User từ file User.js
const User = require("./User");

// Model: AccessLog
const AccessLog = sequelize.define(
  "AccessLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rfid_uid: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: null,
    },
    action: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    image_data: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      defaultValue: null,
    },
    image_base64: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      defaultValue: null,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "access_logs",
    timestamps: false,
    indexes: [
      {
        fields: ["timestamp"],
      },
    ],
  },
);

// Model: Setting (Single row global configuration)
const Setting = sequelize.define(
  "Setting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      defaultValue: 1,
    },
    system_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    current_password: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: "1234",
    },
    auto_mode_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    auto_close_delay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
    },
  },
  {
    tableName: "settings",
    timestamps: true,
  },
);

// Model: EnrolledFace (Khuôn mặt thành viên được đồng bộ từ AI Service)
const EnrolledFace = sequelize.define(
  "EnrolledFace",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
    },
    image_base64: {
      type: DataTypes.TEXT("long"),
      allowNull: true,
      defaultValue: null,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "enrolled_faces",
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["name"],
      },
    ],
  },
);

// Helper function to initialize default setting row
async function initSetting() {
  const [setting] = await Setting.findOrCreate({
    where: { id: 1 },
    defaults: {
      id: 1,
      system_locked: false,
      current_password: "1234",
      auto_mode_enabled: false,
      auto_close_delay: 10,
    },
  });
  return setting;
}

// Xuất tất cả ra ngoài
module.exports = {
  sequelize,
  User, // Quan trọng: Đã có mặt User ở đây
  AccessLog,
  Setting,
  EnrolledFace,
  initSetting,
};
