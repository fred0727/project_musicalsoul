import { Router } from 'express'
import DashboardController from '../controllers/dashboard.controller.js'

const router = Router()

router.get(
  '/dashboard',
  DashboardController.renderMain.bind(DashboardController)
)

export default router
