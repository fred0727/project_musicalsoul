import crypto from 'crypto'
import query from '../db.js'
import CRUD from '../utils/CRUD.js'
import mail from '../utils/mailer.js'
import bcrypt from 'bcrypt'
import { ErrorHandler } from '../utils/error.js'
// import oneSignal from '../utils/oneSignal'

class TeacherController extends CRUD {
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

  createTelegramToken ({ email }) {
    return crypto.randomBytes(20).toString('hex')
  }

  createRandomPassword () {
    return Math.random()
      .toString(36)
      .slice(-8)
  }

  async insertServices ({ services }) {
    const q = this.getQueryString(services)
    const [{ 'LAST_INSERT_ID()': teacherId }] = await query(
      'SELECT LAST_INSERT_ID()'
    )
    await query(
      `INSERT INTO teachers_services (teacher_id, service_id) VALUES ${q}`,
      services.map(({ id }) => [teacherId, id]).flat()
    )
  }

  async createOneAndNotify (req, res, next) {
    try {
      // Create random password for teacher
      req.body.password = this.createRandomPassword() // randomize
      req.body.telegramToken = this.createTelegramToken(req.body) // create telegram token
      const created = await this.createOne(req, res, next)
      if (created) {
        // Delete request row
        await query('DELETE FROM contacts WHERE id = ?', [req.body.id])
        // Insert teacher services
        await this.insertServices(req.body)
        // Notify teacher with telegram token
        const botUrl = `${process.env.BOT_URL}?start=${req.body.telegramToken}`
        mail({
          data: {
            email: req.body.email,
            name: req.body.name,
            password: req.body.password,
            botUrl: botUrl
          },
          type: 'teacherNotification'
        })
        res.json({
          message: 'Created'
        })
      }
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'ER_DUP_ENTRY' })
      }
      next(err)
    }
  }

  async updateOneMovility (req, res, next) {

    const { id } = req.session.user
    if (!id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
      await query('UPDATE teachers SET movility = ? WHERE id = ?', [
        JSON.stringify(req.body),
        id
      ])
      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      next(err)
    }
  }

  async updateOneTypeClass(req, res, next) {
    const { id } = req.session.user
    if (!id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
      await query('UPDATE teachers SET type_class = ? WHERE id = ?', [
        req.body.typeClass,
        id
      ])
      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      next(err)
    }
  }

  async updateOnePassword (req, res, next) {
    const { id } = req.session.user
    if (!id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
      const [{ password: currentPassword }] = await query(
        'SELECT password FROM teachers WHERE id = ?',
        [req.session.user.id]
      )
      const match = await bcrypt.compare(
        req.body.currentPassword,
        currentPassword
      )
      if (match) {
        const hash = await bcrypt.hash(req.body.newPassword, 10)
        await query('UPDATE teachers SET password = ? WHERE id = ?', [hash, id])
        await req.session.destroy()
        return res.json({
          message: 'Updated'
        })
      }
      return res.status(404).json({
        message: 'BAD_PASSWORD'
      })
    } catch (err) {
      console.log(err)
      next(err)
    }
  }

  async updateOnePromo (req, res, next) {
    try {
      await query('UPDATE teachers SET promo = ? WHERE id = ?', [
        req.body.promo,
        req.body.id
      ])
      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      next(err)
    }
  }

  async updateOneCancelationPolicy (req, res, next) {
    const { id } = req.session.user
    if (!id) {
      return res.status(401).json({ message: 'Unauthorized' })
    }
    try {
      await query('UPDATE teachers SET cancelation_policy = ? WHERE id = ?', [
        req.body.cancelationPolicy,
        id
      ])

      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      console.log(err)
      next(err)
    }
  }
  //   async deleteOneAndNotify(req, res, next) {
  //     try {
  //       const { id } = req.body;
  //       const [subscription] = await query(
  //         `
  //         SELECT clients.id as clientId, clients.name as name, clients.email as email
  //         FROM subscriptions
  //         LEFT JOIN clients
  //         ON clients.id = subscriptions.client_id
  //         WHERE subscriptions.id = ?
  //       `,
  //         [id]
  //       );
  //       const subscriptions = await query(
  //         `
  //         SELECT subscriptions.id as id
  //         FROM subscriptions
  //         LEFT JOIN clients
  //         ON clients.id = subscriptions.client_id
  //       `,
  //         [subscription.clientId]
  //       );
  //       // If it's last subscription erase the card data
  //       if (subscriptions.length - 1 === 0) {
  //         await query("DELETE FROM cards WHERE client_id = ?", [
  //           subscription.clientId,
  //         ]);
  //       }
  //       mail({
  //         data: {
  //           name: subscription.name,
  //           email: subscription.email,
  //         },
  //         type: "cancelSubscription",
  //       });
  //       return this.deleteOne(req, res, next);
  //     } catch (err) {
  //       next(err);
  //     }
  //   }
  async validateTeacher (req, res, next) {
    try {
      await query('UPDATE teachers SET valid = ? WHERE id = ?', [
        1,
        req.session.user.id
      ])
      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      return next(err)
    }
  }
  async readOneFormat (req, res, next) {
    try {
      let rows = await this.readOne(req, res, next)
      if (rows.length === 0) {
        throw new ErrorHandler(404, `teacher not found`)
      }
      // format on json three
      const services = rows.map(row => ({
        name: row.serviceName,
        id: row.serviceId
      }))
      delete rows[0].serviceId
      return res.json({
        ...rows[0],
        services
      })
    } catch (err) {
      next(err)
    }
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
    return uniques
  }
  async readAll(_, res, next) {
    try {
      const rows = await query(`
        SELECT teachers.id, teachers.name, teachers.email, teachers.type_class as typeClass, phone, cp, valid, promo, movility, services.name as serviceName, services.id as serviceId
        FROM teachers
        LEFT JOIN teachers_services
        ON teachers.id = teachers_services.teacher_id
        LEFT JOIN services
        ON services.id = teachers_services.service_id
      `)
      let teachers = this.getUnique(rows.map(i => ({ ...i, movility: JSON.parse(i.movility) })))
      teachers = Object.keys(teachers)
        .map((row) => teachers[row])
        .reverse()
      return res.json({
        data: teachers
      })
    } catch(err) {
      next(err)
    }
  }
}
export default new TeacherController({
  name: 'Teachers',
  createOne: {
    query:
      'INSERT INTO teachers (name, email, password, phone, cp, type_class, telegram_token, valid) VALUES(?, ?, ?, ?, ?, ?, ?, ?)',
    values: ['name', 'email', 'password', 'phone', 'cp', 'typeClass', 'telegramToken', 0],
    hashValues: ['password']
  },
  readOne: {
    query: `
      SELECT services.name as serviceName, services.id as serviceId, teachers.name as name, teachers.email as email, teachers.phone as phone
      FROM teachers
      LEFT JOIN teachers_services
      ON teachers.id = teachers_services.teacher_id
      LEFT JOIN services
      ON services.id = teachers_services.service_id
      WHERE teachers.id = ?
    `,
    type: 'params',
    search ({ id }) {
      return [id]
    }
  },
  readMany: {
    query: `
    SELECT id, name, email, phone, cp, valid, promo, movility
    FROM teachers
    WHERE (name LIKE ? OR email LIKE ? OR phone LIKE ?)
    LIMIT ?
    OFFSET ?
    `,
    count: 'SELECT COUNT(id) as max FROM teachers',
    type: 'query',
    search ({ page, filter }) {
      const offset = +page === 1 ? 0 : 10 * (parseInt(page) - 1)
      return [
        filter ? filter + '%' : '%',
        filter ? filter + '%' : '%',
        filter ? filter + '%' : '%',
        10,
        offset || 0
      ]
    },
    json: true,
  },
  updateOne: {
    query:
      'UPDATE teachers SET email = ?, name = ?, phone = ?, cp = ? WHERE id = ?',
    values: ['email', 'name', 'phone', 'cp', 'id'],
    sessionValues: ['id'],
    json: true
  },
  deleteOne: {
    query: 'DELETE FROM teachers WHERE id = ?',
    values: ['id'],
    json: true
  }
})
