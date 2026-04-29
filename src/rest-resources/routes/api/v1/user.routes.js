import express from 'express'
import UserController from '../../../controllers/user.controller'
import authenticationMiddleWare from '../../../middlewares/authentication.middleware'
import contextMiddleware from '../../../middlewares/context.middleware'
import rateLimiterMiddleware from '../../../middlewares/rateLimiter.middleware'
import requestValidationMiddleware from '../../../middlewares/requestValidation.middleware'
import responseValidationMiddleware from '../../../middlewares/responseValidation.middleware'

const postForgotPasswordSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      phone: { type: 'string' }
    },
    required: ['phone']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const postSignupSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      email: { type: 'string' },
      phone: {
        type: 'string',
        pattern: '^\\+?[0-9]{10,15}$',
        minLength: 10,
        maxLength: 16
      },
      phoneCode: { type: 'string' },
      password: {
        type: 'string',
        pattern: '^[A-Za-z0-9\\-~#^()\\[\\]{}"\':;<,>.\\|!@*$]{5,50}$',
        minLength: 5
      },
      userName: { type: 'string' },
      userType: {
        type: "string",
        enum: ["individual", "corporate", "doctor"]
      },
      emiratesId: { type: 'string' }
    },
    required: ['phone', 'password', 'userName', 'firstName', 'lastName', 'emiratesId']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        uuid: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const postLoginSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      userNameOrPhone: { type: 'string' },
      password:        { type: 'string' },
      accountType:     { type: 'string', enum: ['corporate', 'patient', 'doctor'] }
    },
    required: ['userNameOrPhone', 'password', 'accountType']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        message: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            uuid: { $ref: '/user.json#/properties/uuid' },
            firstName: { $ref: '/user.json#/properties/firstName' },
            lastName: { $ref: '/user.json#/properties/lastName' },
            userName: { $ref: '/user.json#/properties/userName' },
            email: { $ref: '/user.json#/properties/email' },
            phone: { $ref: '/user.json#/properties/phone' },
            role: { $ref: '/user.json#/properties/role' }
          }
        }
      },
      required: ['accessToken', 'message']
    }
  }
}

const postChangePasswordSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      oldPassword: { type: 'string' },
      newPassword: {
        type: 'string',
        minLength: 5,
        // pattern: '(?=.*[A-Z])'
        pattern: '^[A-Za-z0-9\\-~#^()\\[\\]{}"\':;<,>.\\|!@*$]{5,50}$'
      }
    },
    required: ['oldPassword', 'newPassword']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const putUpdatePhoneSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      countryCode: {
        type: 'string',
        pattern: '^[0-9]+$',
        minLength: 1,
        maxLength: 3
      },
      newPhone: {
        type: 'string',
        pattern: '^[0-9]+$',
        minLength: 5,
        maxLength: 15
      }
    },
    required: ['countryCode', 'newPhone']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        countryCode: { $ref: '/user.json#/properties/countryCode' },
        phone: { $ref: '/user.json#/properties/phone' },
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const verifySmsOtpSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      otp: { type: 'string' },
      userNameOrPhone: { type: 'string' },
    },
    required: ['otp', 'userNameOrPhone']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const resendSmsOtpSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      userNameOrPhone: { type: 'string' }
    },
    required: ['userNameOrPhone']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const postLogoutSchemas = {
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        uuid: { type: 'string' }
      },
      required: ['message']
    }
  }
}

const userRoutes = express.Router()

userRoutes
  .route('/login')
  .post(
    contextMiddleware(true),
    requestValidationMiddleware(postLoginSchemas),
    UserController.login,
    responseValidationMiddleware(postLoginSchemas)
  )

userRoutes
  .route('/signup')
  .post(
    contextMiddleware(true),
    requestValidationMiddleware(postSignupSchemas),
    UserController.signup,
    responseValidationMiddleware(postSignupSchemas)
  )

  userRoutes
  .route('/logout')
  .post(
    contextMiddleware(true),
    authenticationMiddleWare,
    UserController.logout,
    responseValidationMiddleware(postLogoutSchemas)
  )

userRoutes
  .route('/forgot-password')
  .post(
    contextMiddleware(true),
    rateLimiterMiddleware,
    requestValidationMiddleware(postForgotPasswordSchemas),
    UserController.forgotPassword,
    responseValidationMiddleware(postForgotPasswordSchemas)
  )

  userRoutes
  .route('/change-password')
  .put(
    contextMiddleware(true),
    rateLimiterMiddleware,
    authenticationMiddleWare,
    requestValidationMiddleware(postChangePasswordSchemas),
    UserController.changePassword,
    responseValidationMiddleware(postChangePasswordSchemas)
  )

userRoutes
  .route('/update-phone')
  .put(
    contextMiddleware(true),
    rateLimiterMiddleware,
    authenticationMiddleWare,
    requestValidationMiddleware(putUpdatePhoneSchemas),
    UserController.updatePhone,
    responseValidationMiddleware(putUpdatePhoneSchemas)
  )

userRoutes
  .route('/verify-phone-otp')
  .put(
    contextMiddleware(true),
    requestValidationMiddleware(verifySmsOtpSchemas),
    UserController.verifySmsOtpSignup,
    responseValidationMiddleware(verifySmsOtpSchemas)
  )

  userRoutes
  .route('/resend-sms-otp')
  .put(
    contextMiddleware(true),
    requestValidationMiddleware(resendSmsOtpSchemas),
    UserController.resendSmsOtpSignup,
    responseValidationMiddleware(resendSmsOtpSchemas)
  )

export default userRoutes
