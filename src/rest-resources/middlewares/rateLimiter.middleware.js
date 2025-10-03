import { rateLimit } from 'express-rate-limit'

const rateLimiter = rateLimit({
  windowMs: 15 * 60000,
  max: 10,
  message: 'Too many requests, please try again later',
  headers: true
})
/**
 *
 * @memberof Rest Middleware
 * @export
 * @name rateLimiterMiddleware
 * @param {*} req
 * @param {*} res
 * @param {*} next
 */
export default async function rateLimiterMiddleware (req, res, next) {
  rateLimiter(req, res, next)
}
