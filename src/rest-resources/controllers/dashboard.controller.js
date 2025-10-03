import { sendResponse } from '../../helpers/response.helpers'
import GetAllTestResultService from '../../services/dashboard/getAllTestResult.service'

/**
 * Dashboard Controller for handling all the request of /dashboard path
 *
 * @export
 * @class UserController
 */

export default class DashboardController {
  /**
   * It will return all users test results
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async getAllTestResult (req, res, next) {
    try {
      const { result, successful, errors } = await GetAllTestResultService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
