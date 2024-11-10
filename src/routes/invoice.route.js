import { Router } from 'express'
import InvoiceController from '../controllers/invoice.controller.js'
import adminMiddleware from '../middlewares/admin.middleware'
import teacherMiddleware from '../middlewares/teacher.middleware'

const router = Router()

router.get('/invoices/', teacherMiddleware, (req, res, next) => {
  if (req.session.user.type === 'ADMIN') {
    return InvoiceController.readMany.bind(InvoiceController)(req, res, next)
  }
  return InvoiceController.readManyForTeacher.bind(InvoiceController)(
    req,
    res,
    next
  )
})

router.get(
  '/invoices/:id',
  teacherMiddleware,
  InvoiceController.readOnePdf.bind(InvoiceController)
)

export default router
