import GetMyReportStatusService from '../../services/patient/getMyReportStatus.service'
import GetMyReportStatusPresenter from '../../presenters/patient/getMyReportStatus.presenter'
import { sendResponse } from '../../helpers/response.helpers'

export default class PatientController {
  static async getMyReportStatus (req, res, next) {
    try {
      const { result, successful, errors } = await GetMyReportStatusService.execute(req.query, req.context, GetMyReportStatusPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
