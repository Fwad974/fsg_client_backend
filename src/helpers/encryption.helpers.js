import crypto from 'crypto'
import { getServerSeedCacheKey, getUserTokenCacheKey } from '../utils/user.utils'
import { getTTL, setData } from './redis.helpers'
import config from '../configs/app.config'

const algorithm = config.get('encrypt.algorithm')
const secretKey = Buffer.from(config.get('encrypt.encryption_secret'), 'utf8') // 32 bytes
const iv = Buffer.from(config.get('encrypt.encryption_iv'), 'utf8') // 16 bytes

export const createHMACSignature = (data, secretKey) => {
  const message = JSON.stringify(data)

  const computedSignature = crypto.createHmac('sha256', secretKey).update(message).digest('hex')
  return computedSignature
}

export const verifyHMACSignature = (data, signature, secretKey) => {
  const message = JSON.stringify(data)

  const computedSignature = crypto.createHmac('sha256', secretKey).update(message).digest('hex')
  return signature === computedSignature
}

/**
 *
 *
 * @param {string} data
 * @return {string}
 */
export const createSHA256Hash = (data) => {
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 *
 * @param {string} userId
 * @param {string} userCode
 * @returns {string} This method generates and returns hash of server
 */
export const generateServerSeedHash = async (userId) => {
  // Generate a random seed
  const serverSeed = crypto.randomBytes(16).toString('hex')

  // Equate the expiry time for seed to user auth token
  const expiryTime = await getTTL(getUserTokenCacheKey(userId))

  // Set in redis
  await setData(getServerSeedCacheKey(userId), serverSeed, expiryTime)

  // Return the hashed seed
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex')

  return { serverSeedHash }
}

export function encrypt (text) {
  const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
  let encrypted = cipher.update(text, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  return encrypted
}

export function decrypt (encryptedText) {
  const decipher = crypto.createDecipheriv(algorithm, secretKey, iv)
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
