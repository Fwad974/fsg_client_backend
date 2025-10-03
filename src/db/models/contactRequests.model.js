'use strict'
export default (sequelize, DataTypes) => {
  const ContactRequest = sequelize.define('ContactRequest', {
    id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        field: 'user_id'
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'name'
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'email'
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'address'
      },
      contactNumber: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'contact_number'
      },
      organization: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'organization'
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        field: 'message'
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        allowNull: false,
        field: 'status'
      },
      requestId: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
        unique: true
      },
      respondedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'responded_at'
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
    tableName: 'contact_requests',
    schema: 'public',
    timestamps: true
  })

  ContactRequest.associate = models => {
    ContactRequest.belongsTo(models.User, {
      foreignKey: 'userId'
    })
  }

  return ContactRequest
}
