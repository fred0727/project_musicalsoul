import { sendBotMessage } from '../../bot/index.js'
import query from '../db.js'
import CRUD from '../utils/CRUD.js'
import mail from '../utils/mailer.js'
import messages from '../../bot/messages.js'
import { ErrorHandler } from '../utils/error.js'

class SubscriptionController extends CRUD {
  async deleteOneAndNotify (req, res, next) {
    try {
      const { id } = req.body
      const [subscription] = await query(
        `
        SELECT clients.id as clientId, clients.name as name, clients.email as email
        FROM subscriptions
        LEFT JOIN clients
        ON clients.id = subscriptions.client_id
        WHERE subscriptions.id = ?
      `,
        [id]
      )
      const subscriptions = await query(
        `
        SELECT subscriptions.id as id
        FROM subscriptions
        LEFT JOIN clients
        ON clients.id = subscriptions.client_id
      `,
        [subscription.clientId]
      )
      // If it's last subscription erase the card data
      if (subscriptions.length - 1 === 0) {
        await query('DELETE FROM cards WHERE client_id = ?', [
          subscription.clientId
        ])
      }
      mail({
        data: {
          name: subscription.name,
          email: subscription.email
        },
        type: 'cancelSubscription'
      })
      return this.deleteOne(req, res, next)
    } catch (err) {
      next(err)
    }
  }

  async readManyWithTeachers (req, res, next) {
    try {
      const subscriptions = await this.readMany(req, res, next)
      const teachers = await query('SELECT id, name FROM teachers')
      return res.render('dashboard/subscriptions/list', {
        user: req.session.user,
        teachers,
        rows: subscriptions
      })
    } catch (err) {
      next(err)
    }
  }

  formatSubscriptions (subscriptions) {
    return subscriptions
      .reduce((acc, subscription) => {
        const index = acc.findIndex(i => i.id === subscription.id)
        if (index !== -1) {
          acc[index].lessons.push({
            id: subscription.lessonId,
            date: subscription.date,
            time: subscription.time,
            subscriptionId: subscription.id,
            status: subscription.lessonStatus,
            lessonType: subscription.lessonType
          })
          return acc
        }
        acc.push({
          id: subscription.id,
          packName: subscription.packName,
          clientName: subscription.clientName,
          clientSurname: subscription.clientSurname,
          lessonsPerMonth: subscription.lessonsPerMonth,
          lessonDuration: subscription.lessonDuration,
          clientId: subscription.clientId,
          serviceId: subscription.serviceId,
          serviceName: subscription.serviceName,
          lessons: subscription.lessonStatus
            ? [
                {
                  id: subscription.lessonId,
                  date: subscription.date,
                  time: subscription.time,
                  subscriptionId: subscription.id,
                  status: subscription.lessonStatus,
                  lessonType: subscription.lessonType
                }
              ]
            : []
        })
        return acc
      }, [])
      .map(current => ({
        ...current,
        pendingLessons:
          current.lessonsPerMonth -
          current.lessons.filter(lesson => {
            return (
              lesson.status === 'COMPLETED' &&
              lesson.lessonType === 'SUBSCRIPTION'
            )
          }).length,
        extraLessons: current.lessons.filter(lesson => {
          return lesson.status === 'COMPLETED' && lesson.lessonType === 'EXTRA'
        }).length
      }))
  }

