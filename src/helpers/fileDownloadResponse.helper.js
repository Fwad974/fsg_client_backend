/**
 * File Download Response Middleware
 * @namespace Rest Middleware
 */

import _ from 'lodash'
import BaseError from '../errors/base.error'
import * as errorTypes from '../libs/errorTypes'
import { extractErrorAttributes } from '../utils/error.utils'

/**
 * Middleware to handle file download response
 * Checks for errors, validates result, sets secure headers and sends file as download
 *
 * @memberof Rest Middleware
 * @export
 * @param {object} context - contains req, res, next
 * @param {object} data - contains result, successful, serviceErrors
 */
export default function fileDownloadResponseHelper ({ req, res, next }, { result, successful, serviceErrors, defaultError }) {
  try {
    if (!successful) {
      if (!_.isEmpty(serviceErrors)) {
        // executed when addError is called from service
        const responseErrors = extractErrorAttributes(serviceErrors).map(errorAttr => errorTypes[errorAttr] || errorAttr)
        return next(responseErrors)
      }
      const responseError = new BaseError({ ...defaultError })
      next(responseError)
    }

    res.set({
      'Content-Disposition': `attachment; filename="${result.fileName}"`,
      'Cache-Control': 'private, no-cache',
      'X-Content-Type-Options': 'nosniff'
    })

    res.download(result.filePath, result.fileName)
  } catch (err) {
    next(err)
  }
}
