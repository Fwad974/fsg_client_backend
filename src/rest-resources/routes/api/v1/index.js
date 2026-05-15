import express from 'express'

import userRoutes from './user.routes'
import doctorRoutes from './doctor.routes'
import corporateRoutes from './corporate.routes'
import patientRoutes from './patient.routes'
import reportsRoutes from './reports.routes'
import testsRoutes from './tests.routes'
import contactRequestsRoutes from './contactRequests.routes'
import dashboardRoutes from './dashboard.routes'

const v1Router = express.Router()

v1Router.use('/user', userRoutes)
v1Router.use('/corporate', corporateRoutes)
v1Router.use('/doctor', doctorRoutes)
v1Router.use('/patient', patientRoutes)
v1Router.use('/reports', reportsRoutes)
v1Router.use('/tests', testsRoutes)
v1Router.use('/contact-requests', contactRequestsRoutes)
v1Router.use('/dashboard', dashboardRoutes)

export default v1Router
