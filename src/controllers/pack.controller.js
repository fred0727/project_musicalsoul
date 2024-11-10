import query from '../db.js'
import CRUD from '../utils/CRUD.js'
// import mailer from '../utils/mailer.js'
// import { typeClassMap, typeMap, levelMap } from '../utils/maps.js'

class PackController extends CRUD {
  createView (_, res) {
    return res.render('dashboard/packs/form', { pack: {} })
  }

  async updateView (req, res, next) {
    try {
      const [row] = await query('SELECT * FROM packs WHERE id = ?', [
        req.params.id
      ])
      return res.render('dashboard/packs/form', { pack: row })
    } catch (err) {
      console.error(err)
      next(err)
    }
  }
}

export default new PackController({
  name: 'Packs',
  readMany: {
    query:
      'SELECT id, name, price_description as priceDescription, description, duration, price, position, subscription, lessons_per_month as lessonsPerMonth FROM packs ORDER BY position',
    type: 'query',
    search () {},
    json: true
  },
  createOne: {
    query:
      'INSERT INTO packs (name, price_description, description, duration, subscription, price, position) VALUES(?, ?, ?, ?, ?, ?, ?)',
    values: [
      'name',
      'price',
      'price_description',
      'duration',
      'subscription',
      'price',
      'position'
    ],
    json: true
  },
  updateOne: {
    query:
      'UPDATE packs SET name = ?, price_description = ?, description = ?, duration = ?, subscription = ?, price = ?, position = ?, lessons_per_month = ? WHERE id = ?',
    values: [
      'name',
      'price_description',
      'description',
      'duration',
      'subscription',
      'price',
      'position',
      'lessonsPerMonth',
      'id'
    ],
    json: true
  },
  deleteOne: {
    query: 'DELETE FROM packs WHERE id = ?',
    values: ['id'],
    json: true
  }
})
