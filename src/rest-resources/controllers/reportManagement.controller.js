import DownloadReportService from '../../services/reportManagement/downloadReport.service'
import fileDownloadResponseHelper from '../../helpers/fileDownloadResponse.helper'

export default class ReportManagementController {
  static async downloadReport (req, res, next) {
    try {
      const { result, successful, errors } = await DownloadReportService.execute(req.query, req.context)
      fileDownloadResponseHelper({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
