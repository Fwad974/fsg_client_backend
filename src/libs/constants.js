// SOCKET RELATED

export const SOCKET_NAMESPACES = {
  DEMO: '/demo',
  WALLET: '/wallet',
  CRASH_GAME: '/crash-game',
  LIVE_WINS: '/live-wins',
  LIVE_CHATS: '/live-chats',
  ROLLER_COASTER_GAME: '/roller-coaster-game',
  ANNOUNCEMENT: '/announcement',
  CRYPTO_FUTURES: '/crypto-futures',
  MINE_GAME: '/mine-game',
  PLINKO_GAME: '/plinko-game',
  KYC_VERIFICATION: '/kyc-verification',
  BONUS: '/bonus',
  RANKING_LEVEL: '/ranking-level',
  WAGERING: '/wagering',
  GAME_STATUS: '/game-status',
  CASINO: '/casino'
}

export const SOCKET_EMITTERS = {
  DEMO_HELLO_WORLD: SOCKET_NAMESPACES.DEMO + '/helloWorld',
  WALLET_USER_WALLET_BALANCE: SOCKET_NAMESPACES.WALLET + '/userWalletBalance',
  CRASH_GAME_PLACED_BETS: SOCKET_NAMESPACES.CRASH_GAME + '/placedBets',
  LIVE_WINS_VIEW: SOCKET_NAMESPACES.LIVE_WINS + '/viewLiveWins',
  LIVE_CHATS_VIEW: SOCKET_NAMESPACES.LIVE_CHATS + '/viewLiveChats',
  ROLLER_COASTER_GAME_PLACED_BETS: SOCKET_NAMESPACES.ROLLER_COASTER_GAME + '/placedBets',
  ROLLER_COASTER_GAME_CLOSED_BETS: SOCKET_NAMESPACES.ROLLER_COASTER_GAME + '/closedBets',
  CRYPTO_FUTURES_CLOSED_BETS: SOCKET_NAMESPACES.CRYPTO_FUTURES + '/closedBets',
  LIVE_ANNOUNCEMENT: SOCKET_NAMESPACES.ANNOUNCEMENT + '/liveAnnouncement',
  MINE_GAME_LIVE_STATS: SOCKET_NAMESPACES.MINE_GAME + '/liveStats',
  PLINKO_GAME_LIGHTNING_BOARD: SOCKET_NAMESPACES.PLINKO_GAME + '/lightningBoard',
  KYC_VERIFICATION_STATUS: SOCKET_NAMESPACES.KYC_VERIFICATION + '/kycVerificationStatus',
  BONUS_AMOUNT: SOCKET_NAMESPACES.BONUS + '/bonusAmount',
  UPDATE_RANKING_LEVEL: SOCKET_NAMESPACES.RANKING_LEVEL + '/updateRankingLevel',
  WAGERING_COMPLETION: SOCKET_NAMESPACES.WAGERING + '/wageringComplete',
  GAME_STATUS_CHANGED: SOCKET_NAMESPACES.GAME_STATUS + '/changed',
  CASINO_NOTIFICATION: SOCKET_NAMESPACES.CASINO + '/casinoNotify'
}

export const SOCKET_LISTENERS = {
  DEMO_HELLO_WORLD: SOCKET_NAMESPACES.DEMO + '/helloWorld'
}

export const SOCKET_ROOMS = {
  WALLET_USER: SOCKET_NAMESPACES.WALLET + '/user', // append id of the user like this /user:1 for one to one,
  DEMO_USER: SOCKET_NAMESPACES.DEMO + '/demo', // append id of the demo like this /demo:1 for one to one,
  BONUS_USER: SOCKET_NAMESPACES.BONUS + '/user',
  USER_RANKING_LEVEL: SOCKET_NAMESPACES.RANKING_LEVEL + '/userRank',
  USER_KYC_VERIFICATION: SOCKET_NAMESPACES.KYC_VERIFICATION + '/userKyc',
  WAGERING_USER: SOCKET_NAMESPACES.WAGERING + '/userWagering',
  CASINO_USER: SOCKET_NAMESPACES.CASINO + 'user'
}
// SOCKET RELATED


