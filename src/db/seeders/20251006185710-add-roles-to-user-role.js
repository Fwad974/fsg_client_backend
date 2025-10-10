'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('user_roles', [
      {
        name: 'FSG:INDIVIDUAL',
        role_type: 'individual',
        permission: JSON.stringify({
          USER: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'FSG:CORPORATE',
        role_type: 'corporate',
        permission: JSON.stringify({
          REPORTS: ['R'],
          TRANSACTION: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'FSG:DOCTOR',
        role_type: 'doctor',
        permission: JSON.stringify({
          REPORTS: ['R'],
          transaction: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'FSG:PAYMENT',
        role_type: 'payment',
        permission: JSON.stringify({
          TRANSACTION: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('user_roles', null, {});
  }
}
