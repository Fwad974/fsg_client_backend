/**
 * File Authorization Middleware
 * @namespace Rest Middleware
 */

import db from '../../db/models'
import { InvalidAccessErrorType, RecordNotFoundErrorType } from '../../libs/errorTypes'

/**
 * Middleware to verify user has access to the requested file
 * Uses file UUID to find and verify ownership
 *
 * @memberof Rest Middleware
 * @export
 * @param {string} modelName - The Sequelize model name (e.g., 'TestResult')
 * @returns {Function} Express middleware function
 *
 * @example
 * // In routes:
 * router.get('/files/download/:fileUuid',
 *   authenticationMiddleWare,
 *   authorizeFileAccess('TestResult'),
 *   downloadFile
 * )
 */
export const authorizeFileAccess = (modelName) => {
  return async (req, res, next) => {
    try {
      const { fileUuid } = req.params
      const userId = req.context.auth?.id

      if (!userId) {
        return next(InvalidAccessErrorType)
      }

      if (!fileUuid) {
        return next(RecordNotFoundErrorType)
      }

      // Find the record by file UUID with user associations
      const record = await db[modelName].findOne({
        where: { fileUuid },
        include: [
          { model: db.Individual, as: 'individual', attributes: ['id'],
            include: [{ model: db.User, as: 'user', where: { id: userId }, attributes: ['uuid'] }]
          },
          { model: db.Corporate, as: 'corporate', attributes: ['id'],
            include: [{ model: db.User, as: 'user', where: { id: userId }, attributes: ['uuid'] }]
          },
          { model: db.Doctor, as: 'doctor', attributes: ['id'],
            include: [{ model: db.User, as: 'user', where: { id: userId }, attributes: ['uuid'] }]
          }
        ]
      })

      req.context.logger.info('authorizeFileAccess: ', { message: 'this is the record: ', context: { record: JSON.stringify(record) } })

      if (!record) {
        return next(RecordNotFoundErrorType)
      }

      // Check if file exists in the record
      if (!record.fileName || !record.fileUuid) {
        return next(RecordNotFoundErrorType)
      }

      // Verify ownership - check all possible user ID fields
      const isOwner =
        record.individualId === userId ||
        record.corporateId === userId ||
        record.doctorId === userId

      if (!isOwner) {
        return next(InvalidAccessErrorType)
      }

      // Get the user UUID from the related entity
      const userUuid = record.individual?.user?.uuid || record.corporate?.user?.uuid || record.doctor?.user?.uuid

      if (!userUuid) {
        return next(RecordNotFoundErrorType)
      }

      // Attach file info to request for controller to use
      req.fileInfo = {
        fileName: record.fileName,
        fileUuid: record.fileUuid,
        userUuid: userUuid,
        record: record
      }

      next()
    } catch (err) {
      req.context.logger.error('authorizeFileAccess: ', { message: `catch error message: ${err.message}`, exception: err })

      next(err)
    }
  }
}
