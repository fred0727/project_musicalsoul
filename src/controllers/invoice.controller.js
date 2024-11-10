import query from '../db.js'
import CRUD from '../utils/CRUD.js'
import { durationMap, lessonTypeMap } from '../utils/maps.js'
import generateInvoicePdf from '../utils/pdf.js'

const LESSON_FULL_PRICE = 15

class InvoiceController extends CRUD {
  monthDiff (starts) {
    if (!starts) {
      return 0
    }
    let months
    const d1 = new Date(starts)
    const d2 = new Date()
    months = (d2.getFullYear() - d1.getFullYear()) * 12
    months -= d1.getMonth()
    months += d2.getMonth()
    // Min is 0 months
    if (months <= 0) {
      return 0
    }
    // Max is 12 months
    if (months > 12) {
      return 12
    }
    return months
  }

  getSubscriptionsQueryString (arr) {
    let q = ''
    for (let i = 0; i < arr.length; i++) {
      if (i === arr.length - 1) {
        q += 'subscription_id = ? OR ISNULL(subscription_id)'
        continue
      }
      q += 'subscription_id = ? OR '
    }
    return q
  }

  async readOnePdf (req, res, next) {
    try {
      const tarifications = await query('SELECT * FROM tarifications')
      let subscriptions = await this.readOne(req, res, next)
      const [selectedInvoice] = await query('SELECT * FROM invoices WHERE id = ?', [req.params.id])
      if (!selectedInvoice) {
        return res.status(404).json({
          message: 'Invoice not found'
        })
      }
      if (
        subscriptions.length > 0 &&
        req.session.user.type === 'TEACHER' &&
        subscriptions[0].teacherId !== req.session.user.id
      ) {
        return res.status(401).json({
          message: 'Unauthorized'
        })
      }
      if (subscriptions.length === 0) {
        return res.status(404).json({
          message: 'Invoice not found'
        })
      }
      const queryString = this.getSubscriptionsQueryString(subscriptions)

      // Get lessons for each subscription
      let lessons = await query(
        `
            SELECT
              client_name as clientName,
              lessons.date,
              lessons.time,
              lessons.duration,
              lessons.id as lessonId,
              lessons.status as lessonStatus,
              lessons.type as lessonType,
              lessons.subscription_id as subscriptionId
            FROM
              lessons
            WHERE
              (${queryString})
              AND (MONTH(lessons.date) = ? AND YEAR(lessons.date) = ?)
              AND lessons.status = ?
          `,
        [
          ...subscriptions.map(subscription => subscription.subscriptionId),
          selectedInvoice.date.getMonth() + 1,
          selectedInvoice.date.getFullYear(),
          'COMPLETED'
        ]
      )

      const invoice = {
        id: subscriptions[0].id,
        date: subscriptions[0].date,
        teacherName: subscriptions[0].teacherName,
        subscriptions: [
          ...subscriptions.map(subscription => {
            function groupLessons (lessons, type) {
              return lessons
                .filter(
                  lesson =>
                    lesson.subscriptionId === subscription.subscriptionId &&
                    lesson.lessonType === type
                )
                .map(lesson => ({
                  ...lesson,
                  clientName: `${lesson.clientName || subscription.clientName}`
                }))
            }
            const subscriptionLessons = groupLessons(lessons, 'SUBSCRIPTION')
            // console.log('SUBS LES', subscriptionLessons)
            const extraLessons = groupLessons(lessons, 'EXTRA')

            const subscriptionMonths = this.monthDiff(subscription.starts)
            // Special tarification logic
            const lessonTarification = tarifications.find(tarification => {
              if (!subscriptions[0].teacherPromo && tarification.months === 5) {
                return true
              }
              if (subscriptionMonths < tarification.months) {
                return true
              }
              if (subscriptionMonths > 11 && tarification.months === 12) {
                return true
              }
            })
            const paysPerHour = subscription.paysPerHour || LESSON_FULL_PRICE
            const paysPerHourTarification = +(
              paysPerHour -
              paysPerHour * lessonTarification.percentage * 0.01
            )
            const serviceTotal =
              (subscription.packPrice || LESSON_FULL_PRICE) +
              extraLessons.reduce(
                (acc, current) => (acc += subscription.paysPerHour),
                0
              )
            const lessonDurationInHours = subscription.packDuration / 3600000 // to hours
            const gross =
              (serviceTotal -
                paysPerHourTarification *
                  (subscription.lessonsPerMonth + extraLessons.length) *
                  lessonDurationInHours) /
              subscription.lessonsPerMonth
            const net = gross / 1.21
            const iva = gross - net

            const serviceType = `${subscription.packName}\n${subscriptionMonths} MESES`

            const serviceTotalLessons =
              (subscriptionLessons.length * serviceTotal) /
              subscription.lessonsPerMonth

            const paidLessons =
              paysPerHourTarification *
              subscription.lessonsPerMonth *
              lessonDurationInHours

            return {
              id: subscription.subscriptionId,
              serviceTotal,
              starts: subscription.starts,
              clientName: `${subscription.clientName} ${subscription.clientSurname}`,
              subscriptionMonths,
              serviceTotalLessons,
              paysPerHour,
              paysPerHourTarification,
              gross: gross,
              net: net,
              iva: iva,
              completedLessons: subscriptionLessons.length,
              extraLessons: extraLessons.length,
              serviceType,
              paidLessons,
              lessonsPerMonth: subscription.lessonsPerMonth,
              lessons: subscriptionLessons
            }
          }),
          ...lessons
            .filter(lesson => lesson.subscriptionId === null)
            .map(lesson => {
              const lessonPricePerDuration = LESSON_FULL_PRICE * (lesson.duration / 3600000)
              const gross = lessonPricePerDuration * 0.2
              const net = gross / 1.21
              const iva = gross - net
              return {
                gross,
                net,
                iva,
                serviceTotal: lessonPricePerDuration,
                serviceTotalLessons: lessonPricePerDuration,
                paysPerHour: lessonPricePerDuration,
                completedLessons: 1, // is TEST or UNIQUE just one completedLesson
                type: lesson.type,
                teacherName: subscriptions[0].teacherName,
                clientName: `${lesson.clientName}`,
                serviceType: `${lessonTypeMap[lesson.lessonType]}\n${durationMap[lesson.duration]}`.toUpperCase(),
                lessons: [lesson]
              }
            })
        ]
      }
      if (req.query.format === 'json') {
        return res.json({
          invoice
        })
      }
      return generateInvoicePdf({ res, invoice })
    } catch (err) {
      next(err)
    }
  }
  async readManyForTeacher (req, res, next) {
    try {
      if (!req.query.month || !req.query.year) {
        return res.status(400).json({
          message: 'Missing period'
        })
      }
      const rows = await query(
        `SELECT
          invoices.id,
          invoices.date,
          invoices.paid,
          teachers.name as teacherName
        FROM
          invoices
        JOIN
          teachers
        ON
          teachers.id = invoices.teacher_id
        WHERE
          invoices.teacher_id = ?
        ORDER BY invoices.date DESC
        `,
        [req.session.user.id]
      )
      return res.json({
        data: rows
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new InvoiceController({
  readMany: {
    query: `
        SELECT
            invoices.id,
            invoices.date,
            invoices.paid,
            teachers.name as teacherName
        FROM
            invoices
        LEFT JOIN
            teachers
        ON
            teachers.id = invoices.teacher_id
        WHERE (MONTH(invoices.date) = MONTH(?) AND YEAR(invoices.date) = YEAR(?))
        ORDER BY invoices.date DESC
            `,
    type: 'query',
    search (query) {
      return [`${query.year}-${query.month}-01`, `${query.year}-01-01`]
    },
    json: true
  },
  readOne: {
    query: `
        SELECT
            invoices.id,
            invoices.date,
            invoices.paid,
            teachers.id as teacherId,
            teachers.name as teacherName,
            teachers.promo as teacherPromo,
            subscriptions.starts as starts,
            subscriptions.id as subscriptionId,
            packs.lessons_per_month as lessonsPerMonth,
            packs.pays_per_hour as paysPerHour,
            packs.price as packPrice,
            packs.duration as packDuration,
            packs.name as packName,
            clients.name as clientName,
            clients.surname as clientSurname
        FROM
            invoices
        LEFT JOIN subscriptions ON subscriptions.teacher_id = invoices.teacher_id
        LEFT JOIN teachers ON teachers.id = subscriptions.teacher_id
        LEFT JOIN packs ON packs.id = subscriptions.pack_id
        LEFT JOIN clients ON clients.id = subscriptions.client_id
        WHERE
            invoices.id = ?
            `,
    type: 'queryParams',
    search ({ id, month, year }) {
      return [id, month, year]
    }
  }
})
