import { sendResponse } from '../../helpers/response.helpers'
import ChangePasswordService from '../../services/user/changePassword.service'
import ForgotPasswordService from '../../services/user/forgotPassword.service'
import LoginService from '../../services/user/login.service'
import SignupService from '../../services/user/signup.service'
import UpdatePhoneService from '../../services/user/updatePhone.service'
import UpdateProfileService from '../../services/user/updateProfile.service'
import VerifyEmailOtpService from '../../services/user/verifyUpdatedEmailToken.service'
import createContactRequestService from '../../services/user/createContactRequest.service'
import LogoutService from '../../services/user/logout.service'
import VerifySmsOtpSignupCodeService from '../../services/phone/verifySmsOtpSignup.service'
import ResendSmsOtpSignupService from '../../services/phone/resendSmsOtpSignup.service'

/**
 * User Controller for handling all the request of /user path
 *
 * @export
 * @class UserController
 */

export default class UserController {
  /**
   * It will allow a user to login
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async login (req, res, next) {
    try {
      const context = { ...req.context, headers: req.headers }
      const { result, successful, errors } = await LoginService.execute(req.body, context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
     * Controller method to handle the request for /signup path
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
     */
  static async signup (req, res, next) {
    try {
      const context = { ...req.context, headers: req.headers }
      const { result, successful, errors } = await SignupService.execute(req.body, context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

    /**
   * Let's the user logout
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async logout (req, res, next) {
    try {
      const { result, successful, errors } = await LogoutService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It is responsible for sending reset password token to the user's email
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async forgotPassword (req, res, next) {
    try {
      const context = { ...req.context, headers: req.headers }
      const { result, successful, errors } = await ForgotPasswordService.execute(req.body, context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

   /**
     * This will change password of the authenticated user.
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
     */
  static async changePassword (req, res, next) {
    try {
      const { result, successful, errors } = await ChangePasswordService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It is responsible for updating the user's phone of the authenticated user, and will
   * send otp on the user's new phone number.
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async updatePhone (req, res, next) {
    try {
      const { result, successful, errors } = await UpdatePhoneService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It is responsible for updating the user's profile of the authenticated user
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async updateProfile (req, res, next) {
    try {
      const { result, successful, errors } = await UpdateProfileService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It is responsible for updating the user's profile of the authenticated user
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async verifyEmailOtp (req, res, next) {
    try {
      const { result, successful, errors } = await VerifyEmailOtpService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It is responsible for updating the user's profile of the authenticated user
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async createContactRequest (req, res, next) {
    try {
      const { result, successful, errors } = await createContactRequestService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

    /**
   * It is responsible for updating the user's profile of the authenticated user
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async verifySmsOtpSignup (req, res, next) {
    try {
      const { result, successful, errors } = await VerifySmsOtpSignupCodeService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }

  /**
   * It is responsible for updating the user's profile of the authenticated user
    * @static
    * @param {object} req - object contains all the request params sent from the client
    * @param {object} res - object contains all the response params sent to the client
    * @param {function} next - function to execute next middleware
    * @memberof UserController
   */
  static async resendSmsOtpSignup (req, res, next) {
    try {
      const { result, successful, errors } = await ResendSmsOtpSignupService.execute(req.body, req.context)
      sendResponse({ req, res, next }, { result, successful, serviceErrors: errors })
    } catch (error) {
      next(error)
    }
  }
}
