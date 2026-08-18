'use strict';
const suppliers = require('../data/suppliers.json');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const data = suppliers.map((supplier) => ({
      ...supplier,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('Suppliers', data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Suppliers', {
      companyName: suppliers.map((supplier) => supplier.companyName)
    });
  }
};
