import query from '../db.js'
import { createPayment } from '../utils/redsys/api-redsys.js'
import { getPaymentId } from '../utils/getPaymentId.js'
import { durationMap } from '../utils/maps.js'

class PublicController {
  constructor () {
    this.pages = {
      'public/index': {
        title: 'Music & Soul | ¿Quienes somos?',
        linkId: 1
      },
      'public/ensenanza': {
        title: 'Music & Soul | Enseñanza',
        linkId: 2
      },
      'public/formacion': {
        title: 'Music & Soul | Formación',
        linkId: 3
      },
      'public/titulos': {
        title: 'Music & Soul | Títulos',
        linkId: 4
      },
      'public/precios': {
        title: 'Music & Soul | Precios',
        linkId: 5
      },
      'public/contacto': {
        title: 'Music & Soul | Contacto',
        linkId: 6
      },
      'public/preguntas-frecuentes': {
        title: 'Music & Soul | Preguntas Frecuentes',
        linkId: 7
      },
      'public/privacidad': {
        title: 'Music & Soul | Aviso de Privacidad',
        linkId: 8
      },
      'public/terminos-condiciones': {
        title: 'Music & Soul | Terminos y Condiciones',
        linkId: 9
      },
      'public/carrito': {
        title: 'Music & Soul | Carrito de Compra',
        linkId: 10
      },
      'public/resumen-pago': {
        title: 'Music & Soul | Resumen de su compra',
        linkId: -1
      }
    }
  }

  async renderAll (req, res, next) {
    const url = new URL(process.env.BASE_DOMAIN + req.url)
    req.searchParams = url.searchParams
    const ejs = url.pathname === '/' ? 'public/index' : `public${url.pathname}`
    if (!this.pages[ejs]) {
      return res.render('public/404', { title: 404, session: req.session })
    }
    switch (ejs) {
      case 'public/contacto':
        return this.renderContacto(req, res, next)
      case 'public/precios':
        return this.renderPrecios(req, res, next)
      case 'public/carrito':
        return this.renderCarrito(req, res, next)
      default:
        return res.render(ejs, {
          ...this.pages[ejs],
          session: req.session
        })
    }
  }

  async renderContacto (req, res, next) {
    try {
      const services = await query('SELECT * FROM services')
      const provinces = await query('SELECT * FROM provinces WHERE active = 1')
      return res.render('public/contacto', {
        ...this.pages['public/contacto'],
        session: req.session,
        services,
        provinces
      })
    } catch (err) {
      console.error(err)
      next(err)
    }
  }

  async renderPrecios (req, res, next) {
    try {
      let packs = await query('SELECT * FROM packs')
      packs = packs.map(pack => ({
        ...pack,
        duration: durationMap[pack.duration]
      }))
      return res.render('public/precios', {
        ...this.pages['public/precios'],
        session: req.session,
        packs
      })
    } catch (err) {
      console.error(err)
      next(err)
    }
  }

  calculateTotal (packs) {
    const date = new Date()
    const isFirstOfMonth = date.getDate() === 1
    return {
      total: packs.reduce((acc, current) => {
        // Only charge for subscriptions if it's the first day of the month
        if ((isFirstOfMonth && current.subscription) || !current.subscription) {
          return current.price + acc
        }
        return acc
      }, 0),
      subscriptionsTotal: packs.reduce((acc, current) => {
        if (current.subscription) {
          return current.price + acc
        }
        return acc
      }, 0)
    }
  }

  async renderCarrito (req, res, next) {
    try {
      const { email, name, surname } = req.session.user
      const [{ number: paymentCounter }] = await query(
        'SELECT number FROM paymentCounter WHERE id = ?',
        [1]
      )
      const { total, subscriptionsTotal } = this.calculateTotal(
        req.session.shoppingCart.packs
      )
      const payment = createPayment({
        total: total + '00',
        orderId: paymentCounter,
        paymentId: getPaymentId(paymentCounter),
        description: req.session.shoppingCart.packs
          .map(pack => pack.name)
          .join(' | '),
        titular: `${name} ${surname}`,
        email
      })
      // Update payment counter
      await query('UPDATE paymentCounter SET number = ? WHERE id = ?', [
        Number(paymentCounter) + 1,
        1
      ])
      return res.render('public/carrito', {
        ...this.pages['public/carrito'],
        payment,
        total,
        subscriptionsTotal,
        session: req.session
      })
    } catch (err) {
      console.error(err)
      next(err)
    }
  }
}
export default new PublicController()
