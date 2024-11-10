import { Router } from 'express'
import ShoppingCartController from '../controllers/shopping-cart.controller.js'

const router = Router()

router.post(
  '/carrito',
  ShoppingCartController.createCart.bind(ShoppingCartController)
)
router.post(
  '/carrito/delete/product/:id',
  ShoppingCartController.deleteOne.bind(ShoppingCartController)
)
// router.post(
//   "/carrito/delete/all",
//   ShoppingCartController.deleteOne.bind(ShoppingCartController)
// );
// router.get(
//   "/dashboard/packs/create",
//   ShoppingCartController.createView.bind(ShoppingCartController)
// );
// router.get(
//   "/dashboard/packs/:id",
//   ShoppingCartController.updateView.bind(ShoppingCartController)
// );
// router.get(
//   "/dashboard/packs/",
//   ShoppingCartController.readMany.bind(ShoppingCartController)
// );
// router.post(
//   "/dashboard/packs/delete/:id",
//   ShoppingCartController.deleteOne.bind(ShoppingCartController)
// );

export default router