export const MIN_WAGER_AMOUNT_FOR_CHAT = 1
export const MAX_CHAT_CHARACTERS = 200
export const CURRENCY_FOR_CASINO = '2'
export const CONVERT_CURRENCY_FROM = 'btc'
export const CONVERT_CURRENCY_TO = 'usd'
export const CURRENCY_CODE_FOR_CASINO = 'USD'

export const TRANSACTION_TYPES = {
  DEPOSIT: 'deposit',
  BONUS_DEPOSIT: 'bonusDeposit',
  REFERRAL_REWARDS: 'referralRewards',
  DAILY: 'daily',
  WITHDRAW: 'withdraw',
  REFUND: 'refund',
  BET: 'bet',
  WIN: 'win',
  ROLLBACK: 'rollback',
  EAR_WIN: 'casino-win',
  EAR_BET: 'casino-bet',
  SEND: 'send',
  RECEIVE: 'receive',
  FLAT_FEE: 'flat-fee',
  PNL_FEE: 'pnl-fee',
  FEE: 'fee',
  AFFILIATE: 'affiliate',
  BUY_CRYPTO: 'buy'
}

export const VENDORS = {
  MAILGUN: 'MAILGUN',
  SENDGRID: 'SENDGRID'
}

export const BONUS_TYPES = {
  REGISTRATION: 'registration',
  DAILY: 'daily',
  MONTHLY: 'monthly',
  WEEKLY: 'weekly',
  DEPOSIT: 'deposit',
  FREESPINS: 'freespins',
  REFERRAL: 'referral',
  WEEKLY_SPLITTED: 'weeklysplitted',
  CASHBACK: 'cashback',
  OTHER: 'other'
}

export const BONUS_STATUS = {
  ACTIVE: 'active',
  CLAIMED: 'claimed',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  FORFEIT: 'forfeit',
  READY_TO_CLAIM: 'readyToClaim'
}

export const WITHDRAW_REQUEST_STATUS = {
  PENDING: 'pending',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  APPROVED: 'approved',
  AUTO_APPROVED: 'auto_approved'
}
export const WHITELIST_CONTRACT = {
  WAITING_FOR_APPROVAL: 'WAITING_FOR_APPROVAL',
  APPROVED: 'APPROVED',
  CANCELLED: 'CANCELLED',
  REJECTED: 'REJECTED',
  FAILED: 'FAILED'
}

export const DEPOSIT_BONUS_TRANSACTION_STATUS = {
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending'
}


export const GAMES = {
  DICE: 'dice',
  CRASH: 'crash',
  MINE: 'mine',
  BLACKJACK: 'blackjack',
  HILO: 'hi-lo',
  FLIP_COIN: 'flip-coin'
}

export const BET_RESULT = {
  WON: 'won',
  LOST: 'lost',
  CANCELLED: 'cancelled'
}

export const BET_STATUS = {
  CASHED_OUT: 'cashedOut',
  PLACED: 'placed',
  BUSTED: 'busted'
}

export const CRASH_GAME_STATE = {
  STARTED: '1',
  ON_HOLD: '2',
  GRAPH_FINISHED: '3',
  STOPPED: '0'
}

