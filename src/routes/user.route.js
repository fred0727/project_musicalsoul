import { Router } from 'express'
import UserController from '../controllers/user.controller.js'

const router = Router()

router.post('/users', UserController.createOne.bind(UserController))
router.get('/users/create', UserController.createView.bind(UserController))
router.get('/users/update/:id', UserController.updateView.bind(UserController))
router.get('/users/last', UserController.lastInsertedId.bind(UserController))
router.get('/users/:id', UserController.readOne.bind(UserController))
router.get('/users', UserController.readMany.bind(UserController))
router.post('/users/update', UserController.updateOne.bind(UserController))
router.post('/users/delete', UserController.deleteOne.bind(UserController))

export default router
