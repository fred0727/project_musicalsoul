const loader = document.querySelector('.loader')
const formBody = document.querySelector('.form__body')
const studentButton = document.querySelector('#studentButton')
const teacherButton = document.querySelector('#teacherButton')
const studentForm = document.querySelector('#student')
const teacherForm = document.querySelector('#teacher')
const provinceSelectors = document.querySelectorAll('select[name="provinceId"]')
const districtSelectors = document.querySelectorAll('select[name="districtId"]')
const neighborhoodSelectors = document.querySelectorAll(
  'select[name="neighborhoodId"]'
)

studentButton.addEventListener('click', () => {
  if (formBody.getAttribute('active') !== 'student') {
    studentButton.classList.toggle('form__button--active')
    teacherButton.classList.toggle('form__button--active')
    formBody.setAttribute('active', 'student')
  }
})

teacherButton.addEventListener('click', () => {
  if (formBody.getAttribute('active') !== 'teacher') {
    studentButton.classList.toggle('form__button--active')
    teacherButton.classList.toggle('form__button--active')
    formBody.setAttribute('active', 'teacher')
  }
})

async function get (endpoint) {
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.host}${endpoint}`
    )
    return response.json()
  } catch (err) {
    alert(err)
  }
}

async function post (endpoint, body) {
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.host}${endpoint}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response.json()
  } catch (err) {
    alert(err)
  }
}

const defaultOption = '<option selected disabled value="">Seleccionar</option>'

function clean (element) {
  element.innerHTML = defaultOption
  element.disabled = true
  element.value = ''
}

function loading (state) {
  if (state) {
    loader.style.display = 'flex'
  } else {
    setTimeout(() => {
      loader.style.display = 'none'
    }, 500)
  }
}

for (let i = 0; i < districtSelectors.length; i++) {
  provinceSelectors[i].addEventListener('change', async function () {
    loading(true)
    clean(districtSelectors[i])
    clean(neighborhoodSelectors[i])
    const endpoint = `/api/districts/${this.value}`
    const response = await get(endpoint)
    if (response.data) {
      let options = defaultOption
      for (const option of response.data) {
        options += `<option value=${option.id}>${option.name}</option>`
      }
      districtSelectors[i].innerHTML = options
      districtSelectors[i].disabled = false
    }
    loading(false)
  })
}

for (let i = 0; i < districtSelectors.length; i++) {
  districtSelectors[i].addEventListener('change', async function () {
    loading(true)
    const endpoint = `/api/neighborhoods/${this.value}`
    const response = await get(endpoint)
    if (response.data) {
      let options = defaultOption
      for (const option of response.data) {
        options += `<option value=${option.id}>${option.name}</option>`
      }
      neighborhoodSelectors[i].innerHTML = options
      neighborhoodSelectors[i].disabled = false
    }
    loading(false)
  })
}

function toggleSubmitState (element, state) {
  element.classList.toggle('loading')
  element.disabled = state
}

function formatForm (e) {
  const elements = e.target.elements
  const form = {}
  for (const element of Array.from(elements)) {
    if (element.type === 'checkbox') {
      form[element.name] = element.value === 'on'
      continue
    }
    form[element.name] =
      JSON.parse(element.getAttribute('values')) || element.value
  }
  if (e.target.id === 'teacher') {
    if (
      typeof form.availableHours === 'string' ||
      form.availableHours.length === 0
    ) {
      /* eslint-disable no-new */
      new Alert({
        title: 'Rellene los campos requeridos',
        message: 'Indícanos tu disponibilidad'
      })
      return null
    }
    if (typeof form.services === 'string' || form.services.length === 0) {
      /* eslint-disable no-new */
      new Alert({
        title: 'Rellene los campos requeridos',
        message:
          e.target.id === 'teacher'
            ? 'Indica qué instrumentos o clases impartes'
            : 'Indica en qué instrumentos estás interesado'
      })
      return null
    }
  }
  if (form.availableHours) {
    for (const day of form.availableHours) {
      const index = form.availableHours.findIndex(item => item === day)
      form.availableHours[index] = {
        day,
        hours: form[day]
      }
      delete form[day]
    }
  }
  form.phone = `${form['phone-code']}${form.phone}`
  return form
}

studentForm.addEventListener('submit', async e => {
  e.preventDefault()
  const submitStudent = studentForm.querySelector('button[type="submit"]')
  const form = formatForm(e)
  if (form) {
    toggleSubmitState(submitStudent, true)
    try {
      await post('/api/contact', form)
      /* eslint-disable no-new */
      new Alert({
        title: '¡Gracias por contactarnos!',
        message: 'En breves responderemos a tu solicitud.',
        redirect: true
      })
      studentForm.reset()
    } catch (err) {
      alert(err)
    }
    toggleSubmitState(submitStudent, false)
  }
})

teacherForm.addEventListener('submit', async e => {
  e.preventDefault()
  const teacherSubmit = teacherForm.querySelector('button[type="submit"]')
  const form = formatForm(e)
  if (form) {
    toggleSubmitState(teacherSubmit, true)
    try {
      await post('/api/contact', form)
      /* eslint-disable no-new */
      new Alert({
        title: '¡Gracias por contactarnos!',
        message: 'En breves responderemos a tu solicitud.',
        redirect: true
      })
      teacherForm.reset()
    } catch (err) {
      alert(err)
    }
    toggleSubmitState(teacherSubmit, false)
  }
})
