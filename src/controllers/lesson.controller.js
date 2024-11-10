import CRUD from '../utils/CRUD.js'
import query from '../db.js'
import { sendBotMessage } from '../../bot/index'
import messages from '../../bot/messages'
import { lessonStatusMap, lessonTypeMap } from '../utils/maps'
import mail from '../utils/mailer'

class LessonController extends CRUD {
  async readManyForTeacher (req, res, next) {
    const { page } = req.query
    let filter = req.query.filter
    const limit = 10
    filter = filter ? `%${filter}%` : null
    try {
      const offset = page <= 1 ? 0 : 10 * (parseInt(page) - 1)
      const rows = await query(
        `
         SELECT
          IFNULL(lessons.client_name, clients.name) clientName,
          IFNULL(lessons.client_phone, clients.phone) clientPhone,
          lessons.id as id, clients.id as clientId,
          teachers.name as teacherName,
          teachers.id as teacherId,
          lessons.date,
          lessons.time,
          lessons.duration,
          lessons.status,
          lessons.type,
          services.name as serviceName,
          services.id as serviceId
         FROM lessons
         LEFT JOIN clients
         ON lessons.client_id = clients.id
         LEFT JOIN teachers
         ON lessons.teacher_id = teachers.id
         LEFT JOIN services
         ON lessons.service_id = services.id
         WHERE teachers.id = ? AND (lessons.status LIKE ? OR lessons.client_name LIKE ? OR clients.name LIKE ? OR teachers.name LIKE ?)
         ORDER BY lessons.date DESC, lessons.time DESC
         LIMIT ? OFFSET ?
        `,
        [
          req.session.user.id,
          ...Array(4)
            .fill(1)
            .map(() => filter || '%'),
          limit,
          offset
        ]
      )
      const [{ 'COUNT(id)': max }] = await query(
        'SELECT COUNT(id) FROM lessons WHERE teacher_id = ? AND (lessons.status LIKE ? OR lessons.client_name LIKE ?)',
        [
          req.session.user.id,
          ...Array(2)
            .fill(1)
            .map(() => filter || '%')
        ]
      )
      return res.json({
        data: rows,
        limit,
        max
      })
    } catch (err) {
      next(err)
    }
  }

  async createOneAndNofity (req, res, next) {
    try {
      // if (
      //   req.body.teacherId !== req.session.user.id &&
      //   req.session.user.type !== 'TEACHER'
      // ) {
      //   return res.status(401).json({
      //     message: 'Unathorized'
      //   })
      // } // descomentar luego
      const created = await this.createOne(req, res, next)
      if (created) {
        const {
          teacherId,
          clientId,
          clientName,
          clientPhone,
          serviceId,
          type,
          duration
        } = req.body
        const [teacher] = await query(
          'SELECT name, chat_id as chatId FROM teachers WHERE id = ?',
          [teacherId]
        )
        const [service] = await query('SELECT * FROM services WHERE id = ?', [
          serviceId
        ])

        if (clientId) {
          const [client] = await query(
            'SELECT name, surname, phone FROM clients WHERE id = ?',
            [clientId]
          )
          await query(
            'INSERT IGNORE INTO teachers_clients (teacher_id, client_id) VALUES(?, ?)',
            [teacherId, clientId]
          )
          sendBotMessage(
            teacher.chatId,
            messages.notifyNewLesson({
              teacherName: teacher.name,
              clientName: `${client.name} ${client.surname || ''}`,
              clientPhone: client.phone,
              type: lessonTypeMap[type],
              service: service.name
            }),
            {
              parse_mode: 'MarkdownV2'
            }
          )
          return res.json({ message: 'Created' })
        }
        sendBotMessage(
          teacher.chatId,
          messages.notifyNewLesson({
            teacherName: teacher.name,
            clientName: `${clientName}`,
            clientPhone: clientPhone,
            type: lessonTypeMap[type],
            service: service ? service.name : null
          }),
          {
            parse_mode: 'MarkdownV2'
          }
        )
        return res.json({
          message: 'Created'
        })
      }
    } catch (err) {
      next(err)
    }
  }

