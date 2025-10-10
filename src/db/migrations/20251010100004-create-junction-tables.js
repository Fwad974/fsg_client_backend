'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Junction table: Individual <-> Doctor (many-to-many)
    await queryInterface.createTable('individual_doctors', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      individualId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'individual_id'
      },
      doctorId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'doctor_id'
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
      }
    }, {
      schema: 'public',
      timestamps: true,
      underscored: true,
      uniqueKeys: {
        individual_doctor_unique: {
          fields: ['individual_id', 'doctor_id']
        }
      }
    });

    // Junction table: Individual <-> Corporate (many-to-many)
    await queryInterface.createTable('individual_corporates', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      individualId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'individual_id'
      },
      corporateId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'corporate_id'
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
      }
    }, {
      schema: 'public',
      timestamps: true,
      underscored: true,
      uniqueKeys: {
        individual_corporate_unique: {
          fields: ['individual_id', 'corporate_id']
        }
      }
    });

    // Junction table: Corporate <-> Doctor (many-to-many)
    await queryInterface.createTable('corporate_doctors', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
      corporateId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'corporate_id'
      },
      doctorId: {
        type: Sequelize.BIGINT,
        allowNull: false,
        field: 'doctor_id'
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
      }
    }, {
      schema: 'public',
      timestamps: true,
      underscored: true,
      uniqueKeys: {
        corporate_doctor_unique: {
          fields: ['corporate_id', 'doctor_id']
        }
      }
    });
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('corporate_doctors');
    await queryInterface.dropTable('individual_corporates');
    await queryInterface.dropTable('individual_doctors');
  }
};
