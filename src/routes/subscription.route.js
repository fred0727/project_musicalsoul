import { Router } from 'express'
import SubscriptionController from '../controllers/subscription.controller.js'
import adminMiddleware from '../middlewares/admin.middleware.js'
import teacherMiddleware from '../middlewares/teacher.middleware.js'

const router = Router()

router.get('/subscriptions', teacherMiddleware, (req, res, next) => {
  if (req.session.user.type === 'ADMIN') {
    return SubscriptionController.readMany.bind(SubscriptionController)(
      req,
      res,
      next
    )
  }
  SubscriptionController.readManyForTeacher.bind(SubscriptionController)(
    req,
    res,
    next
  )
})

router.delete(
  '/subscriptions/',
  adminMiddleware,
  SubscriptionController.deleteOneAndNotify.bind(SubscriptionController)
)

router.put(
  '/subscriptions/assign-teacher',
  adminMiddleware,
  SubscriptionController.updateOneAssignTeacher.bind(SubscriptionController)
)

router.put(
  '/subscriptions/toggle-status',
  adminMiddleware,
  SubscriptionController.updateOneStatus.bind(SubscriptionController)
)

router.put(
  '/subscriptions/assign-service',
  adminMiddleware,
  SubscriptionController.updateOneAssignService.bind(SubscriptionController)
)

export default router
