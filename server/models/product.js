'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Product extends Model {
    static associate(models) {
      Product.belongsTo(models.Supplier, { foreignKey: "SupplierId" })
    }
  }
  Product.init({
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Name is required" },
        notNull: { msg: "Name is required" }
      }
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: "SKU already in use" },
      validate: {
        notNull: { msg: "SKU is required" },
        notEmpty: { msg: "SKU is required" }
      }
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: "Category is required" },
        notNull: { msg: "Category is required" }
      }
    },
    brand: DataTypes.STRING,
    purchasePrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Purchase price is required" },
        min: { args: [0], msg: "Purchase price cannot be negative" }
      }
    },
    sellingPrice: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Selling price is required" },
        min: { args: [0], msg: "Selling price cannot be negative" }
      }
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: { args: [0], msg: "Quantity cannot be negative" }
      }
    },
    minStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      validate: {
        min: { args: [0], msg: "Minimum stock cannot be negative" }
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    SupplierId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Product',
    hooks: {
      beforeUpdate(product) {
        if (product.changed('sku')) {
          product.sku = product.previous('sku')
        }
      }
    }
  });
  return Product;
};