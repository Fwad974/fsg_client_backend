import { StatusCodes } from 'http-status-codes'

// common errors for all the backend services

export const RequestInputValidationErrorType = {
  name: 'RequestInputValidationError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Please check the request data',
  errorCode: 3001
}

export const ResponseValidationErrorType = {
  name: 'ResponseInputValidationError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: false,
  description:
    'Response validation failed please refer json schema of response',
  errorCode: 3002
}

export const SocketRequestInputValidationErrorType = {
  name: 'SocketRequestInputValidationError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Please check the request data',
  errorCode: 3003
}

export const SocketResponseValidationErrorType = {
  name: 'SocketResponseValidationError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: false,
  description:
    'Response validation of socket failed please refer json schema of response',
  errorCode: 3004
}

export const InternalServerErrorType = {
  name: 'InternalServerError',
  statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  isOperational: true,
  description: 'Internal Server Error',
  errorCode: 3005
}

export const InvalidSocketArgumentErrorType = {
  name: 'InvalidSocketArgumentError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description:
    'Please provide, proper arguments eventName, [payloadObject], and [callback]',
  errorCode: 3006
}

export const InvalidCredentialsErrorType = {
  name: 'InvalidCredentials',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The credentials provided are incorrect.',
  errorCode: 3007
}



export const InvalidSessionErrorType = {
  name: 'InvalidSession',
  statusCode: StatusCodes.UNAUTHORIZED,
  isOperational: true,
  description: 'The session is invalid. Please log in again.',
  errorCode: 3009
}

export const InvalidAccessErrorType = {
  name: 'InvalidAccess',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'You do not have permission to access this resource.',
  errorCode: 3010
}

export const NonOperationalErrorType = {
  name: 'NonOperationalError',
  statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  isOperational: false,
  description: 'An error occurred on the server.',
  errorCode: 3011
}



export const InvalidActionErrorType = {
  name: 'InvalidAction',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The requested action is invalid.',
  errorCode: 3013
}

export const SessionAlreadyStartedErrorType = {
  name: 'SessionAlreadyStarted',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The session has already started.',
  errorCode: 3014
}

export const SessionNotStartedErrorType = {
  name: 'SessionNotStarted',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The session has not started.',
  errorCode: 3015
}



export const InvalidGameTypeErrorType = {
  name: 'InvalidGameTypeError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No settings found for the specified game type.',
  errorCode: 3017
}

export const InvalidGameRoundErrorType = {
  name: 'InvalidGameRoundError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No game found for the provided details.',
  errorCode: 3018
}

export const NoRoundRunningErrorType = {
  name: 'NoRoundRunningError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No active game round at the moment.',
  errorCode: 3019
}

export const NoPlacedBetFoundErrorType = {
  name: 'NoPlacedBetFoundError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No placed bets were found.',
  errorCode: 3020
}

export const NoWalletFoundErrorType = {
  name: 'NoWalletFoundError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The specified wallet was not found.',
  errorCode: 3021
}
export const NotEnoughBalanceErrorType = {
  name: 'NotEnoughBalanceError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Insufficient balance to complete the transaction.',
  errorCode: 3022
}
export const AutoRateIsInvalidErrorType = {
  name: 'AutoRateIsInvalidError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The auto rate is outside the acceptable limits.',
  errorCode: 3023
}
export const BetAmountIsNotInLimitErrorType = {
  name: 'BetAmountIsNotInLimitError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The bet amount is outside the allowed limits.',
  errorCode: 3024
}
export const EmailNotFoundErrorType = {
  name: 'EmailNotFound',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'The specified email address was not found.',
  errorCode: 3025
}

export const UserNotAbove18YearsErrorType = {
  name: 'UserNotAbove18YearsError',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'User is not above 18 years old.',
  errorCode: 3026
}

export const InvalidBlockchainAddressErrorType = {
  name: 'InvalidBlockchainAddress',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The blockchain address is invalid.',
  errorCode: 3027
}

export const AddressMismatchErrorType = {
  name: 'AddressMismatch',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The provided address does not match the recovered address.',
  errorCode: 3028
}

export const NonceLifetimeExpiredErrorType = {
  name: 'NonceLifetimeExpired',
  statusCode: StatusCodes.UNAUTHORIZED,
  isOperational: true,
  description: 'The nonce lifetime has expired.',
  errorCode: 3029
}



