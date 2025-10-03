import fs from 'fs'
import dotenv from 'dotenv'
import convict from 'convict'

const env = process.env.NODE_ENV || 'development'
const envFilePath = env === 'production' ? '.env' : `.env.${env}`

if (fs.existsSync(envFilePath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envFilePath))

  for (const key in envConfig) {
    process.env[key] = envConfig[key]
  }
}

const config = convict({
  log_level: {
    doc: 'Log level',
    format: ['error', 'warn', 'info', 'verbose', 'debug', 'silly'],
    default: 'info',
    env: 'LOG_LEVEL'
  },

  port: {
    doc: 'Port to run the server on',
    format: 'port',
    default: 8004,
    env: 'PORT'
  },

  app: {
    name: {
      doc: 'Name of the service',
      format: String,
      default: 'hortman-user-backend'
    },
    url: {
      doc: 'URL of the service',
      format: String,
      default: 'user-backend:8003',
      env: 'APP_URL'
    },
    appName: {
      doc: 'Name of the application',
      format: String,
      default: 'hortman',
      env: 'APP_NAME'
    }
  },

  db: {
    name: {
      doc: 'Database Name',
      format: String,
      default: '',
      env: 'DB_NAME'
    },
    username: {
      doc: 'Database User Name',
      format: String,
      default: '',
      env: 'DB_USERNAME'
    },
    password: {
      doc: 'Database password.',
      format: String,
      default: '',
      env: 'DB_PASSWORD'
    },
    host: {
      doc: 'Database host.',
      format: String,
      default: '',
      env: 'DB_HOST'
    },
    port: {
      doc: 'Database port.',
      format: String,
      default: '',
      env: 'DB_PORT'
    }
  },
  slave_db: {
    name: {
      doc: 'Database Name',
      format: String,
      default: '',
      env: 'SLAVE_DB_NAME'
    },
    username: {
      doc: 'read only Database User Name',
      format: String,
      default: '',
      env: 'SLAVE_DB_USERNAME'
    },
    password: {
      doc: 'read only Database password.',
      format: String,
      default: '',
      env: 'SLAVE_DB_PASSWORD'
    },
    host: {
      doc: 'read only Database host.',
      format: String,
      default: '',
      env: 'SLAVE_DB_HOST'
    },
    port: {
      doc: 'read only Database port.',
      format: String,
      default: '',
      env: 'SLAVE_DB_PORT'
    }
  },

  jwt: {
    loginTokenSecret: {
      doc: 'jwt secret.',
      format: String,
      default: '',
      env: 'JWT_LOGIN_SECRET'
    },
    loginTokenExpiry: {
      doc: 'jwt expiration token.',
      format: String,
      default: '',
      env: 'JWT_LOGIN_TOKEN_EXPIRY'
    }
  },

  redis_db: {
    host: {
      format: String,
      default: '',
      env: 'REDIS_DB_HOST'
    },
    port: {
      format: String,
      default: '',
      env: 'REDIS_DB_PORT'
    },
    password: {
      format: String,
      default: '',
      env: 'REDIS_DB_PASSWORD'
    }
  }
})

config.validate({ allowed: 'strict' })

export default config
