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
      }
    },
    required: ['phone', 'password', 'userName', 'firstName', 'lastName']
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
      uuid: { type: 'string' },
      userNameOrPhone: { type: 'string' },
      password: { type: 'string' },
      userToken: { type: 'number' },
      userType: {
        type: "string",
        enum: ["individual", "corporate", "doctor", "payment"]
      }
    },
    required: ['userNameOrPhone', 'password', 'userType']
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

const putUpdateProfileSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      userName: {
        type: 'string',
        pattern: "^[A-Za-z0-9-~#^()\\[\\]{}\"':;<,>./|\\\\_]{5,50}$",
        minLength: 2,
        maxLength: 50
      },
      firstName: {
        type: 'string',
        pattern: '^[a-zA-Z]*$',
        minLength: 2,
        maxLength: 50
      },
      lastName: {
        type: 'string',
        pattern: '^[a-zA-Z]*$',
        minLength: 2,
        maxLength: 50
      },
      dateOfBirth: {
        type: 'string'
      },
      signInIp: {
        type: 'string'
      },
      gender: {
        type: 'string',
        enum: ['male', 'female', 'other']
      },
      phone: { type: 'string' },
      phoneCode: { type: 'string' }
    }
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        userName: { $ref: '/user.json#/properties/userName' },
        firstName: { $ref: '/user.json#/properties/firstName' },
        lastName: { $ref: '/user.json#/properties/lastName' },
        dateOfBirth: { $ref: '/user.json#/properties/dateOfBirth' },
        phone: { $ref: '/user.json#/properties/phone' },
        phoneCode: { $ref: '/user.json#/properties/phoneCode' }
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

const postContactRequestSchemas = {
  bodySchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255
      },
      address: {
        type: 'string',
        maxLength: 500
      },
      contactNumber: {
        type: 'string',
        pattern: '^\\+?[0-9\\s\\-\\(\\)]{7,20}$',
        maxLength: 20
      },
      organization: {
        type: 'string',
        maxLength: 100
      },
      message: {
        type: 'string',
        minLength: 1,
        maxLength: 1000
      }
    },
    required: ['name', 'email', 'message']
  },
  responseSchema: {
    default: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        requestId: { type: 'string' }
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
  .route('/update-profile')
  .put(
    contextMiddleware(true),
    rateLimiterMiddleware,
    authenticationMiddleWare,
    requestValidationMiddleware(putUpdateProfileSchemas),
    UserController.updateProfile,
    responseValidationMiddleware(putUpdateProfileSchemas)
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

  userRoutes
  .route('/contact-request')
  .post(
    contextMiddleware(true),
    authenticationMiddleWare,
    requestValidationMiddleware(postContactRequestSchemas),
    UserController.createContactRequest,
    responseValidationMiddleware(postContactRequestSchemas)
  )

export default userRoutes