  async createOneFromTeacherAndNofity (req, res, next) {
    try {
      // check if there's room for a new subscription type class (extra allowed)
      const [row] = await query(
        `
        SELECT
          COUNT(lessons.id),
          packs.lessons_per_month as lessonsPerMonth
        FROM
          lessons
        LEFT JOIN
          subscriptions
        ON
          subscriptions.id = lessons.subscription_id
        LEFT JOIN
          packs
        ON
          packs.id = subscriptions.pack_id
        WHERE
          subscriptions.id = ? AND
          (lessons.status = ? OR lessons.status = ?) AND
          (MONTH(lessons.date) = MONTH(CURRENT_DATE()) OR lessons.date IS NULL) AND
          lessons.type = ?
      `,
        [req.body.subscriptionId, 'COMPLETED', 'PENDING', 'SUBSCRIPTION']
      )
      let { 'COUNT(lessons.id)': registeredLessons, lessonsPerMonth } = row
      
      if (
        registeredLessons >= lessonsPerMonth &&
        req.body.type === 'SUBSCRIPTION'
      ) {
        return res.status(424).json({
          message: 'Completed'
        })
      }
      //
      req.body.teacherId = req.session.user.id

      const created = await this.createOne(req, res, next)
      if (created) {
        const {
          teacherId,
          clientId,
          clientName,
          clientPhone,
          date,
          time,
          type,
          serviceId,
          subscriptionId
        } = req.body
        const [teacher] = await query(
          'SELECT name, chat_id as chatId FROM teachers WHERE id = ?',
          [teacherId]
        )
        const [service] = await query('SELECT * FROM services WHERE id = ?', [
          serviceId
        ])

        if (clientId) {
          const [client] = await query(
            'SELECT name, surname, phone FROM clients WHERE id = ?',
            [clientId]
          )
          await query(
            'INSERT IGNORE INTO teachers_clients (teacher_id, client_id) VALUES(?, ?)',
            [teacherId, clientId]
          )
          sendBotMessage(
            teacher.chatId,
            messages.notifyNewLesson({
              teacherName: teacher.name,
              clientName: `${client.name} ${client.surname || ''}`,
              clientPhone: client.phone,
              type: lessonTypeMap[type],
              service: service.name
            }),
            {
              parse_mode: 'MarkdownV2'
            }
          )
          return res.json({ message: 'Created' })
        }

        sendBotMessage(
          teacher.chatId,
          messages.notifyNewLessonUnregisteredClient(
            teacher.name,
            clientName,
            clientPhone,
            date,
            time,
            lessonTypeMap[type]
          ),
          {
            parse_mode: 'MarkdownV2'
          }
        )

        return res.json({
          message: 'Created'
        })
      }
    } catch (err) {
      next(err)
    }
  }

  async updateOneAndNotify (req, res, next) {
    try {
      const confirmed = await this.updateOne(req, res, next)
      if (confirmed) {
        const [teacher] = await query(
          `
        SELECT type, chat_id as chatId, teachers.name as teacherName, IFNULL(lessons.client_name, clients.name) clientName, IFNULL(lessons.client_phone, clients.phone) clientPhone
        FROM teachers
        LEFT JOIN lessons
        ON teachers.id = lessons.teacher_id
        LEFT JOIN clients
        ON clients.id = lessons.client_id
        WHERE teachers.id = ? AND lessons.id = ?
        `,
          [req.session.user.id || req.body.teacherId, req.body.id]
        )
        if (teacher.chatId) {
          const {
            chatId,
            teacherName,
            registeredClientName,
            registeredClientEmail,
            clientEmail,
            clientName,
            type
          } = teacher
          sendBotMessage(
            chatId,
            messages.notifySchedule(
              teacherName,
              clientEmail || registeredClientEmail,
              clientName || registeredClientName,
              req.body.date,
              req.body.time,
              lessonTypeMap[type]
            ),
            {
              parse_mode: 'MarkdownV2'
            }
          )
          return res.json({
            message: 'Updated'
          })
        }
      }
      throw new Error()
    } catch (err) {
      next(err)
    }
  }

  async updateOneCancel (req, res, next) {
    const { id } = req.body
    try {
      query("UPDATE lessons SET status = 'CANCELED' WHERE id = ?", [id])
      res.json({
        message: 'Canceled'
      })
    } catch (err) {
      next(err)
    }
  }

