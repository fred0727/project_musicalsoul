import CRUD from '../utils/CRUD.js'
import query from '../db.js'

class UserController extends CRUD {
  createView (_, res) {
    return res.render('users/create', { method: 'POST' })
  }

  async updateView (req, res, next) {
    try {
      const [row] = await query(this.config.readOne.query, [req.params.id])
      return res.render('users/update', { user: row })
    } catch (err) {
      next(err)
    }
  }
}

export default new UserController({
  name: 'user',
  table: 'users',
  readOne: {
    query: 'SELECT * FROM users WHERE id = ?',
    values: ['id'],
    render: 'users/list'
  },
  readMany: {
    query: 'SELECT * FROM users ORDER BY id ASC',
    render: 'users/list'
  },
  createOne: {
    query: 'INSERT INTO users (email, password, name, type) VALUES(?, ?, ?, ?)',
    values: ['email', 'password', 'name', 'type'],
    redirect: '/users/',
    hashValues: ['password']
  },
  updateOne: {
    query: 'UPDATE users SET email = ? WHERE id = ?',
    values: ['email', 'id'],
    redirect: '/users/'
  },
  deleteOne: {
    query: 'DELETE FROM users WHERE id = ?',
    values: ['id'],
    redirect: '/users/'
  }
})
