import GetDocStatusOverviewService from '../../services/dashboard/getDocStatusOverview.service'
import GetKpiOverviewService from '../../services/dashboard/getKpiOverview.service'
import GetTestCategoryDistributionService from '../../services/dashboard/getTestCategoryDistribution.service'
import GetDocStatusOverviewPresenter from '../../presenters/dashboard/getDocStatusOverview.presenter'
import GetKpiOverviewPresenter from '../../presenters/dashboard/getKpiOverview.presenter'
import GetTestCategoryDistributionPresenter from '../../presenters/dashboard/getTestCategoryDistribution.presenter'
import { sendResponse } from '../../helpers/response.helpers'

export default class DashboardController {
  static async getDocStatusOverview (req, res, next) {
    try {
      const { result, successful, errors } = await GetDocStatusOverviewService.execute(req.query, req.context, GetDocStatusOverviewPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getKpiOverview (req, res, next) {
    try {
      const { result, successful, errors } = await GetKpiOverviewService.execute(req.query, req.context, GetKpiOverviewPresenter)
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
