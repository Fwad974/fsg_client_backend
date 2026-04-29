'use strict'

export default (sequelize, DataTypes) => {
  const FormRequest = sequelize.define('FormRequest', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    uuid: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: DataTypes.UUIDV4,
      field: 'uuid'
    },
    labId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'lab_id'
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
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at'
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'form_requests',
    schema: 'public',
    timestamps: true,
    paranoid: true
  })

  FormRequest.associate = models => {
    FormRequest.belongsTo(models.Patient, {
      foreignKey: 'patientId',
      as: 'patient'
    })
    FormRequest.belongsTo(models.Hospital, {
      foreignKey: 'hospitalId',
      as: 'hospital'
    })
    FormRequest.belongsTo(models.Doctor, {
      foreignKey: 'doctorId',
      as: 'doctor'
    })
    FormRequest.hasMany(models.TestResult, {
      foreignKey: 'formRequestId',
      as: 'testResults'
    })
  }

  return FormRequest
}
