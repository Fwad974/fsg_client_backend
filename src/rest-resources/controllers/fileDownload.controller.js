import DownloadFileService from '../../services/file/downloadFile.service'
import fileDownloadResponseHelper from '../../helpers/fileDownloadResponse.helper'

/**
 * File Download Controller
 * @export
 * @class FileDownloadController
 */
export default class FileDownloadController {
  /**
   * Download file with authorization
   * @static
   * @param {object} req - request object
   * @param {object} res - response object
   * @param {function} next - next middleware function
   * @memberof FileDownloadController
   */
  static async downloadFile (req, res, next) {
    try {
      const { result, successful, errors } = await DownloadFileService.execute(req.fileInfo, req.context)
      fileDownloadResponseHelper({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
