import query from '../db.js'
import bcrypt from 'bcrypt'
import CRUD from '../utils/CRUD.js'
import mail from '../utils/mailer.js'
import { v4 as uuidv4 } from 'uuid'
import { getTwoHoursFromNowDate } from '../utils/date'

class ClientController extends CRUD {
  async renderClientSignup (req, res) {
    if (!req.session.user || req.session.user.type !== 'CLIENT') {
      return res.render('public/registro', {
        title: 'Music & Soul | Registrar usuario',
        linkId: -1,
        session: req.session,
        error: null
      })
    }
    return res.redirect('/area')
  }

  async renderForgotPassword (req, res) {
    if (!req.session.user || req.session.user.type !== 'CLIENT') {
      return res.render('public/olvide-contraseña', {
        title: 'Music & Soul | Olvidé contraseña',
        linkId: -1,
        session: req.session,
        sent: false,
        emailId: ''
      })
    }
    return res.redirect('/area')
  }

  async forgotPassword (req, res) {
    const { email } = req.body
    if (!email) {
      return res.redirect('/')
    }
    const [row] = await query(
      'SELECT id, email, name FROM clients WHERE email = ?',
      [email]
    )
    if (!row) {
      return res.render('public/olvide-contraseña', {
        title: 'Music & Soul | Olvidé contraseña',
        linkId: -1,
        session: req.session,
        sent: true,
        emailId: ''
      })
    }
    // Clean forgots
    await query('DELETE FROM forgots WHERE client_id = ?', [row.id])
    const uid = uuidv4()
    await query(
      'INSERT INTO forgots (id, client_id, expiration) VALUES (?, ?, ?)',
      [uid, row.id, getTwoHoursFromNowDate()]
    )
    mail({
      data: {
        email: row.email,
        name: row.name,
        url: `${process.env.BASE_DOMAIN}/reestablecer?id=${uid}`
      },
      type: 'forgotPassword'
    })
    return res.render('public/olvide-contraseña', {
      title: 'Music & Soul | Olvidé contraseña',
      linkId: -1,
      session: req.session,
      sent: true,
      emailId: process.env.NODE_ENV === 'development' ? uid : ''
    })
  }

  async restorePassword (req, res, next) {
    try {
      const { password, id } = req.body
      if (!password) {
        return res.redirect('/')
      }
      const [row] = await query('SELECT * FROM forgots WHERE id = ?', [id])
      if (!row) {
        return res.redirect('/')
      }
      // Check for expiration
      if (new Date(row.expiration) < new Date()) {
        return res.render('public/reestablecer', {
          title: 'Music & Soul | Reestablecer contraseña',
          expired: true,
          session: req.session,
          linkId: -1,
          done: false,
          id
        })
      }
      const hash = await bcrypt.hash(password, 10)
      await query('UPDATE clients SET password = ? WHERE id = ?', [
        hash,
        row.client_id
      ])
      await query('DELETE FROM forgots WHERE id = ? OR client_id = ?', [
        id,
        row.client_id
      ])
      return res.render('public/reestablecer', {
        title: 'Music & Soul | Contraseña reestablecida correctamente',
        expired: false,
        session: req.session,
        linkId: -1,
        done: true,
        id
      })
    } catch (err) {
      next(err)
    }
  }

  async completeQuestionnaire (req, res, next) {
    try {
      const [user] = await query('SELECT * FROM clients WHERE id = ?', [
        req.session.user.id
      ])
      if (!user) {
        return res.redirect('/')
      }
      const a = await query('UPDATE clients SET questionnaire = 1 WHERE id = ?', [
        req.session.user.id
      ])
      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      console.log(err)
      console.log(err)
      next(err)
    }
  }

  async renderRestorePassword (req, res, next) {
    try {
      const { id } = req.query
      const [row] = await query('SELECT * FROM forgots WHERE id = ?', [id])
      if (!row) {
        return res.redirect('/')
      }
      return res.render('public/reestablecer', {
        title: 'Music & Soul | Email validado correctamente',
        expired: false,
        done: false,
        session: req.session,
        linkId: -1,
        id
      })
    } catch (err) {
      next(err)
    }
  }

