import query from '../db.js'
import bcrypt from 'bcrypt'
import { paymentTypeMap } from '../utils/maps'

class ClientSessionController {
  async renderClientLogin (req, res) {
    if (!req.session.user || req.session.user.type !== 'CLIENT') {
      return res.render('public/ingresar', {
        title: 'Music & Soul | Ingresar área de usuario',
        linkId: -1,
        session: req.session,
        valid: true
      })
    }
    return res.redirect('/area')
  }
  formatPayments (payments) {
    return payments.reduce((acc, payment) => {
      const index = acc.findIndex(i => i.id === payment.id)
      if (index !== -1) {
        acc[index].packs.push({
          id: payment.packId,
          name: payment.packName
        })
        return acc
      }
      acc.push({
        id: payment.id,
        date: payment.date,
        paymentType: paymentTypeMap[payment.paymentType],
        total: payment.total.substring(0, payment.total.length - 2) || 0,
        packs: [
          {
            id: payment.packId,
            name: payment.packName
          }
        ]
      })
      return acc
    }, [])
  }
  async renderArea (req, res, next) {
    const { user } = req.session
    try {
      const subscriptions = await query(
        'SELECT * FROM subscriptions JOIN packs ON subscriptions.pack_id = packs.id WHERE subscriptions.client_id = ?',
        [user.id]
      )
      let payments = this.formatPayments(
        await query(
          `
          SELECT type as paymentType, payments.id, payments.total, packs.id as packId, packs.name as packName, payments.timestamp as date
          FROM payments
          LEFT JOIN payments_packs
          ON payments.id = payments_packs.payment_id
          LEFT JOIN packs ON packs.id = payments_packs.pack_id
          WHERE payments.client_id = ?
          ORDER BY payments.timestamp DESC
        `,
          [user.id]
        )
      )
      const [card] = await query('SELECT * FROM cards WHERE client_id = ?', [
        user.id
      ])
      return res.render('public/area', {
        title: 'Music & Soul | Área de usuario',
        linkId: -1,
        session: req.session,
        subscriptions,
        payments,
        card
      })
    } catch (err) {
      next(err)
    }
  }
  async login (req, res, next) {
    const { email, password } = req.body
    try {
      const [row] = await query('SELECT * FROM clients WHERE email = ?', [
        email
      ])

      if (!row) {
        return res.render('public/ingresar', {
          valid: false,
          title: 'Music & Soul | Ingresar área de usuario',
          linkId: -1,
          session: req.session
        })
      }
      const match = await bcrypt.compare(password, row.password)
      if (!match) {
        return res.render('public/ingresar', {
          valid: false,
          title: 'Music & Soul | Ingresar área de usuario',
          linkId: -1,
          session: req.session
        })
      }
      delete row.password
      await req.session.save({ id: row.id, type: 'CLIENT' })
      return res.redirect('/area')
    } catch (err) {
      next(err)
    }
  }
  async logout (req, res, next) {
    if (!req.session.user || req.session.user.type !== 'CLIENT') {
      return res.redirect('/ingresar')
    }
    const { id } = req.session.user
    try {
      await query('DELETE FROM sessions WHERE user_id = ?', [id])
      return res.redirect('/')
    } catch (err) {
      next(err)
    }
  }
  async userArea (req, res, next) {
    // const { email, password } = req.body;
    // try {
    //   const [row] = await query("SELECT * FROM clients WHERE email = ?", [
    //     email,
    //   ]);
    //   if (!row) {
    //     return res.render("session/login", { valid: false });
    //   }
    //   const match = await bcrypt.compare(password, row.password);
    //   if (!match) {
    //     return res.render("session/login", { valid: false });
    //   }
    //   delete row.password;
    //   await req.session.save(row.id);
    //   // return res.redirect("/panel/dashboard");
    // } catch (err) {
    //   next(err);
    // }
  }
}

export default new ClientSessionController()
