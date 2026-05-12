import GetOverviewService from '../../services/dashboard/getOverview.service'
import GetTestCategoryDistributionService from '../../services/dashboard/getTestCategoryDistribution.service'
import GetOverviewPresenter from '../../presenters/dashboard/getOverview.presenter'
import GetTestCategoryDistributionPresenter from '../../presenters/dashboard/getTestCategoryDistribution.presenter'
import { sendResponse } from '../../helpers/response.helpers'

export default class DashboardController {
  static async getOverview (req, res, next) {
    try {
      const { result, successful, errors } = await GetOverviewService.execute(req.query, req.context, GetOverviewPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getTestCategoryDistribution (req, res, next) {
    try {
      const { result, successful, errors } = await GetTestCategoryDistributionService.execute(req.query, req.context, GetTestCategoryDistributionPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
