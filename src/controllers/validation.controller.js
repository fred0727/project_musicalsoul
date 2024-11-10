import { v4 as uuidv4 } from 'uuid'
import query from '../db.js'
import mail from '../utils/mailer.js'
import { getTwoHoursFromNowDate } from '../utils/date'

class ValidationController {
  async requestValidation (req, res) {
    const { user } = req.session
    if (!user) {
      return res.redirect('/')
    }
    // Check if user is already validated
    const [row] = await query(
      'SELECT * FROM clients WHERE id = ? AND valid = 0',
      [user.id]
    )
    if (!row) {
      return res.redirect('/area')
    }
    const uid = uuidv4()
    await query(
      'INSERT INTO validations (id, client_id, expiration) VALUES (?, ?, ?)',
      [uid, user.id, getTwoHoursFromNowDate()]
    )
    mail({
      data: {
        email: user.email,
        name: user.name,
        url: `${process.env.BASE_DOMAIN}/validar?id=${uid}`
      },
      type: 'emailVerification'
    })
    res.render('public/solicitar-validacion', {
      title: 'Music & Soul | Validación email',
      session: req.session,
      linkId: -1
    })
  }

  async validateEmail (req, res, next) {
    try {
      const { id } = req.query
      if (!id) {
        return res.redirect('/area')
      }
      const [row] = await query('SELECT * FROM validations WHERE id = ?', [id])
      if (!row) {
        return res.redirect('/area')
      }
      // Check for expiration
      if (new Date(row.expiration) < new Date()) {
        return res.render('public/validacion', {
          title: 'Music & Soul | Validación email',
          expired: true,
          session: req.session,
          linkId: -1
        })
      }
      await query('UPDATE clients SET valid = 1 WHERE id = ?', [row.client_id])
      await query('DELETE FROM validations WHERE id = ?', [id])
      return res.render('public/validacion', {
        title: 'Music & Soul | Email validado correctamente',
        expired: false,
        session: req.session,
        linkId: -1
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new ValidationController()
