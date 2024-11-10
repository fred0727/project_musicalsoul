import query from '../db.js'
import CRUD from '../utils/CRUD.js'
import { getPaymentId } from '../utils/getPaymentId'
import { paymentTypeMap } from '../utils/maps'
import fetch from 'node-fetch'

import mail from '../utils/mailer.js'
import {
  createPaymentWithMerchantId,
  createPayment,
  Redsys
} from '../utils/redsys/api-redsys'

class PaymentController extends CRUD {
  decodeAndCheckSignature(req) {
    const redsys = new Redsys()
    const query = req.query
    const merchantParams =
      query.Ds_MerchantParameters || query.DS_MERCHANTPARAMETERS
    const signature = query.Ds_Signature || query.DS_SIGNATURE

    const merchantParamsDecoded = redsys.decodeMerchantParameters(
      merchantParams
    )
    const merchantSignatureNotif = redsys.createMerchantSignatureNotif(
      process.env.TPV_SECRET,
      merchantParams
    )
    const dsResponse = parseInt(
      merchantParamsDecoded.Ds_Response || merchantParamsDecoded.DS_RESPONSE,
      10
    )

    if (
      redsys.merchantSignatureIsValid(signature, merchantSignatureNotif) &&
      dsResponse > -1 &&
      dsResponse < 100
    ) {
      // TPV payment is OK;
      return {
        validSignature: true,
        data: merchantParamsDecoded
      }
    }
    // 'TPV payment is KO;
    return {
      validSignature: false,
      data: merchantParamsDecoded
    }
  }
  async sendPaymentNotificationMail({ ...props }) {
    const mailData = {
      data: {
        paymentId: props.data.Ds_Order || props.data.DS_ORDER,
        total: (props.data.Ds_Amount || props.data.DS_AMOUNT)
          .toString()
          .substring(
            0,
            (props.data.Ds_Amount || props.data.DS_AMOUNT).length - 2
          ),
        dateHour: `${new Date().toLocaleDateString()}`,
        ...props,
        subscription: {
          name: props.subscription.packName
        }
      }
    }
    await mail({
      ...mailData,
      type: 'paymentSuccessful'
    })
  }
  async sendConfirmationMails({ ...props }) {
    const mailData = {
      data: {
        paymentId: props.data.Ds_Order || props.data.DS_ORDER,
        total: (props.data.Ds_Amount || props.data.DS_AMOUNT)
          .toString()
          .substring(
            0,
            (props.data.Ds_Amount || props.data.DS_AMOUNT).length - 2
          ),
        dateHour: `${props.data.Ds_Date || props.data.DS_DATE} ${props.data
          .Ds_Hour || props.data.DS_HOUR}`,
        ...props
      }
    }
    await Promise.all([
      mail({
        ...mailData,
        type: 'firstPaymentSuccessful'
      }),
      mail({
        ...mailData,
        type: 'firstPaymentNotification'
      })
    ])
  }
  async insertCard({ data, clientId }) {
    await query(
      'REPLACE INTO cards (client_id, merchant_identifier, merchant_cof_txnid, c_number, expiry_date) VALUES (?, ?, ?, ?, ?)',
      [
        clientId,
        data.Ds_Merchant_Identifier || data.DS_MERCHANT_IDENTIFIER,
        data.Ds_Merchant_Cof_Txnid || data.DS_MERCHANT_COF_TXNID,
        data.Ds_Card_Number || data.DS_CARD_NUMBER,
        data.Ds_ExpiryDate || data.DS_EXPIRY_DATE
      ]
    )
    const [{ 'LAST_INSERT_ID()': cardId }] = await query(
      'SELECT LAST_INSERT_ID()'
    )
    return cardId
  }
  getQueryString(arr, values = 2) {
    let q = ''
    for (let i = 0; i < arr.length; i++) {
      if (i === arr.length - 1) {
        q += values === 3 ? '(?, ?, ?)' : '(?, ?)'
        continue
      }
      q += values === 3 ? '(?, ?, ?),' : '(?, ?),'
    }
    return q
  }
  async updatePaymentCounter() {
    try {
      let [{ number: paymentCounter }] = await query(
        'SELECT number FROM paymentCounter WHERE id = ?',
        [1]
      )
      // Update payment counter
      await query('UPDATE paymentCounter SET number = ? WHERE id = ?', [
        Number(paymentCounter) + 1,
        1
      ])
      return paymentCounter
    } catch (err) {
      throw err
    }
  }
  async updatePaymentMethod(req, res, next) {
    const { name, email } = req.session.user
    if (!name || !email) {
      res.redirect('/')
    }
    try {
      let paymentCounter = await this.updatePaymentCounter()
      paymentCounter++
      const payment = createPayment({
        total: 0,
        orderId: paymentCounter,
        paymentId: getPaymentId(paymentCounter),
        description: 'Actualización método de pago para suscripciones',
        titular: name,
        email,
        extra: '&confirmation=true'
      })
      return res.render('public/actualizar-metodo-pago', {
        payment,
        session: req.session,
        title: 'Music & Soul | Actualizar método de pago',
        linkId: -1
      })
    } catch (err) {
      next(err)
    }
  }
  async delay(ts) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve()
      }, ts)
    })
  }
  async doPayments(subscriptions) {
    const payments = []
    // Create payments array
    for await (let subscription of subscriptions) {
      let paymentCounter = await this.updatePaymentCounter()
      paymentCounter++
      const paymentId = getPaymentId(paymentCounter)
      const { signature, merchantParameters } = createPaymentWithMerchantId({
        total: subscription.price.toString() + '00',
        paymentId: paymentId,
        orderId: paymentCounter,
        merchantIndentifier: subscription.merchant_identifier,
        merchantCofTxnid: subscription.merchant_cof_txnid,
        titular: `${subscription.clientName} ${subscription.clientSurname}`,
        description: `Pago suscripción ${subscription.packName}`,
        cardNumber: subscription.cardNumber,
        cardExpiration: subscription.cardExpiration
      })
      payments.push({
        promise: fetch(process.env.REDSYS_REST, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            Ds_SignatureVersion: 'HMAC_SHA256_V1',
            Ds_Signature: signature,
            Ds_MerchantParameters: merchantParameters
          })
        }),
        id: paymentId,
        subscriptionId: subscription.id
      })
    }
    const errors = []
    const success = []
    let i = 0
    for await (let payment of payments.map(item => item.promise)) {
      try {
        const result = await payment
        const query = await result.json()
        console.log(
          `[*] Procesando pago ${payments[i].id}  de ${subscriptions[i].clientName} ${subscriptions[i].clientSurname}`
        )
        console.log(query.errorCode)
        if (query.errorCode) {
          console.log(
            `[**] Error en pago de ${subscriptions[i].clientName}. Código: ${query.errorCode}`
          )
          errors.push({
            ...query,
            ...subscriptions[i],
            id: payments[i].id,
            data: {
              Ds_Order: payments[i].id,
              Ds_Amount: subscriptions[i].price.toString() + '00'
            },
            subscriptionPayment: true,
            subscriptionId: payments[i].subscriptionId
          })
          await this.insertPayment(errors[errors.length - 1])
          continue
        }
        const { data, validSignature } = this.decodeAndCheckSignature({
          query
        })
        if (!validSignature) {
          console.log(
            `[**] Error en pago de ${subscriptions[i].clientName} ${subscriptions[i].clientSurname}. Código: ${data.Ds_Response || data.DS_RESPONSE}`
          )
          errors.push({
            ...subscriptions[i],
            data: {
              Ds_Order: payments[i].id,
              Ds_Amount: subscriptions[i].price.toString() + '00'
            },
            errorCode: data.Ds_Response || data.DS_RESPONSE,
            id: payments[i].id,
            subscriptionPayment: true,
            subscriptionId: payments[i].subscriptionId
          })
          await this.insertPayment(errors[errors.length - 1])
          continue
        }
        console.log(
          `[*] Pago ${payments[i].id} de ${subscriptions[i].clientName} procesado correctamente`
        )

        success.push({
          ...subscriptions[i],
          data,
          packs: [
            {
              packId: subscriptions[i].packId
            }
          ],
          subscriptionPayment: true,
          id: payments[i].id,
          subscriptionId: payments[i].subscriptionId
        })

        this.sendPaymentNotificationMail({
          name: subscriptions[i].clientName,
          email: subscriptions[i].clientEmail,
          subscription: subscriptions[i],
          data,
        })
        await this.insertPayment(success[success.length - 1])
      } catch (err) {
        throw err
      } finally {
        i++
        await this.delay(payments.length > 1 ? 10000 : 100)
      }
    }
    return {
      errors,
      success
    }
  }
  async doSubscriptionPayments (req, res, next) {
    try {
      const result = await this.subscriptionPayments()
      res.send({
        message: 'Subscriptions processed',
        // data: result.success.map(data => { // Mira si vale la pena devolver esto al cliente
        //   return {
        //     id: data.id,
        //     packName: data.packName,
        //     data
        //   }
        // }),
      })
    } catch (err) {
      console.error(err)
      next(err)
    }
  }
  async subscriptionPayments() {
    try {
      // Get subscriptions
      const subscriptions = await query(
        `
        SELECT subscriptions.id as id, packs.id as packId, cards.id as cardId, cards.merchant_cof_txnid, cards.merchant_identifier, cards.c_number as cardNumber, cards.expiry_date as cardExpiration, packs.name as packName, packs.id as packId, packs.price as price, clients.id as clientId, clients.name as clientName, clients.surname as clientSurname, clients.email as clientEmail
        FROM subscriptions
        LEFT JOIN clients
        ON subscriptions.client_id = clients.id
        LEFT JOIN cards
        ON cards.client_id = clients.id
        LEFT JOIN packs
        ON subscriptions.pack_id = packs.id
        WHERE subscriptions.status = ?
      `,
        [1]
      )
      return this.doPayments(subscriptions)
    } catch (err) {
      throw err
    }
  }
  getFirstDayOfNextMonth() {
    const date = new Date();
    // if its first of month, it should return today
    if (date.getDate() === 1) {
      return date
    }
    return new Date(date.getFullYear(), date.getMonth() + 1, 1);
  }
  async insertSubscription({ subscriptions, clientId }) {
    const q = this.getQueryString(subscriptions, 3) // 3 values for this query
    const result = await query(
      `INSERT INTO subscriptions (client_id, pack_id, starts) VALUES ${q}`,
      [...subscriptions.map(sub => [clientId, sub.packId, this.getFirstDayOfNextMonth()])].flat() // will start first day next month or today if its date 1
    )
    // Get all the ids of the inserted subscriptions
    const ids = []
    for (let i = 0; i < result.affectedRows; i++) {
      ids.push({ subscriptionId: result.insertId + i, ...subscriptions[i] })
    }
    return ids;
  }
  getPaymentType({ data, subscriptionPayment }) {
    if (subscriptionPayment) {
      return 'SUBSCRIPTION'
    }
    return Number(data.Ds_Amount || data.DS_AMOUNT) === 0 // If we are chargin 0 euros its just an authorization payment
      ? 'AUTHORIZATION'
      : 'UNIQUE_PAYMENT'
  }
  async trySubscriptionPayment(req, res, next) {
    try {
      const subscriptions = await query(
        `
        SELECT
          subscriptions.id as id,
          packs.id as packId,
          cards.id as cardId,
          cards.merchant_cof_txnid,
          cards.merchant_identifier,
          cards.c_number as cardNumber,
          cards.expiry_date as cardExpiration,
          packs.name as packName,
          packs.id as packId,
          packs.price as price,
          clients.id as clientId,
          clients.name as clientName,
          clients.surname as clientSurname,
          clients.email as clientEmail
        FROM
          subscriptions
        LEFT JOIN
          clients
        ON
          subscriptions.client_id = clients.id
        LEFT JOIN
          cards
        ON
          cards.client_id = clients.id
        LEFT JOIN
          packs
        ON
          subscriptions.pack_id = packs.id
        WHERE
          subscriptions.status = ? AND subscriptions.id = ?
      `,
        [1, req.body.id]
      )
      if (subscriptions.length !== 1) {
        return res.status(404).json({
          message: 'Subscription not found'
        })
      }
      const { success, errors } = await this.doPayments(subscriptions)
      if (success.length > 0) {
        return res.json({
          message: 'Payment successful',
          id: success[0].id
        })
      }
      return res.status(424).json({
        message: 'Payment failure',
        id: errors[0].id
      })
    } catch (err) {
      next(err)
    }
  }
  async insertPayment({
    cardId,
    clientId,
    data,
    packs,
    subscriptionPayment = false,
    errorCode,
    subscriptionId
  }) {
    await query(
      'INSERT INTO payments (id, client_id, card_id, total, type, subscription_id, error_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        data.Ds_Order || data.DS_ORDER,
        clientId,
        cardId,
        data.Ds_Amount || data.DS_AMOUNT,
        this.getPaymentType({ data, subscriptionPayment }),
        subscriptionId,
        errorCode || null
      ]
    )
    if (packs && packs.length > 0) {
      const q = this.getQueryString(packs)
      await query(
        `INSERT INTO payments_packs (payment_id, pack_id) VALUES ${q}`,
        [
          ...packs.map(pack => [data.Ds_Order || data.DS_ORDER, pack.packId])
        ].flat()
      )
    }
    await this.updatePaymentCounter()
  }
  async ok(req, res, next) {
    const cardConfirmation = Boolean(req.query.confirmation)
    const { packs } = req.session.shoppingCart
    const subscriptions = packs.filter(pack => pack.subscription)
    const { id, name, email } = req.session.user
    const { data, validSignature } = this.decodeAndCheckSignature(req)
    const paymentId = data.DS_ORDER || data.Ds_Order
    if (validSignature) {
      try {
        const clientId = id
        let cardId = await this.insertCard({ data, clientId })
        const isFirstOfMonth = new Date().getDate() === 29
        if (subscriptions.length > 0) {
          const subscriptionsWithIds = await this.insertSubscription({
            subscriptions,
            clientId
          })
          // get packs and deduce price
          for await (let { subscriptionId, price } of subscriptionsWithIds) {
            // unique id for this kind of payments
            await this.insertPayment({
              data: { ...data, Ds_Order: `${paymentId}-${subscriptionId}`, Ds_Amount: isFirstOfMonth ? `${price}00` : '0' },
              cardId,
              clientId,
              packs,
              subscriptionPayment: isFirstOfMonth ? true : false, // be explicit
              subscriptionId: subscriptionId
            })
          }
        }
        if ((data.Ds_Amount || data.DS_AMOUNT) > 0) {
          await this.insertPayment({
            data,
            cardId,
            clientId,
            packs,
            subscriptionPayment: false,
            subscriptionId: null
          })
        }
        // Send confirmation mail
        await this.sendConfirmationMails({
          name,
          email,
          data,
          packs,
          subscriptions,
          subscriptionsTotal: subscriptions.reduce(
            (acc, current) => (acc += current.price),
            0
          )
        })
        // Clear shopping cart
        await req.session.deleteShoppingCart()
        return res.render('public/pago-procesado', {
          data: { name, paymentId: data.Ds_Order || data.DS_ORDER },
          session: req.session,
          title: 'Music & Soul | Pago procesado correctamente',
          subscriptions,
          cardConfirmation
        })
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.render('public/pago-ko', {
            title: 'Hemos tenido un error procesando su pago',
            session: req.session,
            message:
              'Se encontró el identificador de pago en el sistema, es posible que su pago ya haya sido procesado.',
            href: '/area'
          })
        }
        next(err)
      }
    } else {
      console.log('Invalid signature!!!!!!! Alert!')
      this.ko(req, res)
    }
  }
  ko(req, res) {
    res.render('public/pago-ko', {
      ...(req.reason || { message: null }),
      session: req.session,
      title: 'Pago no procesado',
      href: '/carrito'
    })
  }
  async readWithSubscription(req, res, next) {
    if (!req.query.subscriptionId) {
      return res.status(400).send({
        message: 'Bad request, subscription ID is missing'
      })
    }
    try {
      const payments = await query('SELECT * FROM payments WHERE subscription_id = ?', [req.query.subscriptionId])
      res.send({
        data: payments
      })
    } catch (err) {
      next(err)
    }
  }
}

export default new PaymentController({
  name: 'Payments', // Name
  readMany: {
    query: `
        SELECT
          payments.id as id,
          payments.type as paymentType,
          payments.total as total,
          payments.timestamp as timestamp,
          payments.subscription_id as subscriptionId,
          payments.error_code as errorCode,
          clients.name as clientName,
          clients.surname as clientSurname,
          clients.email as clientEmail
        FROM payments
        JOIN clients
        ON payments.client_id = clients.id
        WHERE
          payments.id LIKE ? OR clients.name LIKE ? OR IFNULL(payments.error_code, 'success') LIKE ?
        ORDER BY timestamp DESC
        LIMIT ? OFFSET ?
    `,
    count: 'SELECT COUNT(id) as max FROM payments',
    type: 'query',
    search({ filter, page = 1 }) {
      const offset = +page === 1 ? 0 : 10 * (parseInt(page) - 1)
      filter = filter ? `%${filter}%` : null
      return [
        ...Array(3)
          .fill(1)
          .map(() => filter || '%'),
        10,
        offset
      ]
    },
    limit: 10,
    json: true
  },
  params: {
    paymentTypeMap
  }
})
