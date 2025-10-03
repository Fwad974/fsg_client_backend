import { randomUUID } from 'crypto'
import { AsyncLocalStorage } from 'async_hooks'

export const asyncLocalStorage = new AsyncLocalStorage()

// Global variable to store current request ID as fallback
let currentRequestId = null

export const requestIdMiddleware = (req, res, next) => {
  const requestId = randomUUID()

  req.requestId = requestId
  res.setHeader('X-Request-ID', requestId)
  currentRequestId = requestId

  asyncLocalStorage.run({ requestId }, () => {
    next()
  })
}

export const getRequestId = () => {
  const store = asyncLocalStorage.getStore()
  return store?.requestId || currentRequestId
}
