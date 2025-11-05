import { sendResponse } from '../../helpers/response.helpers'
import GetCorporatePatientsService from '../../services/corporate/getCorporatePatients.service'
import GetCorporateDoctorsService from '../../services/corporate/getCorporateDoctors.service'
import GetCorporatePatientsTestResultsService from '../../services/corporate/getCorporatePatientsTestResults.service'
import GetCorporateTestResultsService from '../../services/corporate/getCorporateTestResults.service'

export default class CorporateController {
  static async getCorporatePatients (req, res, next) {
    try {
      const { result, successful, errors } = await GetCorporatePatientsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getCorporateDoctors (req, res, next) {
    try {
      const { result, successful, errors } = await GetCorporateDoctorsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getCorporatePatientsTestResults (req, res, next) {
    try {
      const { result, successful, errors } = await GetCorporatePatientsTestResultsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getCorporateTestResults (req, res, next) {
    try {
      const { result, successful, errors } = await GetCorporateTestResultsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
