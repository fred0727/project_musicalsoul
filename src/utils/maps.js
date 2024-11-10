const typeClassMap = {
  ONLINE: 'Clases online',
  TEACHER: 'Clases presenciales en el domicilio del profesor',
  STUDENT: 'Clases presenciales en el domicilio del alumno',
  STUDENTEACHER:
    'Clases presenciales en mi domicilio y el domicilio del alumno',
  ONLINETEACHER: 'Clases online y en mi domicilio',
  ONLINESTUDENT: 'Clases online y en el domicilio del alumno',
  ALL: 'Todos los tipos de clases'
}
const typeMap = {
  TEACHER: 'Profesor',
  STUDENT: 'Alumno'
}
const levelMap = {
  BASIC: 'Básico',
  MEDIUM: 'Medio',
  HIGH: 'Avanzado'
}
const paymentTypeMap = {
  AUTHORIZATION: 'Autorización',
  UNIQUE_PAYMENT: 'Pago único',
  SUBSCRIPTION: 'Pago por suscripción'
}
const lessonStatusMap = {
  DATETIME_MISSING: 'Pendiente de determinar fecha/hora',
  PENDING: 'Pendiente',
  COMPLETED: 'Completada',
  CANCELED: 'Cancelada'
}
const lessonTypeMap = {
  SUBSCRIPTION: 'Suscripción',
  UNIQUE: 'Única',
  TEST: 'Clase de prueba'
}
const durationMap = {
  '1800000': '30 minutos',
  '2700000': '45 minutos',
  '3600000': '1 hora',
  '5400000': '1 hora y media',
  '7200000': '2 horas',
  '9000000': '2 horas y media',
  '10800000': '3 horas'
}
const monthMap = {
  0: 'Enero',
  1: 'Febrero',
  3: 'Marzo',
  4: 'Abril',
  5: 'Junio',
  6: 'Julio',
  7: 'Agosto',
  8: 'Septiembre',
  9: 'Octubre',
  10: 'Noviembre',
  11: 'Diciembre'
}

export {
  typeClassMap,
  typeMap,
  levelMap,
  paymentTypeMap,
  lessonStatusMap,
  lessonTypeMap,
  durationMap,
  monthMap
}
