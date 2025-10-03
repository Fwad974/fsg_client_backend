import express from 'express'

import userRoutes from './user.routes'
import transactionRoutes from './transactions.routes'
import DashboardRoutes from './dashboard.routes'

const v1Router = express.Router()

v1Router.use('/user', userRoutes)
v1Router.use('/transaction', transactionRoutes)
v1Router.use('/dashboard', DashboardRoutes)

export default v1Router
