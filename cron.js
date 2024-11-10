// const query
import cron from 'node-cron'
import query from './src/db'
import PaymentController from './src/controllers/payment.controller'
import XLSX from 'xlsx'
import fs from 'fs'
import path from 'path'
import errorCodes from './src/utils/redsys/error-codes'
import mail from './src/utils/mailer'

const formats = {
  subscriptions (arr) {
    let rows = arr.success.map(item => ({
      'Identificador de pago': item.id,
      'Nombre alumno': item.clientName,
      'Nombre de pack': item.packName,
      Total: item.price,
      Resultado: 'Satisfactorio'
    }))
    rows.push({
      'Identificador de pago': 'Total cobrado en suscripciones:',
      'Nombre alumno': '',
      'Nombre de pack': '',
      Total: arr.success.reduce((acc, current) => (acc += current.price), 0)
    })
    // blank space?
    rows.push({})
    const errorRows = arr.errors.map(item => ({
      'Identificador de pago': item.id,
      'Nombre alumno': item.clientName,
      'Nombre de pack': item.packName,
      Total: item.price,
      Resultado: 'No procesado',
      'Detalle de error': errorCodes[item.errorCode] || item.errorCode
    }))

    rows = [...rows, ...errorRows]
    return rows
  }
}

function writeXLSX ({ list, name, fileName }) {
  const workSheet = XLSX.utils.json_to_sheet(list)
  const workBook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workBook, workSheet, name)
  const buffer = XLSX.write(workBook, {
    bookType: 'xlsx',
    type: 'buffer'
  })
  return fs.promises.writeFile(`./payments/${fileName}.xlsx`, buffer)
}

async function subscriptionPayment () {
  try {
    const result = await PaymentController.subscriptionPayments()
    const fileName = `Pagos ${new Date().getMonth() +
      1} - ${new Date().getFullYear()}`
    await writeXLSX({
      list: formats.subscriptions(result),
      name: 'Pagos',
      fileName
    })
    await mail({
      type: 'subscriptionPayments',
      data: {
        email: 'contacto@musicalmsoul.com'
      },
      attachments: [
        {
          filename: `${fileName}.xlsx`,
          path: path.join(__dirname, 'payments', `${fileName}.xlsx`),
          cid: 'unique@excel.ee'
        }
      ]
    })
  } catch (err) {
    console.log(err)
  }
}
subscriptionPayment()

// cron.schedule(
//   "* * * * *",

// );
