import { Router } from 'express'
import LessonsController from '../controllers/lesson.controller.js'
import adminMiddleware from '../middlewares/admin.middleware.js'
import teacherMiddleware from '../middlewares/teacher.middleware'

const router = Router()

router.get('/lessons/', teacherMiddleware, (req, res, next) => {
  if (req.session.user.type === 'ADMIN') {
    return LessonsController.readMany.bind(LessonsController)(req, res, next)
  }
  return LessonsController.readManyForTeacher.bind(LessonsController)(
    req,
    res,
    next
  )
})

router.put(
  '/lessons',
  teacherMiddleware,
  LessonsController.updateOneAndNotify.bind(LessonsController)
)
router.put(
  '/lessons/cancel',
  teacherMiddleware,
  LessonsController.updateOneCancel.bind(LessonsController)
)
router.put(
  '/lessons/complete',
  teacherMiddleware,
  LessonsController.updateOneComplete.bind(LessonsController)
)
router.post('/lessons/', teacherMiddleware, (req, res, next) => {
  if (req.session.user.type === 'ADMIN') {
    return LessonsController.createOneAndNofity.bind(LessonsController)(
      req,
      res,
      next
    )
  }
  return LessonsController.createOneFromTeacherAndNofity.bind(
    LessonsController
  )(req, res, next)
})
router.delete(
  '/lessons',
  adminMiddleware,
  LessonsController.deleteOneAndNotify.bind(LessonsController)
)

export default router
