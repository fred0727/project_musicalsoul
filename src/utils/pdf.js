import PDFDocument from 'pdfkit-table'
import { getDateString } from './date'
import { monthMap } from './maps'

const padding = 15
const docWidth = 595.28 - padding * 2

function renderCurrency(value) {
  if (typeof value === 'number') {
    const decimal = value % 1
    const integer = Math.floor(value)
    // return decimal
    if (decimal === 0) {
      return `${integer} €`
    }
    return `${integer}.${decimal.toString().substring(2, 4)} €`
  }
  return value
}

export default async function generateInvoicePdf({ invoice, res }) {
  const doc = new PDFDocument({ size: 'A4' })
  doc.pipe(res)
  doc.image('static/images/pdf-logo.png', padding, padding, { width: 200 })
  doc.fontSize(8).text(`${invoice.teacherName}`, {
    align: 'center'
  })

  doc.fontSize(8).text(`Factura Nº: ${invoice.id}`, padding, 145, {
    align: 'left',
    width: docWidth
  })
  doc.fontSize(8).text(`Fecha: ${getDateString(invoice.date)}`, padding, 160, {
    align: 'left',
    width: docWidth
  })
  doc.fontSize(8).text(`Cliente: ${invoice.teacherName}`, 15, 175, {
    align: 'left',
    width: docWidth
  })
  doc.moveDown(0.5)

  doc
    .rect(doc.x, doc.y, 60, 20)
    .fillOpacity(0.3)
    .fill('gray')
    .stroke('black')
  doc.rect(doc.x, doc.y, 60, 20).stroke('black')
  doc
    .font('Helvetica-Bold')
    .fillOpacity(1)
    .fill('black')
    .text('CONCEPTO', doc.x + 6, doc.y + 7)
  // .fill('#EBF1DE')
  doc.fillOpacity(1)
  doc.moveDown()
  doc.text(
    `Servicios de captación, intermediación y gestión de cobro de alumnos mes de: ${monthMap[invoice.date.getMonth()]
    } del ${invoice.date.getFullYear()}`,
    doc.x - 6
  )

  const totals = invoice.subscriptions.reduce(
    (acc, current) => {
      acc[0] += current.serviceTotal
      acc[1] += (current.paidLessons || 0)
      acc[2] += current.serviceTotalLessons
      acc[3] += (current.gross * current.completedLessons)
      acc[4] += (current.net * current.completedLessons)
      acc[5] += (current.iva * current.completedLessons)
      return acc
    },
    [0, 0, 0, 0, 0, 0]
  )

  const headerLength = 9.5
  const serviceTypeColumnWidth = docWidth * 0.15
  const table = {
    width: docWidth,
    title: '',
    headers: [
      {
        label: 'Alumno',
        property: 'clientName',
        valign: 'center',
        align: 'center',
        headerAlign: 'center',
        vHeaderAlign: 'center',
        width: docWidth / 12
        // width: docWidth / (headerLength - 1.3)
      },
      {
        label: 'Tipo de\nservicio',
        property: 'serviceType',
        valign: 'center',
        align: 'center',
        width: docWidth / 12

        // width: docWidth / (headerLength - 4)
      },
      {
        label: 'Precio\nclase',
        property: 'paysPerHour',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12
        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Honorario\nprofesor',
        property: 'paysPerHourTarification',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12
        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Clases\ncompletadas',
        property: 'completedLessons',
        valign: 'center',
        align: 'center',
        width: docWidth / 12
        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Clases\nExtra',
        property: 'extraLessons',
        valign: 'center',
        align: 'center',
        width: docWidth / 12



        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Clases\nCobradas',
        property: 'serviceTotal',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12

        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Clases abonadas',
        property: 'paidLessons',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12


        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Total de\nclases\nimpartidas',
        property: 'serviceTotalLessons',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12


        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Honorarios\nBrutos',
        property: 'gross',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12


        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'Honorarios\nNetos',
        property: 'net',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12


        // width: docWidth / (headerLength + 3)
      },
      {
        label: 'IVA (21%)',
        property: 'iva',
        valign: 'center',
        align: 'center',
        renderer: renderCurrency,
        width: docWidth / 12


        // width: docWidth / (headerLength + 3)
      }
    ],
    datas: (() => {
      const sorted = invoice.subscriptions.sort(
        (a, b) => b.subscriptionId - a.subscriptionId
      )
      return sorted.map(subscription => ({ ...subscription, gross: (subscription.gross * subscription.completedLessons), net: (subscription.net * subscription.completedLessons), iva: (subscription.iva * subscription.completedLessons) }))
    })(),
    rows: [['Totales', ' ', ' ', ' ', ' ', ' ', ...totals]],
  }
  await doc.table(table, {
    y: 240,
    x: padding,
    width: docWidth,
    columnSpacing: 5,
    padding: 5,
    prepareHeader: function () {
      doc.font('Helvetica-Bold').fontSize(7)
    },
    prepareRow: (row, indexColumn, _, __, rectCell) => {
      doc.font('Helvetica').fontSize(8)
      if (indexColumn % 2 !== 0 && 'forEach' in row === false) {
        doc.addBackground(rectCell, 'gray', 0.1)
      }
      if ('forEach' in row) {
        doc.addBackground(rectCell, 'gray', 0.1)
        doc.font('Helvetica-Bold').fontSize(8)
      }
      if (indexColumn === 1) {
        doc.font('Helvetica-Bold').fontSize(8)
      }
    }
  })

  doc.moveDown()
  await doc.table(
    {
      headers: [
        {
          label: 'BASE IMPONIBLE',
          align: 'center',
          valign: 'center',
          width: docWidth / 4,
          renderer: renderCurrency
        },
        {
          label: '% IVA',
          align: 'center',
          valign: 'center',
          width: docWidth / 4
        },
        {
          label: 'IMPORTE IVA',
          align: 'center',
          valign: 'center',
          width: docWidth / 4,
          renderer: renderCurrency
        },
        {
          label: 'TOTAL FACTURA',
          align: 'center',
          valign: 'center',
          width: docWidth / 4,
          renderer: renderCurrency
        }
      ],
      rows: [[totals[4], '21%', totals[5], totals[2]]]
    },
    {
      x: padding,
      width: docWidth,
      columnSpacing: 5,
      padding: 1,
      prepareHeader: function () {
        doc.font('Helvetica-Bold').fontSize(8)
      },
      prepareRow: (row, indexColumn, _, __, rectCell) => {
        doc.font('Helvetica-Bold').fontSize(8)
      }
    }
  )
  doc.addPage()

  const background = doc
    .rect(padding, doc.y, docWidth, 95)
    .fillOpacity(0.3)
    .fill('#EBF1DE')

  const header = doc.rect(padding, doc.y, docWidth, 20).stroke()
  const body = doc.rect(padding, doc.y + 20, docWidth, 74).stroke()
  doc.moveDown(0.8)
  doc
    .font('Helvetica-Bold')
    .fillColor('black')
    .strokeColor('black')
    .fillOpacity(1)
    .text(
      'Anexo a Factura: RESUMEN DE LA LIQUIDACION MENSUAL A EL PROFESOR/ LA PROFESORA',
      {
        width: docWidth,
        align: 'left',
        valign: 'center'
        // x: 10
      }
    )
  let teacherPayment = totals[2] - totals[3]
  let musicnsoulComissions = totals[3]
  teacherPayment = teacherPayment > 0 ? teacherPayment : 0
  musicnsoulComissions = teacherPayment > 0 ? musicnsoulComissions : 0

  await doc.table(
    {
      headers: [
        {
          label: '',
          width: docWidth / 2,
          valign: 'center',
          align: 'left',
          headerOpacity: 0,
          headerColor: '#EBF1DE',
          backgroundOpacity: 0
        },
        {
          label: '',
          width: docWidth / 2,
          valign: 'center',
          align: 'right',
          headerOpacity: 0,
          headerColor: '#EBF1DE',
          backgroundOpacity: 0,
          renderer: renderCurrency
        }
      ],
      rows: [
        [
          'Total importe servicios prestados a sus alumnos en el mes',
          totals[2]
        ],
        [
          'Total importe comisiones Music&Soul por servicios prestados al profesor en el mes',
          musicnsoulComissions
        ],
        ['Liquidación a efectuar al profesor en el mes', teacherPayment],
        [
          'Forma de pago de la liquidación:',
          'Transferencia IBAN ES** **** **** **** ****'
        ]
      ]
    },
    {
      // y: body.y,
      x: 15,
      width: docWidth,
      padding: 5,
      prepareHeader: function () {
        doc.font('Helvetica-Bold').fontSize(8)
      },
      prepareRow: (row, indexColumn, _, __, rectCell) => {
        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fill('black')
      }
    }
  )

  doc.moveDown(2)

  doc.image('static/images/pdf-signature.png', docWidth / 2 - 200 / 2, doc.y, {
    width: 250
  })

  doc.end()
}
