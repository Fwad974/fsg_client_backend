export const isMobileUserAgent = (userAgent) => {
  const mobileRegex = /Mobile|Android|iPhone|iPad|iPod|Windows Phone/i
  return mobileRegex.test(userAgent)
}
