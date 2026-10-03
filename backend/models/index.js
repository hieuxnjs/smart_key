const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');

// ====================================================
// 1. Model: AccessLog -> Exact Table: AccessLogs
// ====================================================
const AccessLog = sequelize.define(
  'AccessLog',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    rfid_uid: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null,
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'AccessLogs',
    freezeTableName: true,
    timestamps: true,
    indexes: [
      {
        fields: ['timestamp'],
      },
    ],
  }
);

// ====================================================
// 2. Model: Setting -> Exact Table: Settings
// ====================================================
const Setting = sequelize.define(
  'Setting',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    system_locked: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    current_password: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: '1234',
    },
    auto_mode_enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false, // Default PIR auto mode is disabled
    },
    auto_close_delay: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 10, // Default 10 seconds auto-close delay
    },
  },
  {
    tableName: 'Settings',
    freezeTableName: true,
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
      current_password: '1234',
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
  User,
  initSetting,
};
