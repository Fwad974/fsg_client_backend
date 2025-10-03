'use strict'
export default (sequelize, DataTypes) => {
  const UserToken = sequelize.define('UserToken', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    tokenType: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'user_tokens',
    schema: 'public',
    timestamps: true
  })

  UserToken.associate = models => {
    UserToken.belongsTo(models.User, {
      foreignKey: 'userId'
    })
  }

  return UserToken
}
