import crypto from 'crypto'
import Logger from '../libs/logger'

export function createHMACSignature (secretKey, algorithm, data, encoding = 'hex') {
  try {
    const hmac = crypto.createHmac(algorithm, secretKey)
    const hmacSignature = hmac.update(data).digest(encoding)

    return hmacSignature
  } catch (error) {
    Logger.error('createHMACSignature: ', { message: error.message, exception: error })
    throw error
  }
}

export function verifyHMACSignature (secretKey, algorithm, data, receivedSignature, encoding = 'hex') {
  const expectedSignature = createHMACSignature(secretKey, algorithm, data, encoding)

  try {
    if (receivedSignature !== expectedSignature) {
      return false
    }

    const expectedBuffer = Buffer.from(expectedSignature, encoding)
    const receivedBuffer = Buffer.from(receivedSignature, encoding)

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  } catch (error) {
    Logger.error('verifyHMACSignature: ', { message: `Buffer conversion failed: ${error.message}`, exception: error })
    throw error
  }
}
