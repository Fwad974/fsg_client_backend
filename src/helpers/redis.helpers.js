import redis from '../libs/redisClient'

/**
 * @function getCachedData
 * @param {string} cacheKey - cacheKey
 * @returns {Promise} When resolved giving cache value for given key
 */
export const getCachedData = async (cacheKey) => {
  return await redis.client.get(cacheKey)
}

/**
 * @function removeData
 * @param {string} cacheKey - cacheKey
 */
export const removeData = async (cacheKey) => {
  await redis.client.del(cacheKey)
}

/**
 * @function setData
 * @param {string} cacheKey - key to be set in cache
 * @param {string} value - value for particular key
 * @param {integer} expiryTime - expiryTime in seconds
 */
export const setData = async (cacheKey, value, expiryTime) => {
  await redis.client.set(cacheKey, value, 'EX', expiryTime)
}

/**
 * @function setExpireAt
 * @param {string} cacheKey - key to be set in cache
 * @description function to update TTL
 */
export const setExpireAt = async (cacheKey, expiryTime) => {
  await redis.client.expireat(cacheKey, Math.round(Date.now() / 1000) + expiryTime)
}

/**
 * @function getTTL
 * @param {string} cacheKey - key to be set in cache
 * @description function to get time to leave
 */
export const getTTL = async (cacheKey) => {
  return await redis.client.ttl(cacheKey)
}

/**
 * @function setDataWithoutExpiry
 * @param {string} cacheKey - key to be set in cache
 * @param {string} value - value for particular key
 */
export const setDataWithoutExpiry = async (cacheKey, value) => {
  await redis.client.set(cacheKey, value)
}
