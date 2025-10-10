'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('user_roles', [
      {
        id: 1,
        name: 'FSG:INDIVIDUAL',
        role_type: 'individual',
        permission: JSON.stringify({
          USER: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 2,
        name: 'FSG:CORPORATE',
        role_type: 'corporate',
        permission: JSON.stringify({
          REPORTS: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 3,
        name: 'FSG:DOCTOR',
        role_type: 'doctor',
        permission: JSON.stringify({
          REPORTS: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: 4,
        name: 'FSG:PAYMENT',
        role_type: 'payment',
        permission: JSON.stringify({
          TRANSACTION: ['R'],
          REPORTS: ['R']
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
