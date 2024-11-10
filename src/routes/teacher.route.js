import { Router } from 'express'
import TeacherController from '../controllers/teacher.controller.js'
import adminMiddleware from '../middlewares/admin.middleware.js'
import teacherMiddleware from '../middlewares/teacher.middleware.js'

const router = Router()

router.get(
  '/teachers',
  adminMiddleware,
  TeacherController.readMany.bind(TeacherController)
)

router.get(
  '/teachers/all',
  adminMiddleware,
  TeacherController.readAll.bind(TeacherController)
)

router.get(
  '/teachers/:id',
  adminMiddleware,
  TeacherController.readOneFormat.bind(TeacherController)
)

router.post(
  '/teachers',
  adminMiddleware,
  TeacherController.createOneAndNotify.bind(TeacherController)
)

router.put(
  '/teachers/password',
  teacherMiddleware,
  TeacherController.updateOnePassword.bind(TeacherController)
)

router.put(
  '/teachers/cancelation-policy',
  teacherMiddleware,
  TeacherController.updateOneCancelationPolicy.bind(TeacherController)
)

router.put(
  '/teachers',
  teacherMiddleware,
  TeacherController.updateOne.bind(TeacherController)
)

router.put(
  '/teachers/promo',
  adminMiddleware,
  TeacherController.updateOnePromo.bind(TeacherController)
)

router.put(
  '/teachers/movility',
  teacherMiddleware,
  TeacherController.updateOneMovility.bind(TeacherController)
)

router.put(
  '/teachers/type-class',
  teacherMiddleware,
  TeacherController.updateOneTypeClass.bind(TeacherController)
)


router.put(
  '/teachers/validate',
  teacherMiddleware,
  TeacherController.validateTeacher.bind(TeacherController)
)

router.delete(
  '/teachers',
  adminMiddleware,
  TeacherController.deleteOne.bind(TeacherController)
)

export default router
