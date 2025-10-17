'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      userRoleId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'user_role_id'
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'first_name'
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'last_name'
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        field: 'email_verified'
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'verified_at'
      },
      encryptedPassword: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'encrypted_password'
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      phoneCode: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'phone_code'
      },
      phoneVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
        field: 'phone_verified'
      },
      profileImageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'profile_image_url'
      },
      signInCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: 'sign_in_count'
      },
      signInIp: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'sign_in_ip'
      },
      userName: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        field: 'user_name'
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_login'
      },
      userType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'user_type'
      },
      uuid: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: Sequelize.UUIDV4,
        unique: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at'
      },
    }, {
      schema: 'public',
      timestamps: true,
      paranoid: true,
      underscored: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};
