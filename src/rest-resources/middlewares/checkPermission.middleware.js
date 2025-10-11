import UserRepository from '../../infrastructure/repositories/userRepository'
import { PermissionDeniedErrorType } from '../../libs/errorTypes'
import { PERMISSION_TYPE, REQUEST_TYPE } from '../../libs/permissions'

export const checkPermission = async (req, res, next) => {
  try {
    const endPoint = (req.baseUrl + req.route.path).split('/').splice(3).join('/')
    let action = REQUEST_TYPE[req.method]
    const module = PERMISSION_TYPE.aliases[endPoint]

    let hasPermission = false

    const {
      auth: { id: userId }
    } = req.context

    const userDetails = await UserRepository.findByIdWithRoles(userId, {
      attributes: ['id'],
      roleAttributes: ['permission']
    })

    // To merge Role permission and extra permission given to user
    const permissions = { ...userDetails.role?.permission }

    // Update Action
    if (endPoint.endsWith('update-status')) action = REQUEST_TYPE.TOGGLE

    hasPermission = permissions?.[module]?.includes(action)

    if (hasPermission) return next()

    return next(PermissionDeniedErrorType)
  } catch {
    return next(PermissionDeniedErrorType)
  }
}
