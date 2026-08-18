'use strict';
const products = require('../data/products.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const suppliers = await queryInterface.sequelize.query(
      'SELECT id, "companyName" FROM "Suppliers"',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const supplierIdByName = {};
    suppliers.forEach((supplier) => {
      supplierIdByName[supplier.companyName] = supplier.id;
    });

    const now = new Date();
    const data = products.map((product) => ({
      name: product.name,
      sku: product.sku,
      category: product.category,
      brand: product.brand,
      purchasePrice: product.purchasePrice,
      sellingPrice: product.sellingPrice,
      quantity: product.quantity,
      minStock: product.minStock,
      isActive: true,
      SupplierId: product.supplierCompanyName ? supplierIdByName[product.supplierCompanyName] : null,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('Products', data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Products', {
      sku: products.map((product) => product.sku)
    });
  }
};
