import { Router } from 'express'
import DistrictController from '../controllers/district.controller.js'
import NeightborhoodController from '../controllers/neighborhood.controller.js'

const router = Router()

router.get(
  '/districts/:id',
  DistrictController.readMany.bind(DistrictController)
)
router.get(
  '/neighborhoods/:id',
  NeightborhoodController.readMany.bind(NeightborhoodController)
)

export default router
