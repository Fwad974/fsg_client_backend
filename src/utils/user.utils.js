export const getUserTokenCacheKey = (userId) => {
  return `UserToken-${userId}`
}

export const getServerSeedCacheKey = (userId) => {
  return `ServerSeed-${userId}`
}

export const getProviderUserTokenCacheKey = (userId) => {
  return `ProviderUserToken-${userId}`
}

export const getLightningBoardCacheKey = () => {
  return 'LightningBoardDetails'
}

export const getUserIpAddressCacheKey = (userId) => {
  return `IpAddress-${userId}`
}

export const getUserAgentCacheKey = (userId) => {
  return `UserAgent-${userId}`
}