export const AccountNotActiveErrorType = {
  name: 'AccountNotActive',
  statusCode: StatusCodes.UNAUTHORIZED,
  isOperational: true,
  description: 'The account is not active.',
  errorCode: 3031
}

export const LoginTokenRequireErrorType = {
  name: 'LoginTokenRequire',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Two-factor authentication (2FA) OTP is required.',
  errorCode: 3032
}

export const UserAlreadyExistsErrorType = {
  name: 'UserAlreadyExists',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The user already exists.',
  errorCode: 3033
}

export const InvalidVerificationTokenErrorType = {
  name: 'InvalidVerificationToken',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The verification token has expired.',
  errorCode: 3034
}

export const UserNotActiveErrorType = {
  name: 'UserNotActive',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The user is blocked. Please contact admin.',
  errorCode: 3035
}

export const FileUploadFailedErrorType = {
  name: 'FileUploadFailed',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The image upload failed.',
  errorCode: 3036
}

export const EmailAlreadyVerifiedErrorType = {
  name: 'EmailAlreadyVerified',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'The email address has already been verified.',
  errorCode: 3037
}

export const InvalidReferralCodeErrorType = {
  name: 'InvalidReferralCode',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The referral code is invalid.',
  errorCode: 3038
}

export const InvalidAffiliateCodeErrorType = {
  name: 'InvalidAffiliateCode',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The affiliate code is invalid.',
  errorCode: 3039
}

export const RecordNotFoundErrorType = {
  name: 'RecordNotFound',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'The specified record was not found.',
  errorCode: 3040
}

export const WithdrawalRequestAlreadyPendingErrorType = {
  name: 'WithdrawalRequestAlreadyPending',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'A withdrawal request is already pending.',
  errorCode: 3040
}

export const WalletDoesNotBelongToUserErrorType = {
  name: 'WalletDoesNotBelongToUser',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The wallet does not belong to this user.',
  errorCode: 3041
}

export const BetAlreadyInProgressErrorType = {
  name: 'BetAlreadyInProgress',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'A bet is already in progress.',
  errorCode: 3042
}

export const ServerSeedNotFoundErrorType = {
  name: 'ServerSeedNotFoundErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The server seed was not found. Please log in again.',
  errorCode: 3043
}

export const InvalidMineCountErrorType = {
  name: 'InvalidMineCountErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The mine count must be between 1 and 24.',
  errorCode: 3044
}

export const InvalidTileErrorType = {
  name: 'InvalidTileErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The tile must be between 1 and 25.',
  errorCode: 3045
}

export const MineTileAlreadyOpenedErrorType = {
  name: 'MineTileAlreadyOpenedErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'This tile has already been selected. Choose another tile.',
  errorCode: 3046
}

export const NoOpenedTileFoundErrorType = {
  name: 'NoOpenedTileFoundErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No opened tiles were found for this bet.',
  errorCode: 3047
}

export const MineGamePreviousRoundNotCompletedErrorType = {
  name: 'MineGamePreviousRoundNotCompletedErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The previous round of the Mine Game is not completed.',
  errorCode: 3048
}

export const BlackJackPreviousRoundNotCompletedErrorType = {
  name: 'BlackJackPreviousRoundNotCompletedErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The previous round of the Black Jack game is not completed.',
  errorCode: 3049
}

export const BlackJackGameDoubleBetErrorType = {
  name: 'BlackJackGameDoubleBetErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Unable to double the bet in Black Jack.',
  errorCode: 3050
}

export const BlackJackGameSplitBetErrorType = {
  name: 'BlackJackGameSplitBetErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Unable to split the bet in Black Jack.',
  errorCode: 3051
}

export const BlackJackGameSplitHitErrorType = {
  name: 'BlackJackGameSplitHitErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Unable to draw a card in Black Jack.',
  errorCode: 3052
}

export const FavoriteGameExistsErrorType = {
  name: 'FavoriteGameExistsErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The game is already marked as favorite.',
  errorCode: 3053
}

export const FavoriteGameNotFoundErrorType = {
  name: 'FavoriteGameNotFoundErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The favorite game was not found.',
  errorCode: 3054
}

export const TransactionAlreadyPendingErrorType = {
  name: 'TransactionAlreadyPendingErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'A transaction is already pending.',
  errorCode: 3055
}

export const UserHasNoActiveBonusErrorType = {
  name: 'UserHasNoActiveBonusErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The user has no active bonus.',
  errorCode: 3057
}

