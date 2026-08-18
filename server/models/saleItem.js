'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SaleItem extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      SaleItem.belongsTo(models.Sale, { foreignKey: "SaleId" })
      SaleItem.belongsTo(models.Product, { foreignKey: "ProductId" })
    }
  }
  SaleItem.init({
    SaleId: DataTypes.INTEGER,
    ProductId: DataTypes.INTEGER,
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Quantity is required" },
        min: { args: [1], msg: "Quantity must be at least 1" }
      }
    },
    priceAtSale: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: { msg: "Price at sale is required" },
        min: { args: [0], msg: "Price at sale cannot be negative" }
      }
    }
  }, {
    sequelize,
    modelName: 'SaleItem',
  });
  return SaleItem;
};
