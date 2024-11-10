function addZero (n) {
  if (n < 9) {
    return `0${n}`
  }
  return `${n}`
}

function getDateTime (date, time) {
  const d = new Date(date)
  return date && time
    ? `${addZero(d.getDate())} / ${addZero(d.getMonth() + 1)} / ${d.getFullYear()} | ${time}`
    : 'Sin determinar'
}

export default {
  notifyDeleteLesson (teacher, date, time, client) {
    return `
*Hola ${teacher}* 🤟

Music & Soul ha cancelado tu clase

${
  date && time
    ? `Fecha: ${getDateTime(date, time)}`
    : 'La clase no tenía un horario asignado'
}
Alumno: ${client}
      `
  },
  notifySchedule (teacher, clientPhone, clientName, date, time, type) {
    return `
Hola *${teacher}* 🤟

Gracias por confirmar el horario de tu clase con *${clientName}*

${
  clientPhone
    ? `Puede contactar al alumno a través de su teléfono: *${clientPhone}*`
    : ''
}


*Horario de la clase:*
Fecha: *${getDateTime(date, time)}*

Tipo de clase: ${type}
        `
  },
  notifyNewLessonWithoutSchedule (teacher, client, type) {
    return `
*Hola ${teacher}* 🤟

Tienes una clase pendiente de determinar horario con ${client}

Tipo de clase: ${type}
    `
  },
  //   notifyNewLessonWithSchedule (teacher, client, date, time, type) {
  //     return `
  // Hola ${teacher}, 🤟

  // Se ha registrado una clase con *${client}*

  // *Horario de la clase*
  // *${getDateTime(date, time)}*

  // Tipo de clase: ${type}
  // `
  //   },
  notifyNewLesson ({ teacherName, clientName, clientPhone, type, service }) {
    return `
Hola ${teacherName} 🤟,

Se ha registrado una clase nueva con *${clientName}*

El teléfono de contacto del alumno es: ${clientPhone || '*Sin determinar*'}

Debes asignar una fecha y hora para esta clase desde tu área personal en la web.

Tipo de clase: *${type}*
Instrumento: *${service}*
`
  },
  nofifyNewSubscriptionAssigment ({ teacherName, clientName, type, service }) {
    return `
Hola ${teacherName}

Hemos asignado una nueva suscripción a tus alumnos.

Puedes gestionar las clases de la suscripción a través de tu área personal en la web.

El nombre del alumno cuya subscripción se ha asignado es: ${clientName}.
    `
  }
}
