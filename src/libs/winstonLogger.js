import fs from 'fs'
import path from 'path'
import * as util from 'util'
import winston from 'winston'
import config from '../configs/app.config'
import DailyRotateFile from 'winston-daily-rotate-file'
import { AsyncLocalStorage } from 'async_hooks'

const { combine, timestamp, label, printf, colorize } = winston.format

const logDir = 'logs'

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// AsyncLocalStorage to track request context across the request lifecycle
export const requestContext = new AsyncLocalStorage()

// Function to extract userId, device, requestUrl, ipAddress and requestId from current request context
function getRequestInfo () {
  const store = requestContext.getStore()
  if (!store) return { userId: null, device: null, requestUrl: null, ipAddress: null, requestId: null }

  const userId = store.context?.auth?.id || null
  const device = store.headers?.['user-agent'] || null
  const requestUrl = store.req?.originalUrl || null
  const ipAddress = store.req?.ip || null
  const requestId = store.req?.requestId || null

  return { userId, device, requestUrl, ipAddress, requestId }
}

// Function to extract browser info from user-agent
function getBrowserInfo (userAgent) {
  if (!userAgent) return 'Unknown'

  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Other'
}

const customFormat = printf((info) => {
  let msg = `Process: ${process.pid} ${info.timestamp} [${info.label}] ${info.level}: `
  info = typeof info.message === 'object' ? info.message : info

  // Automatically extract userId, device, requestUrl, ipAddress and requestId from current request context
  const { userId, device, requestUrl, ipAddress, requestId } = getRequestInfo()
  const browserInfo = getBrowserInfo(device)

  // Use requestId from log info first, fallback to request context
  const finalRequestId = info.requestId || requestId
  msg += finalRequestId ? `[requestId:${finalRequestId}] ` : ''
  msg += userId ? `[userId:${userId}] ` : ''
  msg += device ? `[browser:${browserInfo}] ` : ''
  msg += requestUrl ? `[url:${requestUrl}] ` : ''
  msg += ipAddress ? `[ipAddress:${ipAddress}] ` : ''
  msg += info.logTitle ? `${info.logTitle} Message: ${info.message || 'No Message'} ` : info.message || 'No Message '
  msg += info.class ? `class: ${typeof info.class === 'object' ? util.inspect(info.class, { breakLength: Infinity }) : info.class} ` : ''
  msg += info.context ? `context: ${typeof info.context === 'object' ? util.inspect(info.context, { breakLength: Infinity }) : info.context} ` : ''
  msg += info.metadata ? `metadata: ${typeof info.metadata === 'object' ? util.inspect(info.metadata, { breakLength: Infinity }) : info.metadata} ` : ''
  msg += info.exceptionBacktrace ? `exceptionBacktrace: ${typeof info.exceptionBacktrace === 'object' ? util.inspect(info.exceptionBacktrace, { breakLength: Infinity }) : info.exceptionBacktrace} ` : ''
  msg += info.fault ? `fault: ${typeof info.fault === 'object' ? util.inspect(info.fault, { breakLength: Infinity }) : info.fault} ` : ''
  msg += info.sql ? `sql: ${info.sql} ` : ''

  return msg.replace(/\n/g, ' ').replace(/\s+/g, ' ')
})

// Separate formats for console and file outputs
const consoleFormat = combine(
  label({ label: config.get('app.name') }),
  timestamp(),
  colorize(),
  customFormat
)

const fileFormat = combine(
  label({ label: config.get('app.name') }),
  timestamp(),
  customFormat
)

// Define transports
// const transports = [
//   new DailyRotateFile({
//     filename: path.join(logDir, 'application-%DATE%.log'),
//     datePattern: 'YYYY-MM-DD',
//     maxFiles: null,
//     level: 'silly',
//     handleExceptions: true,
//     zippedArchive: true,
//     format: fileFormat
//   }),
//   new winston.transports.Console({
//     handleExceptions: true,
//     format: consoleFormat
//   })
// ]

// const winstonLogger = winston.createLogger({ level: config.get('log_level') || 'silly', transports, exitOnError: false })

const transports = [
  new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: null,
    level: 'silly',
    handleExceptions: true,
    zippedArchive: true,
    format: fileFormat
  }),
  new winston.transports.Console({
    handleExceptions: true,
    format: consoleFormat,
    level: 'info',
    stderrLevels: ['error'],
    stream: process.stdout
  })
]

const winstonLogger = winston.createLogger({
  level: config.get('log_level') || 'silly',
  transports,
  exitOnError: false
})

export default winstonLogger
