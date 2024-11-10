export default function (req, res, next) {
  if (req.session.user.type !== 'ADMIN') {
    return res.status(401).json({
      message: 'Unauthorized'
    })
  }
  next()
}
