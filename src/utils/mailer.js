import path from 'path'
import nodemailer from 'nodemailer'
import { typeClassMap, typeMap } from './maps.js'
import { getMMYYYY } from './date'

const emailFooter = `
  <p style="font-size: 12px; margin-top: 50px;"> ---- <br/> Información básica sobre protección de datos MUSIC & SOUL, como responsable del tratamiento, le informa que sus datos son recabados con la finalidad de: Gestión de los datos de contacto y correo electrónico para el envío de comunicaciones tanto en soporte papel como en soportes electrónicos, así como la gestión del contenido de dichas comunicaciones y el envío de publicidad y prospección comercial.. La base jurídica para el tratamiento es el consentimiento del interesado. Sus datos no se cederán a terceros salvo obligación legal. Cualquier persona tiene derecho a solicitar el acceso, rectificación, supresión, limitación del tratamiento, oposición o derecho a la portabilidad de sus datos  personales, escribiéndonos a nuestra dirección arriba indicada, o enviando un correo electrónico a contacto@musicalmsoul.com  indicando el derecho que desea ejercer. Puede obtener información adicional en nuestra página web. http://musicalmsoul.com/index.php</p>
`

const logo = `
  <div style="background-color: #1d2124!important;">
      <img style="width:250px;" src="cid:unique@logo.ee" />
  </div>
`

const attachments = [
  {
    filename: 'musicalmsoul-logo.png',
    path: path.join(process.cwd(), 'static', 'images', 'logo.png'),
    cid: 'unique@logo.ee'
  }
]

