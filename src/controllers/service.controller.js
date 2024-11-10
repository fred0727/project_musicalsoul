import CRUD from '../utils/CRUD'
import query from '../db'

class ServiceController extends CRUD {
  getQueryString(arr) {
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

  async updateTeacherServices(req, res, next) {
    try {
      // clear teacher services
      await query('DELETE from teachers_services WHERE teacher_id = ?', [req.session.user.id])
      const q = this.getQueryString(req.body.services)
      await query(`INSERT INTO teachers_services (teacher_id, service_id) VALUES ${q}`, req.body.services.map(i => [req.session.user.id, i.id]).flat())
      res.send({
        message: 'Updated'
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new ServiceController({
  name: 'service',
  table: 'services',
  readMany: {
    query: 'SELECT * FROM services ORDER BY id ASC',
    search() {
      return ['']
    },
    json: true
  }
})
