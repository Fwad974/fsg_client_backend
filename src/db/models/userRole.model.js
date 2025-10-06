export default (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    roleType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    permission: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    underscored: true,
    tableName: 'user_roles',
    schema: 'public',
    timestamps: true,
  })

  UserRole.associate = models => {
    UserRole.hasMany(models.User, {
      foreignKey: 'userRoleId',
      as: 'user'
    })
  }

  return UserRole
}
