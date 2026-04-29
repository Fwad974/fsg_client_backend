'use strict'

export default (sequelize, DataTypes) => {
  const DocInstance = sequelize.define('DocInstance', {
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
    testResultId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'test_result_id'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'status'
    },
    pdfFilePath: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'pdf_file_path'
    },
    releasedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'released_date'
    },
    reportedDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'reported_date'
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
    tableName: 'doc_instances',
    schema: 'public',
    timestamps: true
  })

  DocInstance.associate = models => {
    DocInstance.belongsTo(models.TestResult, {
      foreignKey: 'testResultId',
      as: 'testResult'
    })
  }

  return DocInstance
}