export const BonusExpiredErrorType = {
  name: 'BonusExpiredErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The bonus has expired.',
  errorCode: 3058
}

export const UserHasAlreadyActivatedBonusWageringErrorType = {
  name: 'UserHasAlreadyActivatedBonusWageringErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The user has already activated bonus wagering.',
  errorCode: 3059
}

export const InvalidRoundHashErrorType = {
  name: 'InvalidRoundHashErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The round hash is incorrect.',
  errorCode: 3060
}

export const InvalidSignatureErrorType = {
  name: 'InvalidSignatureErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The signature is incorrect.',
  errorCode: 3061
}

export const UserHasNoBonusAmountToClaimErrorType = {
  name: 'UserHasNoBonusAmountToClaimErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The user has no bonus amount to claim.',
  errorCode: 3062
}

export const BonusNotExistsErrorType = {
  name: 'BonusNotExistsErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The bonus was not found.',
  errorCode: 3063
}

export const DemoNotExistErrorType = {
  name: 'DemoNotExistErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Demo mode is not available for this game.',
  errorCode: 3064
}



export const ExceedChatLengthErrorType = {
  name: 'ExceedChatLengthErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The message length exceeds the allowed limit.',
  errorCode: 3066
}

export const ChatMinAmountErrorType = {
  name: 'ChatMinAmountErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'A minimum wager amount is required to chat.',
  errorCode: 3067
}

export const EmailAlreadyExist = {
  name: 'EmailAlreadyExist',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'The email address already exists.',
  errorCode: 3068
}

export const InvalidStopLossPriceType = {
  name: 'InvalidStopLossPrice',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The stop loss price is invalid. Please check the amount.',
  errorCode: 3069
}

export const SessionTimeLimitErrorType = {
  name: 'SessionTimeLimit',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The session time limit must be between 1 and 24 hours.',
  errorCode: 3070
}

export const TakeABreakDayErrorType = {
  name: 'LimitsError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The break duration must be between 1 and 30 days.',
  errorCode: 3071
}

export const NoUserLimitFoundErrorType = {
  name: 'NoUserLimitFound',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No limit settings found for the user.',
  errorCode: 3072
}

export const ChatRuleNotFoundTypeError = {
  name: 'ChatRuleNotFound',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No chat rules were found.',
  errorCode: 3073
}

export const PromotionNotFoundErrorType = {
  name: 'PromotionNotFound',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The promotion ID is invalid.',
  errorCode: 3074
}

export const AnnouncementNotFoundErrorType = {
  name: 'AnnouncementNotFound',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The announcement ID is invalid.',
  errorCode: 3075
}

export const GenerateAddressErrorType = {
  name: 'GenerateAddressErrorType',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'The address generation failed.',
  errorCode: 3076
}

export const InvalidSeedsErrorType = {
  name: 'InvalidSeedsError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The provided seeds are not associated with any bets.',
  errorCode: 3077
}

export const MineGameAutoBetNotCompletedErrorType = {
  name: 'MineGameAutoBetNotCompletedErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The auto bet in the Mine Game is not completed.',
  errorCode: 3078
}

export const UserBlockedForChatErrorType = {
  name: 'UserBlockedForChat',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'You are blocked from chatting. Please contact admin.',
  errorCode: 3079
}

export const ChatNotFoundErrorType = {
  name: 'ChatNotFound',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'No chat messages were found.',
  errorCode: 3080
}

export const AccountDisableErrorType = {
  name: 'AccountDisable',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Your account is disabled. Please contact admin.',
  errorCode: 3081
}

export const AffiliatesAlreadyExistsErrorType = {
  name: 'AffiliatesAlreadyExists',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The referral already exists.',
  errorCode: 3082
}

export const AffiliatesNotExistsErrorType = {
  name: 'AffiliatesNotExists',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The referral does not exist.',
  errorCode: 3083
}

export const OtpIncorrectErrorType = {
  name: 'OtpIncorrect',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'OTP is incorrect.',
  errorCode: 3084
}

export const OtpNotInCacheErrorType = {
  name: 'OtpNotInCache',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'OTP is not in Cache.',
  errorCode: 3084
}

export const RegisteredUsersCountExceededErrorType = {
  name: 'RegisteredUsersCountExceeded',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'There are too many users registered.',
  errorCode: 3085
}

