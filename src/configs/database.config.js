import config from './app.config'

const commonSetting = {
  dialect: 'postgres',
  database: config.get('db.name'),
  dialectOptions: {
    application_name: config.get('app.name')
  },
  define: {
    underscored: true,
    timestamps: true
  },
  replication: {
    read: [{
      username: config.get('slave_db.username'),
      password: config.get('slave_db.password'),
      host: config.get('slave_db.host'),
      port: config.get('slave_db.port')
    }],
    write: {
      username: config.get('db.username'),
      password: config.get('db.password'),
      host: config.get('db.host'),
      port: config.get('db.port')
    }
  },
  pool: {
    max: 50,
    min: 0,
    idle: 5000,
    evict: 5000,
    acquire: 200000
  },
  migrationStorage: 'sequelize',
  migrationStorageTableName: 'sequelize_migration_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seed_meta'
}

export const development = {
  logging: true,
  ...commonSetting
}

export const test = {
  logging: true,
  ...commonSetting
}

export const staging = {
  logging: false,
  ...commonSetting
}

export const production = {
  logging: false,
  ...commonSetting
}