export const ROLLER_COASTER_GAME_STATE = {
  STARTED: '1',
  STOPPED: '0'
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

export const EAR_TRANSACTION_TYPE = {
  DEBIT: 'debit',
  CREDIT: 'credit',
  REFUND: 'refund',
  FREE_GAME: 'free games'
}

export const EAR_ACTION_TYPE = {
  WIN: 'casino-win',
  BET: 'casino-bet',
  REFUND: 'casino-refund',
  BONUS_WIN: 'casino-bonus-win',
  BONUS_BET: 'casino-bonus-bet',
  DEBIT: 'debit',
  CREDIT: 'credit'
}

export const AUTO_RATE = 1.01

export const ALLOWED_FILE_TYPES = ['png', 'tiff', 'tif', 'jpg', 'jpeg']

export const DEFAULT_GAME_ID = {
  CRASH: 1,
  HILO: 2,
  MINE: 3,
  FLIP_COIN: 4,
  PLINKO: 5,
  ROLLER_COASTER: 6,
  CRYPTO_FUTURES: 7
}

export const EMAIL_TEMPLATE = {
  VERIFY_URL: 'verify/'
}

export const AFFILIATE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE'
}

export const SETTLEMENT_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending'
}

export const TOP_BET_TYPE = {
  BIGGEST_WIN: 'BIGGEST_WIN',
  HUGE_WIN: 'HUGE_WIN',
  MULTIPLIER: 'MULTIPLIER'
}

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

export const DEPOSIT_BONUS_STATUS = {
  TRUE: true,
  FALSE: false
}

export const REGISTRATION_BONUS_STATUS = {
  TRUE: true,
  FALSE: false
}

export const NO_OF_DEPOSITS = {
  DEPOSIT_1: 'deposit1',
  DEPOSIT_2: 'deposit2',
  DEPOSIT_3: 'deposit3'
}

// Mine Game Constants
export const MAX_MINE_COUNT = 24

export const MIN_MINE_COUNT = 1

export const MIN_TILE_COUNT = 1

export const MAX_TILE_COUNT = 25

// Dice Game Constant

export const TOTAL_CARDS = 312

export const BLACKJACK = 21

export const BLACKJACK_RESULT = {
  PLAYER_BUST: 'player_bust',
  DEALER_BUST: 'dealer_bust',
  PLAYER_WIN: 'player_win',
  DEALER_WIN: 'dealer_win',
  PUSH: 'push',
  PLAYERS_BLACKJACK: 'players_blackjack',
  DEALERS_BLACKJACK: 'dealers_blackjack'
}

export const WAGERING_STATUS = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED',
  REQUESTED: 'REQUESTED',
  RE_REQUESTED: 'RE-REQUESTED',
  ACTIVE: 'ACTIVE',
  COMPLETE: 'COMPLETE'
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

export const SPECIAL_BONUS_TYPES = {
  nonCash: 'non_cash',
  bonus: 'bonus'
}

export const AUTO_WITHDRAW_REQUEST_SETTING_STATUS = {
  TRUE: true,
  FALSE: false
}

export const DATE_OPTION = {
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month'
}

export const BREAK_TYPE = {
  TAKE_A_BREAK: 'TAKE_A_BREAK',
  SELF_EXCLUSION: 'SELF_EXCLUSION'
}

