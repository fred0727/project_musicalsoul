import crypto from 'crypto'
import base64url from 'base64url'

const { zeroPad, zeroUnpad } = require('./utils')

class Redsys {
  encrypt3DES (str, key) {
    const secretKey = Buffer.from(key, 'base64')
    const iv = Buffer.alloc(8, 0)
    const cipher = crypto.createCipheriv('des-ede3-cbc', secretKey, iv)
    cipher.setAutoPadding(false)
    return (
      cipher.update(zeroPad(str, 8), 'utf8', 'base64') + cipher.final('base64')
    )
  }

  decrypt3DES (str, key) {
    const secretKey = Buffer.from(key, 'base64')
    const iv = Buffer.alloc(8, 0)
    const cipher = crypto.createDecipheriv('des-ede3-cbc', secretKey, iv)
    cipher.setAutoPadding(false)
    const res =
      cipher.update(zeroUnpad(str, 8), 'base64', 'utf8') + cipher.final('utf8')
    return res.replace(/\0/g, '')
  }

  mac256 (data, key) {
    return crypto
      .createHmac('sha256', Buffer.from(key, 'base64'))
      .update(data)
      .digest('base64')
  }

  createMerchantParameters (data) {
    return Buffer.from(JSON.stringify(data), 'utf8').toString('base64')
  }

  decodeMerchantParameters (data) {
    const decodedData = JSON.parse(base64url.decode(data, 'utf8'))
    const res = {}
    Object.keys(decodedData).forEach(param => {
      res[decodeURIComponent(param)] = decodeURIComponent(decodedData[param])
    })
    return res
  }

  createMerchantSignature (key, data) {
    const merchantParameters = this.createMerchantParameters(data)
    const orderId = data.Ds_Merchant_Order || data.DS_MERCHANT_ORDER
    const orderKey = this.encrypt3DES(orderId, key)

    return this.mac256(merchantParameters, orderKey)
  }

  createMerchantSignatureNotif (key, data) {
    const merchantParameters = this.decodeMerchantParameters(data)
    const orderId = merchantParameters.Ds_Order || merchantParameters.DS_ORDER
    const orderKey = this.encrypt3DES(orderId, key)

    const res = this.mac256(data, orderKey)
    return base64url.encode(res, 'base64')
  }

  merchantSignatureIsValid (signA, signB) {
    return (
      base64url.decode(signA, 'base64') === base64url.decode(signB, 'base64')
    )
  }
}

function createPayment ({
  description,
  total,
  titular,
  orderId,
  paymentId,
  extra
}) {
  const redsys = new Redsys()
  const mParams = {
    DS_MERCHANT_AMOUNT: total,
    DS_MERCHANT_ORDER: paymentId,
    DS_MERCHANT_MERCHANTCODE: process.env.TPV_CODE,
    DS_MERCHANT_CURRENCY: process.env.TPV_CURRENCY,
    DS_MERCHANT_TRANSACTIONTYPE: process.env.TPV_TRANSACTION_TYPE,
    DS_MERCHANT_TERMINAL: process.env.TPV_TERMINAL,
    DS_MERCHANT_PRODUCTDESCRIPTION: description,
    DS_MERCHANT_TITULAR: titular,
    DS_MERCHANT_MERCHANTURL: `${process.env.BASE_DOMAIN +
      process.env.TPV_REDIRECT_URL}?id=${orderId}${extra ? extra : ''}`,
    DS_MERCHANT_URLOK: `${process.env.BASE_DOMAIN +
      process.env.TPV_URL_OK}?id=${orderId}${extra ? extra : ''}`,
    DS_MERCHANT_URLKO: `${process.env.BASE_DOMAIN +
      process.env.TPV_URL_KO}?id=${orderId}${extra ? extra : ''}`,
    DS_MERCHANT_IDENTIFIER: 'REQUIRED',
    DS_MERCHANT_COF_TYPE: 'R', // https://pagosonline.redsys.es/funcionalidades-COF.html
    DS_MERCHANT_COF_INI: 'S' // https://pagosonline.redsys.es/funcionalidades-COF.html
  }

  return {
    signature: redsys.createMerchantSignature(process.env.TPV_SECRET, mParams),
    merchantParameters: redsys.createMerchantParameters(mParams),
    raw: mParams
  }
}

function createPaymentWithMerchantId ({
  description,
  total,
  titular,
  orderId,
  paymentId,
  merchantIndentifier,
  merchantCofTxnid,
  cardNumber,
  cardExpiration,
  email
}) {
  const redsys = new Redsys()
  const mParams = {
    DS_MERCHANT_AMOUNT: total,
    DS_MERCHANT_ORDER: paymentId,
    DS_MERCHANT_MERCHANTCODE: process.env.TPV_CODE,
    DS_MERCHANT_CURRENCY: process.env.TPV_CURRENCY,
    DS_MERCHANT_TRANSACTIONTYPE: 0,
    DS_MERCHANT_TERMINAL: process.env.TPV_TERMINAL,
    DS_MERCHANT_COF_TXNID: merchantCofTxnid,
    DS_MERCHANT_IDENTIFIER: merchantIndentifier,
    DS_MERCHANT_PRODUCTDESCRIPTION: description,
    DS_MERCHANT_TITULAR: titular,
    // DS_MERCHANT_MERCHANTURL: `${process.env.BASE_DOMAIN +
    //   process.env.TPV_REDIRECT_URL}/${orderId}`,
    DS_MERCHANT_EXCEP_SCA: 'MIT',
    DS_MERCHANT_COF_INI: 'N',
    DS_MERCHANT_DIRECTPAYMENT: 'true',
    DS_MERCHANT_COF_TYPE: 'R' // https://pagosonline.redsys.es/funcionalidades-COF.html
    // DS_MERCHANT_PAN: cardNumber,
    // DS_MERCHANT_EXPIRYDATE: cardExpiration
  }
  return {
    signature: redsys.createMerchantSignature(process.env.TPV_SECRET, mParams),
    merchantParameters: redsys.createMerchantParameters(mParams),
    raw: mParams
  }
}

export { Redsys, createPayment, createPaymentWithMerchantId }
