function getTwoHoursFromNowDate () {
  const d = new Date()
  const time = d.getTime() + 2 * 60 * 60 * 1000
  return new Date(time)
}

function addZero (n) {
  if (n <= 9) {
    return '0' + n
  }
  return n.toString()
}

function getMMYYYY () {
  const d = new Date()
  return `${addZero(d.getMonth() + 1)}-${d.getFullYear()}`
}

function getDateTimeString (d) {
  const date = new Date(d)
  return `${addZero(date.getDate())}-${addZero(
    date.getMonth() + 1
  )}-${date.getFullYear()} | ${addZero(date.getHours())}:${addZero(
    date.getMinutes()
  )}`
}

function getDateString (d) {
  const date = new Date(d)
  return `${addZero(date.getDate())}-${addZero(
    date.getMonth() + 1
  )}-${date.getFullYear()}`
}

export { getTwoHoursFromNowDate, getMMYYYY, getDateTimeString, getDateString }
