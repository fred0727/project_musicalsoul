import bcrypt from 'bcrypt'
import query from '../db.js'
import { ErrorHandler } from '../utils/error.js'

export default class CRUD {
  constructor (config) {
    this.name = config.name
    this.config = config
    this.readOne.bind(this)
  }

  async _mapValues ({ values, hashValues, body, sessionValues = [], user }) {
    const result = []
    for await (const value of values) {
      if (hashValues.includes(value)) {
        try {
          const hash = await bcrypt.hash(body[value], 10)
          result.push(hash)
        } catch (err) {
          console.error(err)
          throw new Error(500)
        }
        continue
      }
      if (body[value] || sessionValues.length === 0) {
        result.push(body[value] || null)
      }
    }
    for (const value of sessionValues) {
      result.push(user[value])
    }
    return result
  }

  async readMany (req, res, next) {
    const { readMany, params } = this.config
    const search = readMany.search(req[readMany.type])
    try {
      const rows = await query(readMany.query, search)
      if (!readMany.redirect && !readMany.render && !readMany.json) {
        return rows
      }
      if (readMany.count) {
        const [count] = await query(
          readMany.count,
          readMany.includeSearchOnCount ? search : []
        )
        if (readMany.render) {
          return res.render(readMany.render, {
            params,
            rows,
            user: req.session.user,
            ...count,
            ...readMany.defaultQueryParams,
            ...req.query,
            ...readMany.injectIntoView,
            limit: readMany.limit
          })
        }
        if (readMany.json) {
          return res.json({
            data: rows,
            limit: readMany.limit,
            ...count
          })
        }
      }
      if (readMany.render) {
        return res.render(readMany.render, {
          rows,
          params,
          user: req.session.user,
          ...readMany.defaultQueryParams,
          ...req.query,
          ...readMany.injectIntoView
        })
      }
      if (readMany.json) {
        return res.json({
          data: rows,
          limit: readMany.limit
        })
      }
    } catch (err) {
      next(err)
    }
  }

  async readOne (req, res, next) {
    const { readOne } = this.config
    const search = readOne.search(
      readOne.type === 'queryParams'
        ? { ...req.query, ...req.params }
        : req[readOne.type]
    )
    try {
      const rows = await query(readOne.query, search)
      if (!rows) {
        throw new ErrorHandler(404, `${this.name} not found`)
      }
      if (readOne.json) {
        return res.json(rows)
      }
      return rows
    } catch (err) {
      next(err)
    }
  }

  async createOne (req, res, next) {
    const { createOne } = this.config
    try {
      const values = await this._mapValues({
        values: createOne.values,
        sessionValues: createOne.sessionValues,
        user: req.session.user,
        hashValues: createOne.hashValues || [],
        body: req.body
      })
      await query(createOne.query, values)
      if (createOne.redirect) {
        return res.redirect(createOne.redirect)
      }
      if (createOne.json) {
        return res.json({
          message: 'Created'
        })
      }
      return true
    } catch (err) {
      if (createOne.redirect) {
        if (err.code === 'ER_DUP_ENTRY') {
          err.statusCode = 409
          err.message = err.sqlMessage
          next(err)
        }
      }
      throw err
    }
  }

  async updateOne (req, res, next) {
    const { updateOne } = this.config
    const values = await this._mapValues({
      values: updateOne.values,
      sessionValues: updateOne.sessionValues,
      user: req.session.user,
      hashValues: updateOne.hashValues || [],
      body: req.body
    })
    try {
      const r = await query(updateOne.query, values)
      // if (result.changedRows === 0) {
      //   throw new ErrorHandler(
      //     404,
      //     `${this.name} with VALUES(${values.join(", ")}) wasn't updated`
      //   );
      // }
      if (updateOne.redirect) {
        return res.redirect(updateOne.redirect)
      }
      if (updateOne.json) {
        return res.json({
          message: 'Updated'
        })
      }
      return true
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        err.statusCode = 409
        err.message = err.sqlMessage
      }
      next(err)
    }
  }

  async deleteOne (req, res, next) {
    const { deleteOne } = this.config
    const values = deleteOne.values.map(value => req.body[value])
    try {
      const result = await query(deleteOne.query, values)
      if (result.affectedRows === 0) {
        throw new ErrorHandler(
          404,
          `${this.name} with ${values.join(' ')} wasn't deleted`
        )
      }
      if (deleteOne.redirect) {
        return res.redirect(deleteOne.redirect)
      }
      if (deleteOne.json) {
        res.json({ message: 'Deleted element' })
      }
    } catch (err) {
      next(err)
    }
  }

  async deleteMany (req, res, next) {
    const {
      deleteMany: { values, query, redirect }
    } = this.config
    try {
      const result = await query(query, values)
      if (result.affectedRows === 0) {
        throw new ErrorHandler(
          404,
          `${this.name} with ${values.join(' ')} wasn't deleted`
        )
      }
      if (redirect) {
        return res.redirect(redirect)
      }
      res.json({ message: 'Deleted elements' })
    } catch (err) {
      next(err)
    }
  }

  async lastInsertedId (_, res, next) {
    try {
      const result = await query('SELECT LAST_INSERT_ID()')
      return res.json(result)
    } catch (err) {
      next(err)
    }
  }
}
