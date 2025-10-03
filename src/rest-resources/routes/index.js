import express from 'express'
import onHealthCheck from '../../libs/onHealthCheck'
import apiRouter from './api'
import Logger from '../../libs/logger'
import { requestContext } from '../../libs/winstonLogger'

const router = express.Router()

function formatResponseBody (body) {
  if (!body) return '[Empty Response]'

  const bodyStr = JSON.stringify(body)
  if (bodyStr.length > 500) {
    return bodyStr.slice(0, 500) + '... [truncated]'
  }
  return bodyStr
}

router.use((req, res, next) => {
  requestContext.run({ req, headers: req.headers, context: req.context }, () => {
    const start = Date.now()

    // Save original methods
    const originalSend = res.send.bind(res)
    const originalJson = res.json.bind(res)

    // Intercept res.send
    res.send = function (body) {
      res.body = body
      return originalSend(body)
    }

    // Intercept res.json
    res.json = function (body) {
      res.body = body
      return originalJson(body)
    }
    // Log request data - show both query and body when available
    const hasQuery = Object.keys(req.query).length > 0
    const hasBody = req.body && Object.keys(req.body).length > 0

    let requestData = ''
    if (hasQuery && hasBody) {
      requestData = `Query: ${JSON.stringify(req.query)}, Body: ${JSON.stringify(req.body)}`
    } else if (hasQuery) {
      requestData = `Query: ${JSON.stringify(req.query)}`
    } else if (hasBody) {
      requestData = `Body: ${JSON.stringify(req.body)}`
    } else {
      requestData = `${req.method} request - no query/body data`
    }

    Logger.info('Request:', {
      message: requestData,
      headers: req.headers,
      query: req.query,
      body: req.body
    })
    res.on('finish', () => {
      const duration = Date.now() - start

      const formattedResponse = formatResponseBody(res.body)

      Logger.info('Response:', {
        message: `StatusCode: ${res.statusCode} | Body: ${formattedResponse} | Duration: ${duration} ms`,
        headers: res.getHeaders()
      })
    })

    next()
  })
})

router.use('/api', apiRouter)

router.get('/health-check', async (_, res) => {
  try {
    const response = await onHealthCheck()
    res.json(response)
  } catch (error) {
    res.status(503)
    res.send()
  }
})

export default router
