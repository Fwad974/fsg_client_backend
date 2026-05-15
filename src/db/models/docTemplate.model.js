'use strict'

export default (sequelize, DataTypes) => {
  const DocTemplate = sequelize.define('DocTemplate', {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'type'
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
    tableName: 'doc_templates',
    schema: 'public',
    timestamps: true
  })

  DocTemplate.associate = models => {
    DocTemplate.hasMany(models.DocInstance, {
      foreignKey: 'docTemplateId',
      as: 'docInstances'
    })
  }

  return DocTemplate
}