const mails = {
  newContact: async function ({ data, transporter }) {
    const whatsappURI = `https://wa.me/${data.phone}?text=${encodeURI(
      `¡Hola ${data.name}!\n\n`
    )}`
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: process.env.SENDER_EMAIL, // list of receivers
      subject: '¡Se ha recibido una nueva solicitud!', // Subject line
      html: `
        <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          ${logo}
          <h2>Se recibió una nueva solicitud de contacto en la web.</h2>
           <h4>Datos del interesado:</h4>
            <ul>
            <li>Nombre: <b>${data.name}</b></li>
            <li>Teléfono: <a href="${whatsappURI}" target="_blank"> <b>${
        data.phone
      }</b></a></li>
            <li>Perfil: <b>${typeMap[data.profile]}</b></li>
            <li>Modalidad: <b>${typeClassMap[data.profile]}</b></li>
        </ul>
        <a href="https://musicalmsoul.com/panel/dashboard/requests" target="_blank">Ver en el panel</a>
        </body>
      </html>
    `,
      attachments
    })

    return info.messageId
  },
  firstPaymentNotification: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: process.env.SENDER_EMAIL, // list of receivers
      subject: '¡Se ha confirmado un nuevo pago en la web!', // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          ${logo}
          <h2>Se ha procesado correctamente el pago de ${data.name}</h2>
          <h4>Datos del pago:</h4>
          <ul>
              <li>Fecha: <b>${data.dateHour}</b>
              <li>Identificador: <b>${data.paymentId}</b></li>
              <li>Total pagado inmediatamente: <b>${data.total || 0}€</li>
          </ul>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  },
  firstPaymentSuccessful: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: '¡Su pago ha sido confirmado!', // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          ${logo}
          <h2>¡Gracias ${data.name}! <br/>Hemos procesado su pago correctamente.
          </h2>
          <h4>Datos del pedido:</h4>
          <ul>
              <li><span>Fecha:</span><b>${data.dateHour}</b>
              <li>Identificador: <b>${data.paymentId}</b></li>
                     ${
                       data.subscriptions.length > 0
                         ? `
                <h4>Suscripciones: </h4>
                <ul>
                  ${data.subscriptions
                    .map(
                      sub => `
                    <li>
                      ${sub.name}<br/>
                      ${sub.description} al mes
                    </li>
                  `
                    )
                    .join('')}
                </ul>
                `
                         : ''
                     }
              <br />
              <li><b>Descripción pedido:</b> <br /> <br />${data.packs.reduce(
                (acc, current) =>
                  (acc += `${current.name} <br /> Tipo de pago: ${
                    current.subscription
                      ? '<span>Suscripción <br /><br /></span>'
                      : '<span>Pago único <br /><br /></span>'
                  }`),
                ''
              )}</li>
              <li>Total pagado inmediatamente: <b>${data.total || 0}€</li>
              ${
                data.subscriptionsTotal > 0
                  ? ` <li>Total a pagar primero de cada mes: <b>${data.subscriptionsTotal}€</b></li>`
                  : ''
              }
              <br />
              <li>Gestiona tus pagos y suscripciones a través de la siguiente URL: <a href="https://musicalmsoul.com/ingresar">musicalmsoul.com/ingresar</a></li>
          </ul>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  },
  paymentSuccessful: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: '¡Su pago de suscripción ha sido realizado correctamente!', // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          ${logo}
          <h2>¡Gracias ${data.name}! <br/>Hemos procesado su pago de suscripción para el mes en curso.
          </h2>
          <br />
          <h3>Tenga en cuenta que pueden pasar unos días para que su entidad bancaria refleje el cobro en su cuenta</h3>
          <h4>Datos del pago:</h4>
          <ul>
              <li><span>Fecha:</span><b>${data.dateHour}</b>
              <li>Identificador: <b>${data.paymentId}</b></li>
              <li>Subscripción: ${data.subscription.name}</li>
              <br />
              <li>Total: ${data.total} €</li>
              <br />
              <br />
              <li>Gestiona tus pagos y suscripciones a través de la siguiente URL: <a href="https://musicalmsoul.com/ingresar">musicalmsoul.com/ingresar</a></li>
          </ul>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  },
  emailVerification: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: '¡Valide su email en Music & Soul!', // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          ${logo}
          <h2>¡Hola ${data.name}!</h2>
          <br />
          <p>
            Hemos registrado su usuario correctamente. Necesitaremos que valide su correo electronico a través del siguiente enlace: <a href="${data.url}" target="__blank">Validar email</a>
          </p>
          <b>EL ENLACE TIENE UNA VALIDEZ MÁXIMA DE 2H</b>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  },
  forgotPassword: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: 'Cambio de contraseña', // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          ${logo}
          <h2>¡Hola ${data.name}!</h2>
          <br />
          <p>
            Reestablezca su contraseña a través del siguiente enlace: <a href="${data.url}" target="__blank" style="font-weight: bold">Reestablecer contraseña</a>
          </p>
          <br />
          <p>
              Si no solicitó reestablecer su contraseña, ignore este mensaje.
          </p>
          <b>EL ENLACE TIENE UNA VALIDEZ MÁXIMA DE 2H</b>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  },
  cancelSubscription: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: 'Se ha cancelado su suscripción correctamnete', // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          <div style="background-color: #1d2124;">
              ${logo}
          </div>
          <h2>¡Hola ${data.name}!</h2>
          <br />
          <p>
            Se ha cancelado correctamnete su suscripción en Music & Soul.
          </p>
          <p>
            Si no quedan suscripciones activas en tu cuenta, eliminaremos tus métodos de pago.
          </p>
          <br />
          <p>
              Si no solicitó la cancelación de su suscripción por favor contacte de inmediato a esta dirección de correo o por <a href="https://wa.me/${process.env.COMPANY_PHONE}">whatsapp</a>
          </p>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  },
  subscriptionPayments: async function ({
    data,
    transporter,
    attachments: attch
  }) {
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: `Resumen de cobros de suscripciones periódo ${getMMYYYY()}`, // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          <div style="background-color: #1d2124;">
              ${logo}
          </div>
          <h2>¡Se han cobrado las suscripciones del mes!</h2>
          <br />
          <p>
            Se adjuntará un fichero Excel con el detalle de pago
          </p>
          <br />
          ${emailFooter}
        </body>
      </html>
    `,
      attachments: [...attachments, ...attch]
    })
    return info.messageId
  },
  teacherNotification: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: `¡Hola ${data.name} ingresa al bot de telegram!`, // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          <div style="background-color: #1d2124;">
              ${logo}
          </div>
          <h2>¡Hola ${data.name}!</h2>
          <p>
            Hemos registrado su usuario en el sistema de Music & Soul como profesor.
          </p>
          <p>
            Puede ingresar al <a href="https://musicalmsoul.com/panel">panel de profesores web</a> con su email y la siguiente contraseña: <b>${data.password}</b>
            <br />
            Es recomendable cambiar la contraseña a través del panel en su área de usuario.
          </p>
          <b>
            Deberá completar un cuestionario en su apartado de usuario. <br />Este cuestionario nos permite comprobar que entiende los términos y condiciones
          </b>
          <p>
            Ingrese al bot de telegram con el siguiente enlace <a href="${data.botUrl}">Bot de Telegram</a>.
            <br/>
            A través del bot de Telegram recibirá todas las notificaciones pertinentes a la palaforma.
            <br />
            <b>Es necesario estar suscrito al bot de Telegram para trabajar con la academia.</b>
          </p>
          <p>
              Si no solicitó este registro por favor contacte de inmediato a esta dirección de correo o por <a href="https://wa.me/${process.env.COMPANY_PHONE}">whatsapp</a>
          </p>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  },
  studentCompletedClassNotification: async function ({ data, transporter }) {
    // send mail with defined transport object
    const info = await transporter.sendMail({
      from: `"Music & Soul Web 🎵" ${process.env.SENDER_EMAIL_PASSWORD}`, // sender address
      to: data.email, // list of receivers
      subject: `¡Hola ${data.name} tiene un nuevo resumen de clase!`, // Subject line
      html: `
      <!DOCTYPE html>
      <html>
        <head>
            <meta charset="utf-8">
        </head>
        <body>
          <div style="background-color: #1d2124;">
              ${logo}
          </div>
          <h2>¡Hola ${data.name}!</h2>
          <p>
            Su profesor ha marcado la clase como completada y ha dejado unos comentarios sobre la clase.
          </p>
          <ul>
          ${data.observations.reduce((acc, observation) => {
            acc += `<li><span>${observation.label}: </span><span style="font-weight: bold;">${observation.value}</span></li>`
            return acc
          }, '')}
          </ul>
          ${emailFooter}
        </body>
      </html>
    `,
      attachments
    })
    return info.messageId
  }
}

// async..await is not allowed in global scope, must use a wrapper
export default async function mail ({ data, type, attachments = [] }) {
  try {
    let transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SENDER_EMAIL, // generated ethereal user
        pass: process.env.SENDER_EMAIL_PASSWORD // generated ethereal password
      }
    })
    return mails[type]({ data, transporter, attachments })
  } catch (err) {
    console.error(err)
  }
}
