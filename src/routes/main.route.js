import { Router } from 'express'
import user from './user.route.js'
import session from './session.route.js'
import dashboard from './dashboard.route.js'
import request from './request.route.js'
import pack from './pack.route.js'
import location from './location.route.js'
import publicRoutes from './public.route.js'
import shoppingCart from './shopping-cart.route'
import payment from './payment.route'
import client from './client.route'
import clientSession from './client-session.route'
import validation from './validation.route'
// import subscription from './subscription.route'
import teacher from './teacher.route'
import lessons from './lesson.route'
import services from './service.route'
import invoices from './invoice.route'
import schedule from './schedule.route'

import shoppingCartMiddleware from '../middlewares/shopping-cart.middleware.js'
import sessionMiddleware from '../middlewares/session.middleware.js'

const router = Router()


// router.get('/', (req, res) => {
//     res.send('Bienvenido a la página principal');
//   });
router.use(sessionMiddleware)
router.use('/api', user)
router.use('/api', session)
router.use('/api', dashboard)
router.use('/api', pack)
// router.use('/api', subscription)
router.use('/api', teacher)
router.use('/api', lessons)
router.use('/api', services)
router.use('/api', invoices)
router.use('/api', schedule)

// TODO: ARREGLAR ESTA DE ACÁ EL FRONT DEBE FALLAR POR LA RUTA ???
router.use('/api', request)
router.use('/api', location)
router.use(shoppingCartMiddleware)
router.use(shoppingCart)
router.use(payment)
router.use(client)
router.use(clientSession)
router.use(validation)
router.use(publicRoutes)

// Panel routes
// router.use(sessionMiddleware);

export default router