  async readManyForTeacher (req, res, next) {
    try {
      const subscriptions = this.formatSubscriptions(
        await query(
          `
        SELECT
          subscriptions.status,
          subscriptions.id,
          clients.name as clientName,
          clients.surname as clientSurname,
          clients.id as clientId,
          packs.name as packName,
          lessons.date,
          lessons.time,
          lessons.duration,
          lessons.id as lessonId,
          lessons.type as lessonType,
          packs.lessons_per_month as lessonsPerMonth,
          packs.duration as lessonDuration,
          lessons.status as lessonStatus,
          services.name as serviceName,
          services.id as serviceId
        FROM
          subscriptions
        LEFT JOIN
          clients
        ON
          clients.id = subscriptions.client_id
        LEFT JOIN
          packs
        ON
          subscriptions.pack_id = packs.id
        LEFT JOIN
          lessons
        ON
          lessons.subscription_id = subscriptions.id
        LEFT JOIN
          services
        ON
          subscriptions.service_id = services.id
        WHERE
          subscriptions.teacher_id = ? AND
          (MONTH(lessons.date) = MONTH(CURRENT_DATE()) OR lessons.date IS NULL)
      `,
          [req.session.user.id]
        )
      )
      const [{ 'COUNT(id)': max }] = await query(
        'SELECT COUNT(id) FROM subscriptions WHERE subscriptions.teacher_id = ?',
        [req.session.user.id]
      )
      return res.json({
        data: subscriptions,
        max: max
      })
    } catch (err) {
      next(err)
    }
  }

  async updateOneAssignTeacher (req, res, next) {
    try {
      const confirmed = await this.updateOne(req, res, next)
      if (confirmed) {
        const [data] = await query(
          `
          SELECT chat_id as chatId, teachers.name as teacherName, clients.name as clientName, clients.surname as clientSurname
          FROM teachers
          LEFT JOIN subscriptions
          ON subscriptions.teacher_id = teachers.id
          LEFT JOIN clients
          ON subscriptions.client_id = clients.id
          WHERE teachers.id = ? AND subscriptions.id = ?
    `,
          [req.body.teacherId, req.body.id]
        )
        sendBotMessage(
          data.chatId,
          messages.nofifyNewSubscriptionAssigment({
            teacherName: data.teacherName,
            clientName: `${data.clientName} ${data.clientSurname || ''}`
          }),
          {
            parse_mode: 'MarkdownV2'
          }
        )
        // notify teacher
        return res.json({
          message: 'Updated'
        })
      }
      throw ErrorHandler(503, 'Se produjo un error')
    } catch (err) {
      next(err)
    }
  }

  async updateOneAssignService (req, res, next) {
    try {
      await query(
        `
        UPDATE
          subscriptions
        SET
          service_id = ?
        WHERE
          subscriptions.id = ?
      `,
        [req.body.serviceId, req.body.id]
      )
      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      next(err)
    }
  }

  async updateOneStatus (req, res, next) {
    try {
      await query(
        'UPDATE subscriptions SET status = ? WHERE subscriptions.id = ?',
        [req.body.status, req.body.id]
      )
      return res.json({
        message: 'Updated'
      })
    } catch (err) {
      next(err)
    }
  }
}
export default new SubscriptionController({
  readMany: {
    query: `
        SELECT
          starts,
          subscriptions.id,
          subscriptions.status,
          clients.id as clientId,
          clients.name as clientName,
          clients.surname as clientSurname,
          packs.name as packName,
          packs.price as packPrice,
          subscriptions.timestamp,
          teacher_id as teacherId,
          teachers.name as teacherName,
          subscriptions.service_id as serviceId,
          services.name as serviceName
        FROM
          subscriptions
        JOIN
          clients
        ON
          subscriptions.client_id = clients.id
        JOIN
          packs
        ON
          subscriptions.pack_id = packs.id
        LEFT JOIN
          teachers
        ON
          subscriptions.teacher_id = teachers.id
        LEFT JOIN
          services
        ON
          subscriptions.service_id = services.id
    `,
    count: 'SELECT COUNT(id) as max FROM subscriptions',
    type: 'query',
    search ({ page }) {
      const offset = +page === 1 ? 0 : 10 * (parseInt(page) - 1)
      return [10, offset || 0]
    },
    limit: 10,
    json: true
  },
  deleteOne: {
    query: 'DELETE FROM subscriptions WHERE id = ?',
    values: ['id'],
    json: true
  },
  updateOne: {
    query: 'UPDATE subscriptions SET teacher_id = ? WHERE id = ?',
    values: ['teacherId', 'id']
  }
})
