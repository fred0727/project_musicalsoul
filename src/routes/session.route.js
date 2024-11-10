import { Router } from 'express'
import SessionController from '../controllers/session.controller.js'

const router = Router()

router.post('/login', SessionController.login.bind(SessionController))
router.post('/logout', SessionController.logout.bind(SessionController))
router.get('/session', SessionController.getSession.bind(SessionController))
router.get('/', SessionController.renderLogin.bind(SessionController))

export default router
