'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('user_roles', [
      {
        name: 'individual',
        role_type: 'user',
        permission: JSON.stringify({
          USER: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'corporate',
        role_type: 'corporate',
        permission: JSON.stringify({
          REPORTS: ['R'],
          TRANSACTION: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'doctor',
        role_type: 'doctor',
        permission: JSON.stringify({
          REPORTS: ['R'],
          transaction: ['R']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'payment',
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
