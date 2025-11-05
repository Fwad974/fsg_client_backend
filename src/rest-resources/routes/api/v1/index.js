import express from 'express'

import userRoutes from './user.routes'
import transactionRoutes from './transactions.routes'
import DashboardRoutes from './dashboard.routes'
import doctorRoutes from './doctor.routes'
import corporateRoutes from './corporate.routes'
import fileRoutes from './file.routes'
import paymentRoutes from './payment.routes'
import testCategoryRoutes from './testCategory.routes'

const v1Router = express.Router()

v1Router.use('/user', userRoutes)
v1Router.use('/transaction', transactionRoutes)
v1Router.use('/dashboard', DashboardRoutes)
v1Router.use('/doctor', doctorRoutes)
v1Router.use('/corporate', corporateRoutes)
v1Router.use('/file', fileRoutes)
v1Router.use('/payment', paymentRoutes)
v1Router.use('/test-category', testCategoryRoutes)

export default v1Router
