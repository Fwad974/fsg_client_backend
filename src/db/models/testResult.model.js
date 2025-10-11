'use strict'

export default (sequelize, DataTypes) => {
  const TestResult = sequelize.define('TestResult', {
   id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        field: 'id'
      },
    individualId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'individual_id'
    },
    corporateId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'corporate_id'
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'doctor_id'
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'name'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'status'
    },
    sample: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'sample'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'duration'
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'error_message'
    },
    errorType: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'error_type'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'start_time'
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'end_time'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'description'
    },
    code: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'code'
    },
    turnAroundTime: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'turn_around_time'
    },
    fileUuid: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      allowNull: true,
      unique: true,
      field: 'file_uuid'
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'file_name'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'test_results',
    schema: 'public',
    timestamps: true
  })

  TestResult.associate = models => {
    TestResult.belongsTo(models.Individual, {
      foreignKey: 'individualId',
      as: 'individual'
    })

    TestResult.belongsTo(models.Corporate, {
      foreignKey: 'corporateId',
      as: 'corporate'
    })

    TestResult.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })
  }

  return TestResult
}
