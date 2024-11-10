import { Router } from 'express'
import PublicController from '../controllers/public.controller.js'

const router = Router()

router.all(
  '/:page?/',
  PublicController.renderAll.bind(PublicController)
)

export default router
