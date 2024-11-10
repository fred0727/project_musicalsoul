import { v4 as uuidv4 } from 'uuid'
import query from '../db.js'

function oneDay () {
  return 24 * 60 * 60 * 1000
}

function setCookie (uid, res) {
  res.cookie('shopping_cart_id', uid || '', {
    maxAge: uid ? oneDay() * 7 : 0, // one week or zero
    httpOnly: process.env.NODE_ENV === 'production',
    signed: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production'
  })
}

export default async function (req, res, next) {
  req.session = {
    ...req.session,
    shoppingCart: {
      packs: []
    }
  }
  let shoppingCartId =
    process.env.NODE_ENV === 'production'
      ? req.signedCookies.shopping_cart_id
      : req.cookies.shopping_cart_id
  req.session.deleteShoppingCart = async () => {
    await query('DELETE FROM shoppingCarts WHERE uid = ?', [shoppingCartId])
    setCookie('', res)
  }
  req.session.saveShoppingCart = async (packId) => {
    if (!shoppingCartId) {
      try {
        const uid = uuidv4()
        await query('INSERT INTO shoppingCarts (uid) VALUES(?);', [uid]);
        [{ 'LAST_INSERT_ID()': shoppingCartId }] = await query(
          'SELECT LAST_INSERT_ID()'
        )
        setCookie(uid, res)
      } catch (err) {
        console.error('Problem saving shopping cart', err)
      }
    } else {
      const [row] = await query('SELECT id FROM shoppingCarts WHERE uid = ?', [
        shoppingCartId
      ])
      shoppingCartId = row.id
    }
    try {
      await query(
        'INSERT INTO shoppingCarts_packs (shoppingCart_id, pack_id) VALUES(?, ?)',
        [shoppingCartId, packId]
      )
      return true
    } catch (err) {
      console.error('Problem saving item on shopping cart', err)
    }
  }
  try {
    const rows = await query(
      `SELECT shoppingCarts.id as shoppingCartId, name, price, description, duration, subscription, shoppingCarts.uid, shoppingCarts_packs.id as id, shoppingCarts_packs.pack_id as packId FROM shoppingCarts
        LEFT JOIN shoppingCarts_packs
        ON shoppingCarts.id = shoppingCarts_packs.shoppingCart_id
        LEFT JOIN packs
        ON shoppingCarts_packs.pack_id = packs.id
        WHERE uid = ?`,
      [shoppingCartId]
    )
    if (!rows.length) {
      return next()
    }
    const shoppingCart = {
      id: rows[0].shoppingCartId,
      uid: rows[0].uid,
      packs: rows[0].name
        ? rows.map((row) => ({
            id: row.id,
            name: row.name,
            price: row.price,
            packId: row.packId,
            description: row.description,
            duration: row.duration,
            subscription: row.subscription
          }))
        : []
    }
    req.session.shoppingCart = shoppingCart
    return next()
  } catch (err) {
    return next(err)
  }
}
