import { sendResponse } from '../../helpers/response.helpers'
import GetTotalBets from '../../services/system/getTotalBets.service'
import GetAllCmsService from '../../services/system/getAllCms.service'
import GetBannersService from '../../services/system/getBanners.service'
import StartNuxGameService from '../../services/system/startNuxGame.service'
import GetAllCurrencyService from '../../services/system/getAllCurrency.service'
import GetGameDetailsService from '../../services/system/getGameDetails.service'
import GetGameSettingsService from '../../services/system/getGameSettings.service'
import GetTotalWinningAmount from '../../services/system/getTotalWinningAmount.service'
import GetGameThemeSettingsService from '../../services/system/getAllGameThemeSettings.service'
import IncreaseAffiliateCountService from '../../services/system/increaseAffiliateCount.service'
import GetCustomGameTransactionsService from '../../services/system/getCustomGameTransactions.service'
import GetSportsBookTransactionsService from '../../services/system/getSportsBookTransactions.service'
import GetWinnersService from '../../services/system/getWinners.service'
import GetChatRulesService from '../../services/system/getChatRules.service'
import GetPromotionService from '../../services/system/getPromotions.service'
import GetAnnouncementService from '../../services/system/getAnnouncement.service'
import GetLiveBetService from '../../services/system/getLiveBets.service'
import GetGameTypesService from '../../services/system/getGameTypes.service'
import GetAllPromoBannerService from '../../services/system/getAllPromoBanner.service'
import GetKycConfigService from '../../services/system/getKycConfig.service'

/**
 * System Controller for handling all the request of /system path
 *
 * @export
 * @class SystemController
 */
export default class SystemController {
  /**
   * Controller method to handle the request for fetch Banner of tenant
   *
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof SystemController
   */
  static async getBanners (req, res, next) {
    try {
      const { result, successful, errors } = await GetBannersService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Controller method to handle the request for fetch enabled games of a tenant
   *
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof SystemController
   */
  static async getGameSettings (req, res, next) {
    try {
      const { result, successful, errors } = await GetGameSettingsService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Controller method to handle the request for fetch all the currencies
   *
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof SystemController
   */
  static async getAllCurrency (req, res, next) {
    try {
      const { result, successful, errors } = await GetAllCurrencyService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Controller method to handle the request for fetch all the Games
   *
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof SystemController
   */
  static async getGameDetails (req, res, next) {
    try {
      const { result, successful, errors } = await GetGameDetailsService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  //
  /**
   * Controller method to handle the request for update click count on affiliate stats
   *
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof SystemController
   */
  static async increaseAffiliateCount (req, res, next) {
    try {
      const { result, successful, errors } = await IncreaseAffiliateCountService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
  * Controller method to get system total winning amount
  *
  * @static
  * @param {object} req - object contains all the request params sent from the client
  * @param {object} res - object contains all the response params sent to the client
  * @param {function} next - function to execute next middleware
  * @memberof SystemController
  */
  static async getTotalWinningAmount (req, res, next) {
    try {
      const { result, successful, errors } = await GetTotalWinningAmount.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
  * Controller method to get system total bets
  *
  * @static
  * @param {object} req - object contains all the request params sent from the client
  * @param {object} res - object contains all the response params sent to the client
  * @param {function} next - function to execute next middleware
  * @memberof SystemController
  */
  static async getTotalBets (req, res, next) {
    try {
      const { result, successful, errors } = await GetTotalBets.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
* Controller method to get all game theme settings
*
* @static
* @param {object} req - object contains all the request params sent from the client
* @param {object} res - object contains all the response params sent to the client
* @param {function} next - function to execute next middleware
* @memberof SystemController
*/
  static async getAllGameThemeSettings (req, res, next) {
    try {
      const { result, successful, errors } = await GetGameThemeSettingsService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
* Controller method to get all cms
*
* @static
* @param {object} req - object contains all the request params sent from the client
* @param {object} res - object contains all the response params sent to the client
* @param {function} next - function to execute next middleware
* @memberof SystemController
*/
  static async getAllCms (req, res, next) {
    try {
      const context = { ...req.context, headers: req.headers }
      const { result, successful, errors } = await GetAllCmsService.execute(req.body, context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
* Controller method to start game from nux games
*
* @static
* @param {object} req - object contains all the request params sent from the client
* @param {object} res - object contains all the response params sent to the client
* @param {function} next - function to execute next middleware
* @memberof SystemController
*/
  static async startNuxGame (req, res, next) {
    try {
      const { result, successful, errors } = await StartNuxGameService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
* Controller method to get Custom game transactions
* @static
* @param {object} req - object contains all the request params sent from the client
* @param {object} res - object contains all the response params sent to the client
* @param {function} next - function to execute next middleware
* @memberof SystemController
*/
  static async getCustomGameTransactions (req, res, next) {
    try {
      const { result, successful, errors } = await GetCustomGameTransactionsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
* Controller method to get Sports Book transactions
* @static
* @param {object} req - object contains all the request params sent from the client
* @param {object} res - object contains all the response params sent to the client
* @param {function} next - function to execute next middleware
* @memberof SystemController
*/
  static async getSportsBookTransactions (req, res, next) {
    try {
      const { result, successful, errors } = await GetSportsBookTransactionsService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
* Controller method to get Winners list
* @static
* @param {object} req - object contains all the request params sent from the client
* @param {object} res - object contains all the response params sent to the client
* @param {function} next - function to execute next middleware
* @memberof SystemController
*/
  static async getWinners (req, res, next) {
    try {
      const { result, successful, errors } = await GetWinnersService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getLiveBets (req, res, next) {
    try {
      const { result, successful, errors } = await GetLiveBetService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getChatRules (req, res, next) {
    try {
      const { result, successful, errors } = await GetChatRulesService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getPromotions (req, res, next) {
    try {
      const context = { ...req.context, headers: req.headers }
      const { result, successful, errors } = await GetPromotionService.execute(req.query, context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getAnnouncement (req, res, next) {
    try {
      const context = { ...req.context, headers: req.headers }
      const { result, successful, errors } = await GetAnnouncementService.execute(req.query, context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Controller method to retrieve a list of game category types (e.g., "ear", "BetsBy", "original").
   * @param {import('express').Request} req - Express request object
   * @param {import('express').Response} res - Express response object
   * @param {Function} next - Express next middleware function
   *
   * @returns {Promise<void>} Responds to the client with the category types or forwards error to error handler
   */
  static async getGameTypes (req, res, next) {
    try {
      const { result, successful, errors } = await GetGameTypesService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  static async getPromoBanners (req, res, next) {
    try {
      const { result, successful, errors } = await GetAllPromoBannerService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * Controller method to get KYC configuration settings
   * Returns KYC active status and withdrawal steps required
   * @static
   * @param {object} req - object contains all the request params sent from the client
   * @param {object} res - object contains all the response params sent to the client
   * @param {function} next - function to execute next middleware
   * @memberof SystemController
   */
  static async getKycConfig (req, res, next) {
    try {
      const { result, successful, errors } = await GetKycConfigService.execute(req.query, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
