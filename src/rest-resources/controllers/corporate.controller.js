import GetCorporatePatientsService from '../../services/corporate/getCorporatePatients.service'
import GetCorporatePatientsReportService from '../../services/corporate/getCorporatePatientsReport.service'
import GetCorporatePatientsPresenter from '../../presenters/corporate/getCorporatePatients.presenter'
import GetCorporatePatientsReportPresenter from '../../presenters/corporate/getCorporatePatientsReport.presenter'
import { sendResponse } from '../../helpers/response.helpers'

export default class CorporateController {
  static async getPatients (req, res, next) {
    try {
      const { result, successful, errors } = await GetCorporatePatientsService.execute(req.query, req.context, GetCorporatePatientsPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getPatientsReport (req, res, next) {
    try {
      const { result, successful, errors } = await GetCorporatePatientsReportService.execute(req.query, req.context, GetCorporatePatientsReportPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
