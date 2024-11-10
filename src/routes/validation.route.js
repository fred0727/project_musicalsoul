import { Router } from 'express'
import ValidationController from '../controllers/validation.controller'

const router = Router()

router.get(
  '/validar',
  ValidationController.validateEmail.bind(ValidationController)
)

router.get(
  '/solicitar-validacion',
  ValidationController.requestValidation.bind(ValidationController)
)

export default router
