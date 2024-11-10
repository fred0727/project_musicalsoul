import { Router } from 'express'
import PackController from '../controllers/pack.controller.js'

const router = Router()

// router.get(
//   "/districts/:id",
//   DistrictController.readMany.bind(DistrictController)
// );
router.post('/packs/', PackController.createOne.bind(PackController))
router.put('/packs/', PackController.updateOne.bind(PackController))
router.get('/packs/', PackController.readMany.bind(PackController))
router.delete('/packs', PackController.deleteOne.bind(PackController))

export default router
