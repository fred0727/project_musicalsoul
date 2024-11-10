function getPaymentId (id) {
  const d = new Date()
  const m = d.getMonth() + 1
  const date = d.getDate() > 9 ? d.getDate() : '0' + d.getDate()
  const month = m > 9 ? `${m}` : `0${m}`
  const year = d.getFullYear()
  return `${year}${month}${date}${9999 - id}`
}

export { getPaymentId }
