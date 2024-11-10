import { Router } from 'express'
import ServiceController from '../controllers/service.controller.js'

const router = Router()

router.get('/services', ServiceController.readMany.bind(ServiceController))

router.post('/services/teacher', ServiceController.updateTeacherServices.bind(ServiceController))

export default router
