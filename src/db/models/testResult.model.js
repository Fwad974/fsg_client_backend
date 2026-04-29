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
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
      allowNull: false,
      unique: true,
      field: 'uuid'
    },
    patientId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'patient_id'
    },
    hospitalId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'hospital_id'
    },
    doctorId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'doctor_id'
    },
    formRequestId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'form_request_id'
    },
    testCategoryId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      field: 'test_category_id'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'status'
    },
    labStatus: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'lab_status'
    },
    turnAroundTime: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'turn_around_time'
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
    TestResult.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    })
    TestResult.belongsTo(models.Hospital, {
      foreignKey: 'hospitalId',
      as: 'hospital'
    })
    TestResult.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })
    TestResult.belongsTo(models.FormRequest, {
      foreignKey: 'formRequestId',
      as: 'formRequest'
    })
    TestResult.belongsTo(models.TestCategory, {
      foreignKey: 'testCategoryId',
      as: 'testCategory'
    })
    TestResult.hasMany(models.DocInstance, {
      foreignKey: 'testResultId',
      as: 'docInstances'
    })
  }

  return TestResult
}
