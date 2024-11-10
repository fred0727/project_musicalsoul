import { v4 as uuidv4 } from 'uuid'
import query from '../db.js'

// const clientRoutes = ['/area']
// const adminRoutes = ['/panel']

function oneDay () {
  return 24 * 60 * 60 * 1000
}

function setCookie (uid, res) {
  res.cookie('session_id', uid || '', {
    maxAge: uid ? oneDay() * 7 : 0, // one week or zero
    httpOnly: process.env.NODE_ENV === 'production',
    signed: process.env.NODE_ENV === 'production',
    secure: process.env.NODE_ENV === 'production'
  })
}

async function getUser (req) {
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
      const [client] = await query(
        'SELECT id, name, surname, email, type, clients.questionnaire, valid FROM sessions JOIN clients ON clients.id = sessions.user_id WHERE uid = ?',
        [id]
      )
      const [teacher] = await query(
        'SELECT id, name, email, type, valid, movility FROM sessions JOIN teachers ON teachers.id = sessions.user_id WHERE uid = ?',
        [id]
      )
      return user || client || teacher || null
    } catch (err) {
      console.log(err)
      return null
    }
  }
  return null
}

export default async function (req, res, next) {
  if (!req.session) {
    req.session = {
      user: {
        type: 'NONE'
      }
    }
  }
  const { url } = req
  if (url.endsWith('/')) {
    url.slice(0, url.length - 1)
  }
  req.session.save = async function ({ id, type }) {
    try {
      const uid = uuidv4()
      await query('INSERT INTO sessions (uid, user_id, type) values(?, ?, ?)', [
        uid,
        id,
        type
      ])
      setCookie(uid, res)
    } catch (err) {
      console.error('Problem saving session', err)
    }
  }
  req.session.destroy = async function (id) {
    try {
      const uid =
        process.env.NODE_ENV === 'production'
          ? req.signedCookies.session_id
          : req.cookies.session_id
      await query('DELETE FROM sessions WHERE uid = ?', [uid])
      setCookie('', res)
    } catch (err) {
      console.error('Problem distroying session', err)
    }
  }

  try {
    const currentSession = await getUser(req)
    // User does not have any session
    if (currentSession) {
      req.session.user = currentSession
      if (url.includes('area') && currentSession.type !== 'CLIENT') {
        return res.redirect('/ingresar')
      }
      return next()
    }
    setCookie('', res) // Clear cookie
    if (
      (url.includes('panel/') || url.includes('area')) &&
      url !== '/panel/' &&
      url !== '/panel/login'
    ) {
      return res.redirect('/')
    }
    return next()
  } catch (err) {
    return next(err)
  }
}
