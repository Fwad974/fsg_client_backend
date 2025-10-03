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
      dateOfBirth: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'date_of_birth'
      },
      gender: {
        type: Sequelize.STRING,
        allowNull: true
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
      countryCode: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'country_code'
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'deleted_at'
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
      address1: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'address1'
      },
      address2: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'address2'
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      postalCode: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'postal_code'
      },
      country: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bloodType: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'blood_type'
      },
      allergies: {
        type: Sequelize.STRING,
        allowNull: true
      },
      medicalConditions: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'medical_conditions'
      },
      emergency_contact_name: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      emergencyContactPhone: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'emergency_contact_phone'
      },
      emergencyContactRelationship: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'emergency_contact_relationship'
      },
      insuranceProvider: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'insurance_provider'
      },
      insurancePolicyNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'insurance_policy_number'
      },
      insuranceGroupNumber: {
        type: Sequelize.STRING,
        allowNull: true,
        field: 'insurance_group_number'
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
