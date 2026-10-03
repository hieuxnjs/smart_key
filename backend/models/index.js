const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Model: AccessLog
const AccessLog = sequelize.define(
  'AccessLog',
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
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'access_logs',
    timestamps: false,
    indexes: [
      {
        fields: ['timestamp'],
      },
    ],
  }
);

// Model: Setting (Single row global configuration)
const Setting = sequelize.define(
  'Setting',
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
      defaultValue: '123456',
    },
    // BỔ SUNG 2 TRƯỜNG DƯỚI ĐÂY
    auto_mode_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false, // Mặc định tắt cảm biến
    },
    auto_close_delay: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10, // Mặc định 10 giây
    },
  },
  {
    tableName: 'settings',
    timestamps: true,
  }
);

// Helper function to initialize default setting row
async function initSetting() {
  const [setting] = await Setting.findOrCreate({
    where: { id: 1 },
    defaults: {
      id: 1,
      system_locked: false,
      current_password: '123456',
      auto_mode_enabled: false,
      auto_close_delay: 10,
    },
  });
  return setting;
}

module.exports = {
  sequelize,
  AccessLog,
  Setting,
  initSetting,
};