  async createOneAndNotify (req, res, next) {
    console.log(req.body)
    try {
      await this.createOne(req, res, next)
      const [{ 'LAST_INSERT_ID()': clientId }] = await query(
        'SELECT LAST_INSERT_ID()'
      )
      const uid = uuidv4()
      await query(
        'INSERT INTO validations (id, client_id, expiration) VALUES (?, ?, ?)',
        [uid, clientId, getTwoHoursFromNowDate()]
      )
      mail({
        data: {
          email: req.body.email,
          name: req.body.name,
          url: `${process.env.BASE_DOMAIN}/validar?id=${uid}`
        },
        type: 'emailVerification'
      })
      return res.render('public/registro-correcto', {
        title: 'Music & Soul | Valide su email',
        linkId: -1,
        session: req.session,
        error: null,
        validationId: process.env.NODE_ENV === 'development' ? uid : ''
      })
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.render('public/registro', {
          title: 'Music & Soul',
          linkId: -1,
          session: req.session,
          error: err.code
        })
      }
      next(err)
    }
  }

  getQueryString (arr) {
    let q = ''
    for (let i = 0; i < arr.length; i++) {
      if (i === arr.length - 1) {
        q += '(?, ?)'
        continue
      }
      q += '(?, ?),'
    }
    return q
  }

  formatClientsForTeacher (clients) {
    return clients.reduce((acc, client) => {
      const index = acc.findIndex(i => i.id === client.id)
      if (index !== -1) {
        acc[index].lessons.push({
          id: client.lessonId,
          date: client.date,
          time: client.time,
          subscriptionId: client.subscriptionId,
          status: client.status
        })
        acc[index] = {
          ...acc[index],
          pendingLessons:
            client.lessonsPerMonth -
            acc[index].lessons.filter(lesson => lesson.status === 'COMPLETED')
              .length
        }
        return acc
      }
      acc.push({
        id: client.id,
        name: client.name,
        email: client.email,
        packName: client.packName,
        lessonsPerMonth: client.lessonsPerMonth,
        pendingLessons:
          client.lessonsPerMonth - (client.date && client.time ? 1 : 0),
        lessons:
          client.date && client.time
            ? [
                {
                  id: client.lessonId,
                  date: client.date,
                  time: client.time,
                  subscriptionId: client.subscriptionId,
                  status: client.status
                }
              ]
            : []
      })
      return acc
    }, [])
  }

  async readManyForTeacher (req, res, next) {
    try {
      const { page } = req.query
      const offset = page <= 1 ? 0 : 10 * (parseInt(page) - 1)
      console.log(req.session.user.id)
      let clients = this.formatClientsForTeacher(
        await query(
          `
        SELECT
          clients.id,
          clients.name,
          clients.email,
          subscriptions.id as subscriptionId,
          lessons.date as date, lessons.time as time,
          lessons.id as lessonId,
          lessons.status,
          lessons.type,
          packs.name as packName,
          packs.lessons_per_month as lessonsPerMonth
        FROM
          clients
        LEFT JOIN
          subscriptions
        ON
          subscriptions.client_id = clients.id
        LEFT JOIN
          lessons
        ON
          lessons.client_id = clients.id
        LEFT JOIN
          packs
        ON
          packs.id = subscriptions.pack_id
        WHERE
          subscriptions.teacher_id = ? AND
          (MONTH(lessons.date) = MONTH(CURRENT_DATE()) OR lessons.date IS NULL) AND
          (lessons.type = ? OR lessons.type IS NULL)
      `,
          [req.session.user.id, 'SUBSCRIPTION']
        )
      )
      const [{ 'COUNT(id)': max }] = await query(
        `
        SELECT COUNT(clients.id)
        FROM clients
        JOIN subscriptions
        ON subscriptions.client_id = clients.id
        WHERE subscriptions.teacher_id = ?
        `,
        [req.session.user.id]
      )
      return res.json({
        limit: 10,
        max,
        data: clients
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new ClientController({
  name: 'Clients',
  createOne: {
    query:
      'INSERT INTO clients (name, surname, email, password, phone, valid) VALUES(?, ?, ?, ?, ?, ?)',
    values: ['name', 'surname', 'email', 'password', 'phone', 0],
    hashValues: ['password']
  },
  readMany: {
    query: `
    SELECT id, name, email, valid
    FROM clients
    WHERE (name LIKE ? OR email LIKE ?) AND valid = 1
    LIMIT ?
    OFFSET ?
    `,
    count: 'SELECT COUNT(id) as max FROM clients',
    type: 'query',
    search ({ page, filter }) {
      const offset = +page === 1 ? 0 : 10 * (parseInt(page) - 1)
      return [
        filter ? filter + '%' : '%',
        filter ? filter + '%' : '%',
        10,
        offset || 0
      ]
    },
    json: true,
    limit: 10
  },
  deleteOne: {
    query: 'DELETE FROM clients WHERE id = ?',
    values: ['id'],
    json: true
  }
})
