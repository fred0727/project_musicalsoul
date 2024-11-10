import query from '../db.js'
import CRUD from '../utils/CRUD.js'
import mail from '../utils/mailer.js'
import { typeMap, levelMap } from '../utils/maps.js'
import oneSignal from '../utils/oneSignal'

class DashboardController extends CRUD {
  async createContactRequest(req, res, next) {
    const {
      name,
      lastName,
      email,
      phone,
      typeClass,
      cp,
      origin,
      level,
      terms,
      profile,
      state = 'NEW',
      provinceId,
      districtId,
      neighborhoodId,
      townId = null,
      availableHours,
      services,
      location
    } = req.body
    try {
      // Insert on contacts table
      await query(
        `INSERT INTO contacts (name, last_name, email, phone, type_class, cp, origin, terms, profile, state, province_id, district_id, neighborhood_id, town_id, level, location)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          name,
          lastName,
          email,
          phone,
          typeClass,
          cp,
          origin,
          +terms,
          profile,
          state,
          provinceId,
          districtId,
          neighborhoodId,
          townId,
          level,
          location ? JSON.stringify({ // location
            lat: location.split('|')[0],
            lng: location.split('|')[1]
          }) : null
        ]
      )
      const [{ 'LAST_INSERT_ID()': contactId }] = await query(
        'SELECT LAST_INSERT_ID()'
      )
      // insert each day/hour combination on schedules table
      if (availableHours) {
        const schedules = await query('SELECT * FROM schedules')
        for (const item of availableHours) {
          // in case hours is empty
          const hours = item.hours.length > 0 ? item.hours : [null]
          for await (const time of hours) {
            try {
              const schedule = schedules.find(
                (i) =>
                  i.day === parseInt(item.day) && i.time === (+time || null)
              )
              if (schedule) {

                await query(
                  'INSERT INTO contacts_schedules (contact_id, schedule_id) VALUES(?, ?)',
                  [contactId, schedule.id]
                )
              }
            } catch (err) {
              console.error(err)
              next(err)
            }
          }
        }
      }
      for (const serviceId of services) {
        try {
          await query(
            'INSERT INTO contacts_services (contact_id, service_id) VALUES(?, ?)',
            [contactId, serviceId]
          )
        } catch (err) {
          next(err)
        }
      }
      if (process.env.NODE_ENV === 'production') {
        await mail({ data: req.body, type: 'newContact' })
        await oneSignal({
          content: '¡Ha recibido una nueva solicitud en Music & Soul!'
        })
      }
      res.json({ message: 'Contact saved successfully' })
    } catch (err) {
      console.error('ERRROR IS', err)
      next(err)
    }
  }

  formatEnums(arr) {
    return arr.map((row) => {
      return {
        ...row,
        typeClass: row.typeClass,
        profile: typeMap[row.profile],
        level: levelMap[row.level]
      }
    })
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

  async readManyParsed(req, res, next) {
    const page = parseInt(req.query.page)
    const offset = page === 1 ? 0 : 10 * (parseInt(page) - 1)
    try {
      let students = await query(
        `SELECT contacts.id, contacts.name, contacts.email, contacts.phone, contacts.origin, contacts.type_class as typeClass, contacts.timestamp, contacts.profile, contacts.cp, contacts.level, services.name as serviceName, services.id as serviceId, location
        FROM contacts
        LEFT JOIN contacts_services
        ON contacts.id = contacts_services.contact_id
        LEFT JOIN services ON services.id = contacts_services.service_id
        WHERE profile = ? ORDER BY contacts.timestamp DESC
        LIMIT ? OFFSET ?
        `,
        ['STUDENT', 10, offset || 0]
      )
      let teachers = await query(
        `SELECT contacts.id, contacts.name, contacts.email, contacts.phone, contacts.origin, contacts.type_class as typeClass, contacts.timestamp, contacts.profile, contacts.cp, contacts.level, services.name as serviceName, services.id as serviceId, contacts.cp as cp, location
        FROM contacts
        LEFT JOIN contacts_services
        ON contacts.id = contacts_services.contact_id
        LEFT JOIN services ON services.id = contacts_services.service_id
        WHERE profile = ?`,
        ['TEACHER']
      )
      const [count] = await query('SELECT COUNT(id) FROM contacts')
      // Format enums and services
      students = this.formatEnums(students)
      teachers = this.formatEnums(teachers)
      // Group by services
      students = this.getUnique(students)
      teachers = this.getUnique(teachers)
      // Sort
      students = Object.keys(students)
        .map((row) => {
          return { ...students[row], location: JSON.parse(students[row].location) }
        })
        .reverse()
      teachers = Object.keys(teachers)
        .map((row) => teachers[row])
        .reverse()

      return res.json({
        students,
        teachers,
        page: page || 1,
        max: count['COUNT(id)'],
        limit: 10
      })
    } catch (err) {
      next(err)
    }
  }
}
export default new DashboardController({
})
