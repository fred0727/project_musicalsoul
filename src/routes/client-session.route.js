import { Router } from 'express'
import ClientSessionController from '../controllers/client-session.controller.js'

const router = Router()

router.post(
  '/ingresar',
  ClientSessionController.login.bind(ClientSessionController)
)
router.post(
  '/ingresar',
  ClientSessionController.login.bind(ClientSessionController)
)
router.get(
  '/ingresar',
  ClientSessionController.renderClientLogin.bind(ClientSessionController)
)
router.get(
  '/area',
  ClientSessionController.renderArea.bind(ClientSessionController)
)
router.post(
  '/cerrar-sesion',
  ClientSessionController.logout.bind(ClientSessionController)
)

export default router