export const LIMIT_OPTION = {
  WAGER: 'wager',
  LOSS: 'loss',
  DEPOSIT: 'deposit',
  SESSION: 'session'
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

export const FIREBLOCKS_ACCOUNT_TYPE = {
  VAULT_ACCOUNT: 'VAULT_ACCOUNT',
  ONE_TIME_ADDRESS: 'ONE_TIME_ADDRESS',
  FUNDING: 'Funding',
  EXTERNAL: 'External'
}

export const FIREBLOCKS_TRANSACTION_TYPE = {
  TRANSFER: 'TRANSFER',
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  GAS_FEE: 'gas-station'
}

export const GAS_TRANSACTION_STATUS = {
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  PENDING: 'PENDING'
}

export const GAS_TRANSACTION_PURPOSE = {
  GENERATE_ADDRESS: 'generateAddress',
  TRANSFER_TO_FUNDING: 'transferToFunding'
}

export const FIREBLOCKS_TRANSACTION_NOTE = {
  GAS_TRANSACTION: 'gas-transaction',
  WITHDRAW: 'withdraw-transaction',
  SWEEP_TO_TREASURY: 'sweep-to-treasury',
  SWEEP_TOKEN_TO_TREASURY: 'sweep-token-to-treasury',
  SWEEP_COIN_TO_TREASURY: 'sweep-coin-to-treasury'
}

export const FIREBLOCKS_TRANSACTION_STATUS = {
  CONFIRMING: 'CONFIRMING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  BLOCKED: 'BLOCKED',
  CANCELLED: 'CANCELLED',
  SUBMITTED: 'SUBMITTED',
  QUEUED: 'QUEUED',
  PENDING_SIGNATURE: 'PENDING_SIGNATURE',
  PENDING_AUTHORIZATION: 'PENDING_AUTHORIZATION'
}

export const FIREBLOCKS_TRANSACTION_SUB_STATUS = {
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS'
}

export const FIREBLOCKS_ERROR_CODES = {
  INVALID_SIGNATURE: -1,
  FUTURE_IAT: -12,
  CONTRACT_ASSET_NAME_NOT_EXISTS: 221,
  CREATE_VAULT_ACCOUNT_FAILED: 1002,
  ASSET_ALREADY_EXISTS: 1026,
  NOT_TESTNET_ASSET: 1034,
  ADD_TOKEN_MISSING_BASE_ASSET: 1038,
  INSUFFICIENT_FUNDS: 1039,
  CONTRACT_WALLET_NAME_EXISTS: 1351,
  SOURCE_BALANCE_ERROR: 1402,
  LOW_GAS_FEE: 1441,
  INSUFFICIENT_GAS_FEE: 1909,
  CONTRACT_ASSET_NAME_EXISTS: 'invalid_code_test',
  ERR_BAD_REQUEST: 'ERR_BAD_REQUEST'
}

export const PAYMENTIQ_LEVEL = {
  INITIALIZE_LEVEL: 'initialize',
  VERIFY_USER_LEVEL: 'verify_user',
  AUTHORIZE_LEVEL: 'authorize',
  TRANSFER_LEVEL: 'transfer',
  CANCEL_LEVEL: 'cancel'
}

export const GAME_CATEGORY_ID = {
  ORIGINAL: 4002,
  BETBY: 4001
}

export const MAP_NATIVE_ASSET_TO_RPC = {
  ETH: 'ether_rpc_url',
  SOL: 'solana_rpc_url',
  BNB_BSC: 'bsc_rpc_url',
  MATIC_POLYGON: 'polygon_rpc_url'
}

export const CHECK_EVM_OR_NONE_EVM = {
  ETH: 'EVM',
  SOL: 'SOL',
  BNB_BSC: 'EVM',
  MATIC_POLYGON: 'EVM'
}

export const FIREBLOCKS_FEE_LEVEL = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW'
}

export const CURRENCY_MAPPER = {
  LTC_TEST: 'LTC',
  BTC_TEST: 'BTC',
  ETH_TEST5: 'ETH',
  SOL_TEST: 'SOL',
  XLM_TEST: 'XLM',
  XLM_USDC_T_CEKS: 'USDC',
  ALGO_USDC_2V6G: 'USDC',
  ALGO_TEST: 'ALGO',
  USDT_ERC20: 'USDC',
  SOL_USDT_EWAY: 'USDC',
  SOL_USDC_PTHX: 'USDC',
  BNB_BSC: 'BNB'
}

export const ONE_TIME_PASSWORD = {
  ENCRYPTED_KEY: 'oneTimePassword:encrypted'
}

export const FIREBLOCKS_JOB_IDS = {
  JOB_TRANSFER_USER_ASSETS_TO_FUNDING: 'TransferUserAssetsToFunding',
  JOB_TRANSFER_NATIVE_ASSETS_TO_FUNDING: 'TransferNativeAssetsToFunding'
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
  CORPORATE: 'corporate'
}

export const CONTACT_REQUEST_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
}
