import { sendResponse } from '../../helpers/response.helpers'
import GetAllTestCategoriesService from '../../services/testCategory/getAllTestCategories.service'

/**
 * TestCategory Controller for handling all the request of /test-categories path
 *
 * @export
 * @class TestCategoryController
 */
export default class TestCategoryController {
  /**
   * Get all test categories with optional search and pagination
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof TestCategoryController
   */
  static async getAll (req, res, next) {
    try {
      const { result, successful, errors } = await GetAllTestCategoriesService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
