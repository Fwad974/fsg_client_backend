import Bull from 'bull'
import Redis from 'ioredis'
import redisClient from '../libs/redisClient'

const opts = {
  createClient: function (type, opts) {
    switch (type) {
      case 'client':
        return redisClient.client
      case 'subscriber':
        return redisClient.publisherClient
      default:
        return new Redis(opts)
    }
  },
  redis: redisClient.connection,
  defaultJobOptions: {
    attempts: 10,
    backoff: 60000,
    removeOnComplete: 10000
  }
}

export const emailQueue = new Bull('Email-Queue', {
  ...opts
})

export const JOB_SEND_MAIL = 'SendMail'
