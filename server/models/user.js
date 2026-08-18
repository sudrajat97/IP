'use strict';
const { hashPassword } = require('../helpers/bcrypt')
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
      User.hasMany(models.StockMovement, { foreignKey: "UserId" })
      User.hasMany(models.Sale, { foreignKey: "UserId" })
    }
  }
  User.init({
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Email already registered"
      },
      validate: {
        notNull: { msg: "Email is required" },
        notEmpty: { msg: "Email is required" },
        isEmail: { msg: "Invalid email format" }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: { msg: "Password is required" },
        notEmpty: { msg: "Password is required" },
        len: { args: [5], msg: "Password minimum 5 characters" }
      }
    },
    role: {
      type: DataTypes.STRING,
      defaultValue: "staff",
      validate: {
        isIn: {
          args: [['admin', 'manager', 'staff']],
          msg: "Role must be admin, manager, or staff"
        }
      }
    }
  }, {
    sequelize,
    modelName: 'User',
  });

  User.beforeCreate((user) => {
    user.password = hashPassword(user.password)
  })

  return User;
};