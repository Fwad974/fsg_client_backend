'use strict'

export default (sequelize, DataTypes) => {
  const Hospital = sequelize.define('Hospital', {
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
    hospitalName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'hospital_name'
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    address: {
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
    tableName: 'hospitals',
    schema: 'public',
    timestamps: true
  })

  Hospital.associate = models => {
    Hospital.hasMany(models.User, {
      foreignKey: 'hospitalId',
      as: 'users'
    })
    Hospital.belongsToMany(models.Patient, {
      through: 'patient_hospitals',
      foreignKey: 'hospitalId',
      otherKey: 'patientId',
      as: 'patients'
    })
    Hospital.belongsToMany(models.Doctor, {
      through: 'hospital_doctors',
      foreignKey: 'hospitalId',
      otherKey: 'doctorId',
      as: 'doctors'
    })
  }

  return Hospital
}
