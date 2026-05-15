import GetDocStatusOverviewService from '../../services/dashboard/getDocStatusOverview.service'
import GetKpiOverviewService from '../../services/dashboard/getKpiOverview.service'
import GetTestCategoryDistributionService from '../../services/dashboard/getTestCategoryDistribution.service'
import GetPendingActionsService from '../../services/dashboard/getPendingActions.service'
import AcknowledgeAlertsService from '../../services/dashboard/acknowledgeAlerts.service'
import AcknowledgeAlertsDownloadService from '../../services/dashboard/acknowledgeAlertsDownload.service'
import GetDocStatusOverviewPresenter from '../../presenters/dashboard/getDocStatusOverview.presenter'
import GetKpiOverviewPresenter from '../../presenters/dashboard/getKpiOverview.presenter'
import GetTestCategoryDistributionPresenter from '../../presenters/dashboard/getTestCategoryDistribution.presenter'
import GetPendingActionsPresenter from '../../presenters/dashboard/getPendingActions.presenter'
import AcknowledgeAlertsPresenter from '../../presenters/dashboard/acknowledgeAlerts.presenter'
import AcknowledgeAlertsDownloadPresenter from '../../presenters/dashboard/acknowledgeAlertsDownload.presenter'
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

  static async getPendingActions (req, res, next) {
    try {
      const { result, successful, errors } = await GetPendingActionsService.execute(req.query, req.context, GetPendingActionsPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async acknowledgeAlerts (req, res, next) {
    try {
      const { result, successful, errors } = await AcknowledgeAlertsService.execute(req.body, req.context, AcknowledgeAlertsPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async acknowledgeAlertsDownload (req, res, next) {
    try {
      const { result, successful, errors } = await AcknowledgeAlertsDownloadService.execute(req.body, req.context, AcknowledgeAlertsDownloadPresenter)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
