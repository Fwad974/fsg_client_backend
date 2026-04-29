'use strict'

export default (sequelize, DataTypes) => {
  const Patient = sequelize.define('Patient', {
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
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'first_name'
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'last_name'
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'patients',
    schema: 'public',
    timestamps: true
  })

  Patient.associate = models => {
    Patient.hasOne(models.User, {
      foreignKey: 'patientId',
      as: 'user'
    })
    Patient.belongsToMany(models.Doctor, {
      through: 'patient_doctors',
      foreignKey: 'patientId',
      otherKey: 'doctorId',
      as: 'doctors'
    })
    Patient.belongsToMany(models.Hospital, {
      through: 'patient_hospitals',
      foreignKey: 'patientId',
      otherKey: 'hospitalId',
      as: 'hospitals'
    })
    Patient.hasMany(models.TestResult, {
      foreignKey: 'patientId',
      as: 'testResults'
    })
  }

  return Patient
}
