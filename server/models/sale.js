'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sale extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Sale.belongsTo(models.User, { foreignKey: "UserId" })
    }
  }
  Sale.init({
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    totalAmount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paymentStatus: {
      type: DataTypes.STRING,
      allowNull: false
    },
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Sale',
  });
  return Sale;
};