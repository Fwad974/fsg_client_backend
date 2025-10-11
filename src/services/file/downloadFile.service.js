import ServiceBase from '../../libs/serviceBase'
import path from 'path'
import fs from 'fs/promises'

/**
 * Provides service to download file with security checks
 * @export
 * @class DownloadFileService
 * @extends {ServiceBase}
 */
export default class DownloadFileService extends ServiceBase {
  async run () {
    const {
      logger
    } = this.context

    logger.info('DownloadFileService: ', { message: 'this is the args: ', context: { args: JSON.stringify(this.args) } })

    const { fileName, fileUuid, userUuid } = this.args

    // Construct file path: downloads/private/{userUuid}/{fileUuid}/{fileName}
    const filePath = path.join(
      process.cwd(),
      'downloads',
      'private',
      userUuid,
      fileUuid,
      fileName
    )

    logger.info('DownloadFileService: ', { message: 'this is the filePath: ', context: { filePath: JSON.stringify(filePath) } })

    // Verify file exists
    try {
      await fs.access(filePath)
    } catch (error) {
      logger.error('DownloadFileService: ', { message: `this is the catch error message: ${error.message}`, exception: error })

      this.addError('RecordNotFoundErrorType')
      return
    }

    // Security: Prevent path traversal attacks
    const realPath = await fs.realpath(filePath)
    const allowedDir = await fs.realpath(
      path.join(process.cwd(), 'downloads', 'private')
    )

    logger.info('DownloadFileService: ', { message: 'this is the realPath and allowedDir: ', context: { realPath: JSON.stringify(realPath), allowedDir: JSON.stringify(allowedDir) } })

    if (!realPath.startsWith(allowedDir)) {
      this.addError('RecordNotFoundErrorType')
      return
    }

    return {
      filePath: realPath,
      fileName
    }
  }
}
