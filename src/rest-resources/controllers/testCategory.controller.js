import { sendResponse } from '../../helpers/response.helpers'
import GetTestCatalogService from '../../services/testCategory/getTestCatalog.service'
import GetTestCatalogPresenter from '../../presenters/testCategory/getTestCatalog.presenter'

export default class TestCategoryController {
  static async getTestCatalog (req, res, next) {
    try {
      const { result, successful, errors } = await GetTestCatalogService.execute(req.query, req.context, GetTestCatalogPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
