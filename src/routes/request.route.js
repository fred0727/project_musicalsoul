import { Router } from 'express'
import RequestController from '../controllers/request.controller.js'

const router = Router()

router.get(
  '/requests',
  RequestController.readManyParsed.bind(RequestController)
)
router.post(
  '/contact',
  RequestController.createContactRequest.bind(RequestController)
)

export default router
