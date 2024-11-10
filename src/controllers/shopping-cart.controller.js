// import query from '../db.js'
import CRUD from '../utils/CRUD.js'
// import mailer from '../utils/mailer.js'
// import { typeClassMap, typeMap, levelMap } from '../utils/maps.js'

class ShoppingCartController extends CRUD {
  //   createView(_, res) {
  //     return res.render("dashboard/packs/form", { pack: {} });
  //   }
  async createCart (req, res, next) {
    const { id } = req.body
    if (!id) {
      return res.redirect('/carrito')
    }
    try {
      await req.session.saveShoppingCart(id)
      return res.json({ message: 'success' })
    } catch (err) {
      console.error(err)
      next(err)
    }
  }
  //   async updateView(req, res) {
  //     try {
  //       const [row] = await query("SELECT * FROM packs WHERE id = ?", [
  //         req.params.id,
  //       ]);
  //       return res.render("dashboard/packs/form", { pack: row });
  //     } catch (err) {
  //       console.error(err);
  //       next(err);
  //     }
  //   }
}

export default new ShoppingCartController({
  name: 'Shopping Cart',
  deleteOne: {
    query: 'DELETE FROM shoppingCarts_packs WHERE id = ?',
    values: ['id']
  }
})
