import { Router } from 'express'
import ClientController from '../controllers/client.controller'
import adminMiddleware from '../middlewares/admin.middleware'
import teacherMiddleware from '../middlewares/teacher.middleware'

const router = Router()

router.post(
  '/registro',
  ClientController.createOneAndNotify.bind(ClientController)
)

router.get(
  '/registro',
  ClientController.renderClientSignup.bind(ClientController)
)

router.get(
  '/olvide-contrasena',
  ClientController.renderForgotPassword.bind(ClientController)
)

router.post(
  '/olvide-contrasena',
  ClientController.forgotPassword.bind(ClientController)
)

router.get(
  '/reestablecer',
  ClientController.renderRestorePassword.bind(ClientController)
)

router.post(
  '/reestablecer',
  ClientController.restorePassword.bind(ClientController)
)

router.post(
  '/questionnaire',
  ClientController.completeQuestionnaire.bind(ClientController)
)

router.get(
  '/api/clients',
  teacherMiddleware,
  ClientController.readMany.bind(ClientController)
)

// TODO: DEFINE COMO QUEDAN ESTAS RUTAS, SI VAN DENTRO DE /API O NO
// router.post(
//   '/api/clients',
//   adminMiddleware,
//   ClientController.deleteOne.bind(ClientController)
// )

router.delete(
  '/api/clients',
  adminMiddleware,
  ClientController.deleteOne.bind(ClientController)
)
export default router
