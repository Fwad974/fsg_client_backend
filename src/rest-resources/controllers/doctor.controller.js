import { sendResponse } from '../../helpers/response.helpers'
import GetDoctorPatientsService from '../../services/doctor/getDoctorPatients.service'
import GetDoctorPatientsTestResultsService from '../../services/doctor/getDoctorPatientsTestResults.service'
import GetDoctorTestResultsService from '../../services/doctor/getDoctorTestResults.service'

/**
 * Doctor Controller for handling all the request of /doctor path
 *
 * @export
 * @class DoctorController
 */

export default class DoctorController {
  /**
   * It will return all patients for a doctor
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof DoctorController
   */
  static async getDoctorPatients (req, res, next) {
    try {
      const { result, successful, errors } = await GetDoctorPatientsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It will return all test results for doctor's patients
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof DoctorController
   */
  static async getDoctorPatientsTestResults (req, res, next) {
    try {
      const { result, successful, errors } = await GetDoctorPatientsTestResultsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It will return all test results for a doctor with patient user information
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof DoctorController
   */
  static async getDoctorTestResults (req, res, next) {
    try {
      const { result, successful, errors } = await GetDoctorTestResultsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
