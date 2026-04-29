import GetDoctorPatientsService from '../../services/doctor/getDoctorPatients.service'
import GetDoctorPatientsReportService from '../../services/doctor/getDoctorPatientsReport.service'
import GetDoctorPatientsPresenter from '../../presenters/doctor/getDoctorPatients.presenter'
import GetDoctorPatientsReportPresenter from '../../presenters/doctor/getDoctorPatientsReport.presenter'
import { sendResponse } from '../../helpers/response.helpers'

export default class DoctorController {
  static async getPatients (req, res, next) {
    try {
      const { result, successful, errors } = await GetDoctorPatientsService.execute(req.query, req.context, GetDoctorPatientsPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getPatientsReport (req, res, next) {
    try {
      const { result, successful, errors } = await GetDoctorPatientsReportService.execute(req.query, req.context, GetDoctorPatientsReportPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
