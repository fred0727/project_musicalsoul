import { Router } from 'express'
import ScheduleController from '../controllers/schedule.controller'

const router = Router()

router.get(
    '/schedule',
    ScheduleController.readManyWithTeacherSchedule.bind(ScheduleController)
)

router.post(
    '/schedule',
    ScheduleController.updateSchedule.bind(ScheduleController)
)

export default router
