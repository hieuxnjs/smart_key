const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING(32),
      allowNull: true,
      defaultValue: "admin",
    },
  },
  {
    tableName: "users", // Bắt buộc viết thường để tương thích với Docker/Linux
    freezeTableName: true,
    timestamps: true,
  },
);

module.exports = User;
