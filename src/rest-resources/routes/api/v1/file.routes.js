import express from 'express'
import FileDownloadController from '../../../controllers/fileDownload.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import { authorizeFileAccess } from '../../../middlewares/fileAuthorization.middleware'

const fileRoutes = express.Router()

/**
 * @route GET /api/v1/file/download/:fileUuid
 * @desc Download file by UUID with authorization
 * @access Private (requires authentication and file ownership)
 */
fileRoutes.route('/download/:fileUuid')
  .get(
    contextMiddleware(),
    authenticationMiddleWare,
    authorizeFileAccess('TestResult'),
    FileDownloadController.downloadFile
  )

export default fileRoutes
