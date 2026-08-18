'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StockMovement extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      StockMovement.belongsTo(models.Product, { foreignKey: "ProductId" })
      StockMovement.belongsTo(models.User, { foreignKey: "UserId" })
    }
  }
  StockMovement.init({
    ProductId: DataTypes.INTEGER,
    type: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    quantityBefore: DataTypes.INTEGER,
    quantityAfter: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER,
    note: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'StockMovement',
  });
  return StockMovement;
};