import JSONBigInt from 'json-bigint'

export const verifyBodyParser = (req, res, buf) => {
  if (req.url.search('/api/v1/smartsoft/Deposit') || (req.url.search('/api/v1/smartsoft/Withdraw'))) {
    try {
      req.rawString = buf.toString()
      req.rawBody = JSONBigInt.parse(buf.toString())
    } catch (e) {
      try {
        req.rawBody = JSON.parse(buf.toString())
      } catch (e) {
        req.rawBody = JSON.parse('{}')
      }
    }
  }
}
