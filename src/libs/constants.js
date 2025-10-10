// SOCKET RELATED

export const SOCKET_NAMESPACES = {
  DEMO: '/demo',
}

export const SOCKET_EMITTERS = {
  DEMO_HELLO_WORLD: SOCKET_NAMESPACES.DEMO + '/helloWorld',
}

export const SOCKET_LISTENERS = {
  DEMO_HELLO_WORLD: SOCKET_NAMESPACES.DEMO + '/helloWorld'
}

export const SOCKET_ROOMS = {
  DEMO_USER: SOCKET_NAMESPACES.DEMO + '/demo', // append id of the demo like this /demo:1 for one to one,
}
// SOCKET RELATED

export const MIN_WAGER_AMOUNT_FOR_CHAT = 1
export const MAX_CHAT_CHARACTERS = 200

export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  SEND: 'send',
  RECEIVE: 'receive'
}

export const VENDORS = {
  MAILGUN: 'MAILGUN',
  SENDGRID: 'SENDGRID'
}

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  BLOCKED: 'blocked',
  PENDING_AUTHORIZATION: 'pending_authorization'
}

export const PAYMENT_METHODS = {
  GAME: 'game',
  GOGOPAY: 'gogopayPayment',
  COINPAYMENT: 'coinPayment',
  BONUS: 'bonus',
  TIP: 'tipping',
  FIREBLOCKS: 'fireblock',
  AFFILIATE: 'affiliate',
  MOONPAY: 'moonpay',
  PAYMENTIQ: 'paymentiq',
  ADMIN: 'admin'
}

export const AUTO_RATE = 1.01

export const ALLOWED_FILE_TYPES = ['png', 'tiff', 'tif', 'jpg', 'jpeg']

export const EMAIL_TEMPLATE_CATEGORY = {
  WELCOME_ONBOARD: 'WELCOME_ONBOARD',
  WELCOME_AND_VERIFY_EMAIL: 'WELCOME_AND_VERIFY_EMAIL',
  RESET_PASSWORD: 'RESET_PASSWORD',
  UPDATE_EMAIL: 'UPDATE_EMAIL',
  CONFIRM_EMAIL: 'CONFIRM_EMAIL',
  WITHDRAW_REQUEST: 'WITHDRAW_REQUEST_INITIATED',
  WITHDRAW_REQUEST_FAILURE: 'WITHDRAW_REQUEST_FAILURE',
  DEPOSIT_CONFIRM: 'DEPOSIT_CONFIRM',
  BETA_SIGN_UP: 'BETA_SIGN_UP'
}

export const LOGIN_METHODS = {
  GOOGLE: 'google',
  TWITCH: 'twitch',
  METAMASK: 'metamask',
  SYSTEM: 'system',
  PHANTOM: 'phantom',
  TELEGRAM: 'telegram'
}

export const LINKED_METHODS = {
  TWITCH: 'twitch',
  TWITTER: 'twitter',
  STEAM: 'steam',
  TELEGRAM: 'telegram'
}

export const VERIFICATION_LEVEL = {
  SYSTEM_LEVEL: 'systemLevel',
  SUM_SUB_LEVEL1: 'basic-kyc-level',
  SUM_SUB_LEVEL2: 'liveness-test',
  SUM_SUB_LEVEL3: 'Proof-of-Address',
  SUM_SUB_LEVEL4: 'SOF'
}

export const SYSTEM_KYC_STATUS = {
  PENDING: 'pending',
  ON_HOLD: 'onHold',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  RE_REQUESTED: 're-requested'
}

export const PAYMENTIQ_LEVEL = {
  INITIALIZE_LEVEL: 'initialize',
  VERIFY_USER_LEVEL: 'verify_user',
  AUTHORIZE_LEVEL: 'authorize',
  TRANSFER_LEVEL: 'transfer',
  CANCEL_LEVEL: 'cancel'
}

export const EMAIL_URL_CONFIG = {
  WITHDRAWAL: '/account/withdrawals'
}

export const CATEGORY_MAP = {
  email: EMAIL_TEMPLATE_CATEGORY.CONFIRM_EMAIL,
  passwordReset: EMAIL_TEMPLATE_CATEGORY.RESET_PASSWORD,
  welcomeAndVerify: EMAIL_TEMPLATE_CATEGORY.WELCOME_AND_VERIFY_EMAIL
}

export const VERIFY_URL = {
  email: '/verify/',
  passwordReset: '/reset-password/',
  welcomeAndVerify: '/verify/'
}

export const GAME_TYPE = {
  CASINO: 'casino',
  SPORTS_BOOK: 'sports-book',
  original: 'original'
}

export const SALT_ROUNDS = 5

export const TOKEN_TYPE = {
  email: 'email',
  phone: 'phone',
  passwordReset: 'passwordReset',
  welcomeAndVerify: 'email'
}

export const USER_TYPES = {
  BOT: 'BOT',
  USER: 'USER',
  ADMIN: 'ADMIN',
  INDIVIDUAL: 'individual',
  CORPORATE: 'corporate',
  DOCTOR: 'doctor',
  PAYMENT: 'payment'
}

export const CONTACT_REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
}

export const USER_ROLE_TYPE = {
  INDIVIDUAL: 'individual',
  CORPORATE: 'corporate',
  PAYMENT: 'payment',
  DOCTOR: 'doctor'
}