  async updateOneComplete (req, res, next) {
    // TODO: Si la clase es de prueba, notificar a Juan Carlos que fue completada
    const { id, observations } = req.body
    try {
      query(
        "UPDATE lessons SET status = 'COMPLETED', observations = ? WHERE id = ?",
        [JSON.stringify(observations), id]
      )
      const [client] = await query(
        'SELECT name, email FROM clients JOIN lessons ON clients.id = lessons.client_id WHERE lessons.id = ?',
        [id]
      )
      if (client) {
        mail({
          data: {
            ...client,
            observations
          },
          type: 'studentCompletedClassNotification'
        })
      }

      res.json({
        message: 'Completed'
      })
    } catch (err) {
      next(err)
    }
  }

  async deleteOneAndNotify (req, res, next) {
    try {
      const [teacher] = await query(
        'SELECT chat_id as chatId, name FROM teachers WHERE id = ?',
        [req.body.teacherId]
      )
      const [client] = await query('SELECT name, surname FROM clients WHERE id = ?', [
        req.body.clientId
      ])
      const [lesson] = await query(
        'SELECT date, time, client_name as clientName FROM lessons WHERE id = ?',
        [req.body.id]
      )
      await this.deleteOne(req, res, next)

      sendBotMessage(
        teacher.chatId,
        messages.notifyDeleteLesson(
          teacher.name,
          lesson.date,
          lesson.time,
          client ? `${client.name} ${client.surname}` : lesson.clientName
        ),
        { parse_mode: 'MarkdownV2' }
      )
      res.json({
        message: 'Deleted',
        id: req.body.id
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new LessonController({
  name: 'Lesson',
  table: 'lessons',
  readOne: {
    query: 'SELECT * FROM lessons WHERE id = ?',
    values: ['id'],
    render: 'lessons/list'
  },
  readMany: {
    query: `
    SELECT
      lessons.observations as observations,
      lessons.status as status,
      lessons.id as id,
      teachers.id as teacherId,
      clients.id as clientId,
      teachers.name as teacherName,
      IFNULL(lessons.client_name, clients.name) clientName,
      IFNULL(lessons.client_phone, clients.phone) clientPhone,
      lessons.date,
      lessons.time,
      duration,
      lessons.type as type,
      services.id as serviceId
    FROM lessons
    LEFT JOIN teachers
    ON teachers.id = lessons.teacher_id
    LEFT JOIN clients
    ON clients.id = lessons.client_id
    LEFT JOIN services
    ON services.id = lessons.service_id
    WHERE (lessons.status LIKE ? OR lessons.client_name LIKE ? OR clients.name LIKE ? OR teachers.name LIKE ?)
    ORDER BY date DESC
    LIMIT ? OFFSET ?
    `,
    search ({ filter, page = 1 }) {
      const offset = +page === 1 ? 0 : 10 * (parseInt(page) - 1)
      filter = filter ? `%${filter}%` : null
      return [
        ...Array(4)
          .fill(1)
          .map(() => filter || '%'),
        10,
        offset
      ]
    },
    count: `
      SELECT COUNT(lessons.id) as max
      FROM lessons
      LEFT JOIN teachers
      ON teachers.id = lessons.teacher_id
      LEFT JOIN clients
      ON clients.id = lessons.client_id
      WHERE lessons.status LIKE ? OR lessons.client_name LIKE ? OR clients.name LIKE ? OR teachers.name LIKE ?`,
    includeSearchOnCount: true,
    limit: 10,
    json: true,
    type: 'query',
    defaultQueryParams: {
      status: 'PENDING'
    }
  },
  createOne: {
    query:
      'INSERT INTO lessons (teacher_id, client_id, date, time, duration, client_name, client_phone, service_id, type, subscription_id) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    values: [
      'teacherId',
      'clientId',
      'date',
      'time',
      'duration',
      'clientName',
      'clientPhone',
      'serviceId',
      'type',
      'subscriptionId'
    ]
  },
  updateOne: {
    query: 'UPDATE lessons SET date = ?, time = ?, duration = ? WHERE id = ?',
    values: ['date', 'time', 'duration', 'id']
    // json: true
  },
  deleteOne: {
    query: 'DELETE FROM lessons WHERE id = ?',
    values: ['id']
    // json: true
  }
})
