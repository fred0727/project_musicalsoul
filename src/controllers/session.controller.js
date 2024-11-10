import query from '../db.js'
import bcrypt from 'bcrypt'

class SessionController {
  async renderLogin (req, res) {
    // we don't have user session, redirect to login
    if (
      req.session.user.type !== 'ADMIN' &&
      req.session.user.type !== 'TEACHER'
    ) {
      return res.render('session/login', { valid: true })
    }
    return res.redirect('/panel/dashboard')
  }

  getUnique(arr) {
    const uniques = {}
    for (const row of arr) {
      if (!uniques[row.id]) {
        uniques[row.id] = {
          ...row,
          services: [{ name: row.serviceName, id: row.serviceId }]
        }
      } else {
        uniques[row.id].services.push({
          name: row.serviceName,
          id: row.serviceId
        })
      }
    }
    return Object.values(uniques)[0]
  }

  async getSession (req, res) {
    const id =
      process.env.NODE_ENV === 'production'
        ? req.signedCookies.session_id
        : req.cookies.session_id
    if (id) {
      try {
        const [user] = await query(
          'SELECT id, name, email, type, valid FROM sessions JOIN users ON users.id = sessions.user_id WHERE uid = ?',
          [id]
        )
        // TODO: separa lo del cliente aqui
        const [client] = await query(
          'SELECT id, name, email, type, valid FROM sessions JOIN clients ON clients.id = sessions.user_id WHERE uid = ?',
          [id]
        )
        const teacher = await query(
          `SELECT
            teachers.id as id,
            teachers.name,
            email,
            sessions.type,
            valid,
            phone,
            cp,
            telegram_token as telegramToken,
            chat_id as chatId,
            cancelation_policy as cancelationPolicy,
            valid,
            movility,
            teachers_services.service_id as serviceId,
            teachers.type_class as typeClass,
            services.name as serviceName
          FROM
            sessions
          JOIN
            teachers
          ON
            teachers.id = sessions.user_id
          LEFT JOIN
            teachers_services
          ON
            teachers.id = teachers_services.teacher_id
          LEFT JOIN
            services
          ON
            services.id = teachers_services.service_id
          WHERE
            uid = ?`,
          [id]
        )
        const row = this.getUnique(teacher) || user || client

        if (row) {
          return res.json({
            message: 'Authorized',
            role: user ? 'ADMIN' : teacher ? 'TEACHER' : 'CLIENT',
            name: row.name,
            email: row.email,
            ...row,
            movility: row.movility ? JSON.parse(row.movility) : undefined,
          })
        }
        throw new Error('Unauthorized')
      } catch (err) {
        console.log(err)
        return res.status(401).json({
          message: 'Unauthorized'
        })
      }
    }
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }

  async login (req, res, next) {
    const { email, password } = req.body
    try {
      const [userRow] = await query('SELECT * FROM users WHERE email = ?', [
        email
      ])
      const [teacherRow] = await query(
        'SELECT * FROM teachers WHERE email = ?',
        [email]
      )
      const role = userRow
        ? { ...userRow, type: 'ADMIN' }
        : { ...teacherRow, type: 'TEACHER' }
      if (!userRow && !teacherRow) {
        throw new Error('NOT_FOUND')
      }
      const match = await bcrypt.compare(password, role.password)
      if (!match) {
        throw new Error('BAD_CREDENTIALS')
      }
      delete role.password
      await req.session.save({ id: role.id, type: role.type })
      return res.json({
        message: 'OK',
        id: role.id,
        role: teacherRow ? 'TEACHER' : 'ADMIN',
        name: role.name,
        email: role.email,
        phone: role.phone,
        cp: role.cp,
        chatId: role.chat_id,
        valid: role.valid,
        movility: role.movility ? JSON.parse(role.movility) : undefined
      })
    } catch (err) {
      if (err.message === 'BAD_CREDENTIALS' || err.message === 'NOT_FOUND') {
        return res.status(404).json({
          message: err.message
        })
      }
      next(err)
    }
  }

  async logout (req, res, next) {
    try {
      await query('DELETE FROM sessions WHERE user_id = ?', [
        req.session.user.id
      ])
      return res.json({
        message: 'OK'
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new SessionController()
