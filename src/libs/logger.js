import winstonLogger from '../libs/winstonLogger'
import { getRequestId } from '../rest-resources/middlewares/requestId.middleware'

/**
 * @typedef {Object} LogArgHash with message and other properties
 * @property {string} wrap to wrap the log message
 * @property {(Object | number | string)} klass name of the class or constructor
 * @property {(Object | number | string)} message message to log
 * @property {(Object | number | string)} context context of the log
 * @property {(Object | number | string)} metadata extra metadata for the log
 * @property {(Object | number | string)} exception exception for the log
 * @property {(Object | number | string)} fault fault for the log
 */

/**
 * @class Logger
 *
 * @classdesc class which utilizes winston instance
 * for logging things to console and filesystem
 *
 * @hideconstructor
 */
class Logger {
  /**
   *
   * @static
   * @public
   * @function
   * @param {string} logTitle title of the Log
   * @param {LogArgHash} [argHash={}] object with message and other properties
   * @returns {undefined}
   */
  static info (logTitle, argHash = {}) {
    this.#log('info', logTitle, argHash)
  }

  /**
   *
   * @static
   * @function
   * @public
   * @param {string} logTitle title of the Log
   * @param {LogArgHash} [argHash={}] object with message and other properties
   * @returns {undefined}
   */
  static debug (logTitle, argHash = {}) {
    this.#log('debug', logTitle, argHash)
  }

  /**
   *
   * @static
   * @function
   * @public
   * @param {string} logTitle title of the Log
   * @param {LogArgHash} [argHash={}] object with message and other properties
   * @returns {undefined}
   */
  static error (logTitle, argHash = {}) {
    this.#log('error', logTitle, argHash)
  }

  /**
   *
   * @static
   * @function
   * @public
   * @param {string} logTitle title of the Log
   * @param {LogArgHash} [argHash={}] object with message and other properties
   * @returns {undefined}
   */
  static warn (logTitle, argHash = {}) {
    this.#log('warn', logTitle, argHash)
  }

  /**
   * Writes a raw message directly to the log file.
   * @static
   * @public
   * @function
   * @param {string} logType Type of the log (info, debug, error, etc.)
   * @param {(string | object | any)} rawMessage The raw message to log
   * @returns {undefined}
   */
  static logRaw (logType, rawMessage) {
    // Convert the message to a string if it's not already
    const logMessage = typeof rawMessage === 'string' ? rawMessage : JSON.stringify(rawMessage, null, 2)

    // Write the message to the log
    winstonLogger[logType](logMessage)
    // this.#writeToLog(logType, logTitle, rawMessage, argHash)
  }

  /**
   *
   * @static
   * @function
   * @private
   * @param {string} logType type of the Log error, info, debug
   * @param {string} logTitle title of the Log
   * @param {LogArgHash} [argHash={}] object with message and other properties
   * @returns {undefined}
   */
  static #log (logType, logTitle, argHash = {}) {
    const allArgs = Object.assign({ logTitle }, argHash)
    const logMessage = this.#buildMessage(allArgs)
    this.#writeToLog(logType, logTitle, logMessage, argHash)
  }

  /**
   *
   * @static
   * @function
   * @private
   * @param {string} logType type of the Log error, info, debug
   * @param {string} logTitle title of the Log
   * @param {(string| object)} logTitle Title of the Log
   * @param {LogArgHash} [argHash={}] object with message and other properties
   * @returns {undefined}
   */
  static #writeToLog (logType, logTitle, logMessage, argHash = {}) {
    if (argHash && argHash.wrap === 'start') {
      winstonLogger[logType](this.#generateWrapStr(logTitle, 'START'))
    } else if (argHash && argHash.wrap === 'end') {
      winstonLogger[logType](this.#generateWrapStr(logTitle, 'END'))
    } else {
      winstonLogger[logType](logMessage)
    }
  }

  /**
   *
   * @static
   * @function
   * @private
   * @param {string} logTitle title of the Log
   * @param {string} wrapWord Wrapping word
   * @returns {string}
   */
  static #generateWrapStr (logTitle, wrapWord) {
    return `${wrapWord}${'='.repeat(15)}${logTitle.toUpperCase()}${'='.repeat(15)}${wrapWord}`
  }

  /**
   *
   * @static
   * @function
   * @private
   * @param {LogArgHash} logAttrs object with message and other properties
   * @returns {Object}
   */
  static #buildMessage (logAttrs) {
    const msg = { logTitle: logAttrs.logTitle }
    const requestId = getRequestId()
    if (requestId) { msg.requestId = requestId }
    if (logAttrs.klass) { msg.class = logAttrs.klass.name }
    if (logAttrs.message) { msg.message = logAttrs.message }
    if (logAttrs.context) { msg.context = logAttrs.context }
    if (logAttrs.metadata) { msg.metadata = logAttrs.metadata }
    if (logAttrs.exception) { msg.exceptionBacktrace = logAttrs.exception.stack }
    if (logAttrs.fault) { msg.fault = logAttrs.fault }
    return msg
  }
}

export default Logger