export const MoonpaySignatureIsMissingErrorType = {
  name: 'MoonpaySignatureIsMissingErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Moonpay signature is missing.',
  errorCode: 3086
}

export const WithdrawalFailedInFireblocksErrorType = {
  name: 'WithdrawalFailedInFireblocks',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The withdrawal process failed due to a third-party error.',
  errorCode: 3087
}

export const PreviousOpenBetExistErrorType = {
  name: 'PreviousOpenBetExistErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'there is an already open bet',
  errorCode: 3088
}

export const WithdrawCallbackFailed = {
  name: 'WithdrawCallbackFailed',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'User wallet not found.',
  errorCode: 3089
}

export const TransactionCallbackFailed = {
  name: 'TransactionCallbackFailed',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Transaction callback failed.',
  errorCode: 3090
}

export const TickPriceDoseNotExists = {
  name: 'TickPriceDoseNotExists',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Placing the bet failed. This might happen if the coin is no longer supported or if there was an issue retrieving its price.',
  errorCode: 3091
}

export const UserWalletDoseNotExists = {
  name: 'UserWalletDoseNotExists',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Please deposit funds to your wallet before making bets.',
  errorCode: 3092
}

export const GetSupportedAssetsFailedByFireblocksErrorType = {
  name: 'GetSupportedAssetsFailedByFireblocksErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Failed to retrieve the list of supported assets from Fireblocks.',
  errorCode: 3094
}

export const WalletAmountLessThenBetAmount = {
  name: 'WalletAmountLessThenBetAmount',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'bet amount is less then wallet amount',
  errorCode: 3095
}

export const AddToWhitelistAddressFailed = {
  name: 'AddToWhitelistAddressFailed',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The provided address could not be added to the whitelist.',
  errorCode: 3096
}

export const CreateWhitelistContractUser = {
  name: 'CreateWhitelistContractUser',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Could not create a whitelist contract user.',
  errorCode: 3097
}

export const GetUserWhiteListWallet = {
  name: 'GetUserWhiteListWallet',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Can not get users white list wallet.',
  errorCode: 3098
}

export const UserWhitelistAsset = {
  name: 'UserWhitelistAsset',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Failed to get users whitelist asset.',
  errorCode: 3099
}

export const FailedToCreateWhiteListWalletOrAsset = {
  name: 'FailedToCreateWhiteListWalletOrAsset',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Failed to create whitelist wallet or asset.',
  errorCode: 3100
}

export const AxiosRequest = {
  name: 'AxiosRequest',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'error while making axios request',
  errorCode: 3101
}

export const WalletAssetNotApproved = {
  name: 'WalletAssetNotApproved',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Asset status is not approved',
  errorCode: 3102
}

export const WalletAssetAlreadyExists = {
  name: 'WalletAssetAlreadyExists',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'You can only have one address per asset and one address already exists for the selected asset.',
  errorCode: 3103
}

export const AffiliateCodeNotFind = {
  name: 'AffiliateCodeNotFind',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'affiliate code not found',
  errorCode: 3094
}

export const EmailNotExistsErrorType = {
  name: 'EmailNotExists',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'Invalid email address.',
  errorCode: 3095
}
export const PasswordExpired = {
  name: 'PasswordExpired',
  statusCode: StatusCodes.INSUFFICIENT_SPACE_ON_RESOURCE,
  isOperational: true,
  description: 'Password expired, please reset it.',
  errorCode: 3096
}

export const FireblocksDepositTransaction = {
  name: 'FireblocksDepositTransaction',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'create deposit failed',
  errorCode: 3098
}

export const AffiliatesSettlementNotExistsErrorType = {
  name: 'AffiliatesSettlementNotExistsErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'affiliate settlement record does not exist.',
  errorCode: 3099
}

export const CurrencyNotFoundError = {
  name: 'CurrencyNotFoundError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'currency was not found. Ensure you are using a valid currency code.',
  errorCode: 3103
}

export const WalletNotFoundError = {
  name: 'WalletNotFoundError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'wallet could not be found. Please check your account and try again',
  errorCode: 3104
}

export const CurrencyNotWithdrawableErrorType = {
  name: 'CurrencyNotWithdrawableErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The currency is not withdrawable.',
  errorCode: 3105
}

export const NumbersNotAllowed = {
  name: 'NumbersNotAllowed',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Numbers are not allowed. Please enter letters only.',
  errorCode: 3106
}

