'use strict';
const users = require('../data/users.json');
const { hashPassword } = require('../helpers/bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const data = users.map((user) => ({
      email: user.email,
      password: hashPassword(user.password),
      role: user.role,
      createdAt: now,
      updatedAt: now
    }));

    await queryInterface.bulkInsert('Users', data);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: users.map((user) => user.email)
    });
  }
};
