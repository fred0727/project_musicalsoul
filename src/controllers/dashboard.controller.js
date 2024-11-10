// import CRUD from "../utils/CRUD.js";
import query from '../db.js'

class DashboardController {
  //   constructor(config) {
  // super(config)
  // }
  async renderMain (req, res, next) {
    if (req.session.user.type !== 'ADMIN' && req.session.user.type !== 'TEACHER') {
      return res.redirect('/')
    }
    try {
      const yesterday = new Date().getTime() - 24 * 60 * 60 * 1000
      const [last24h] = await query(
        'SELECT COUNT(id) FROM contacts WHERE timestamp >= ?',
        new Date(yesterday).toISOString()
      )
      res.render('dashboard/main', {
        user: req.session.user,
        last24h: last24h['COUNT(id)']
      })
    } catch (err) {
      next(err)
    }
  }
}
export default new DashboardController()