export const NameTooShort = {
  name: 'NameTooShort',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'First name and Last name must be at least 2 characters.',
  errorCode: 3107
}

export const UserNotFound = {
  name: 'UserNotFound',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'User not found',
  errorCode: 3106
}

export const FireblocksSignatureIsMissingErrorType = {
  name: 'FireblocksSignatureIsMissingErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Fireblocks signature is missing.',
  errorCode: 3107
}

export const UnsupportedAlgorithmAuthentication = {
  name: 'UnsupportedAlgorithmAuthentication',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Unsupported Algorithm Authentication.',
  errorCode: 3108
}

export const InvalidApiKey = {
  name: 'InvalidApiKey',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'invalid API-KEY',
  errorCode: 3109
}

export const MissingApiKey = {
  name: 'MissingApiKey',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'API-KEY is required',
  errorCode: 3110
}

export const ProfileIdRequired = {
  name: 'ProfileIdRequired',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'profile id is required',
  errorCode: 3111
}

export const BetbyPayloadIsMissingErrorType = {
  name: 'BetbyPayloadIsMissingErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Betby payload Is Missing.',
  errorCode: 3112
}

export const InvalidReferralCodeValidationError = {
  name: 'InvalidReferralCode',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Invalid referral code.',
  errorCode: 3113
}

export const ReferralAlreadyExistsErrorType = {
  name: 'ReferralAlreadyExists',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'User already has a referral code.',
  errorCode: 3114
}

export const CircularReferralLoopErrorType = {
  name: 'CircularReferralLoopError',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Cannot create circular referral relationship.',
  errorCode: 3115
}

export const InvalidReferralOwnerCodeErrorType = {
  name: 'InvalidReferralOwnerCodeErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Referral code owner not found.',
  errorCode: 3115
}

export const paymentIqInsufficientBalance = {
  name: 'paymentIqInsufficientBalance',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Insufficient balance to complete the transaction.',
  errorCode: 3113
}

export const paymentIqBadRequest = {
  name: 'paymentIqBadRequest',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Bad Request.',
  errorCode: 3114
}

export const InvalidTelegramAuthentication = {
  name: 'InvalidTelegramAuthentication',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Invalid authentication signature.',
  errorCode: 3115
}

export const GasTransactionErrorType = {
  name: 'GasTransactionErrorType',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Error in estimate network fee.',
  errorCode: 3115
}

export const ThirdPartyFireBlocksResponseError = {
  name: 'ThirdPartyFireBlocksResponseError',
  statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
  isOperational: true,
  description: 'Fireblocks response failed.',
  errorCode: 3116
}

export const CrmTemplateNotFound = {
  name: 'CrmTemplateNotFound',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'The specified crm template does not exist.',
  errorCode: 3012
}

export const SoftswissSignatureIsMissingErrorType = {
  name: 'SoftswissSignatureIsMissingErrorType',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'signature is missing.',
  errorCode: 31013
}



export const SomethingWentWrongErrorType = {
  name: 'SomethingWentWrong',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'An unexpected error occurred.',
  errorCode: 0
}

export const InvalidTokenErrorType = {
  name: 'InvalidToken',
  statusCode: StatusCodes.UNAUTHORIZED,
  isOperational: true,
  description: 'The access token is missing or has expired.',
  errorCode: 1
}

export const UserNotExistsErrorType = {
  name: 'UserNotExists',
  statusCode: StatusCodes.NOT_FOUND,
  isOperational: true,
  description: 'The specified user does not exist.',
  errorCode: 2
}

export const PhoneNotVerifiedErrorType = {
  name: 'PhoneNotVerified',
  statusCode: StatusCodes.FORBIDDEN,
  isOperational: true,
  description: 'The phone number has not been verified.',
  errorCode: 'PHONE_NOT_VERIFIED'
}

export const OtpCodeInvalidErrorType = {
  name: 'OtpCodeInvalid',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'The otp code is invalid.',
  errorCode: 'INVALID_OTP'
}

export const UserNameOrPhoneAlreadyTakenErrorType = {
  name: 'UserNameOrPhoneAlreadyTaken',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'Account already exists with this username or phone number.',
  errorCode: 5
}

export const UserWithPhoneNumberErrorType = {
  name: 'UserWithPhoneNumber',
  statusCode: StatusCodes.BAD_REQUEST,
  isOperational: true,
  description: 'User by this phone number dose not exists.',
  errorCode: 6
}
