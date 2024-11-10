import { Router } from 'express'
import PaymentController from '../controllers/payment.controller'
import adminMiddleware from '../middlewares/admin.middleware'

const router = Router()

router.get('/pago-procesado', PaymentController.ok.bind(PaymentController))

router.get('/pago-ko', PaymentController.ko.bind(PaymentController))

router.get(
  '/actualizar-metododo-pago',
  PaymentController.updatePaymentMethod.bind(PaymentController)
)

router.get(
  '/api/payments',
  adminMiddleware,
  PaymentController.readMany.bind(PaymentController)
)

router.get(
  '/api/payments/subscription',
  adminMiddleware,
  PaymentController.readWithSubscription.bind(PaymentController)
)

router.post(
  '/api/payments',
  adminMiddleware,
  PaymentController.trySubscriptionPayment.bind(PaymentController)
)

router.post(
  '/api/payments/allSubscriptions',
  adminMiddleware,
  PaymentController.doSubscriptionPayments.bind(PaymentController)
)

export default router
