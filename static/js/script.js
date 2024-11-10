
const deleteButtons = document.querySelectorAll('.delete')
const requestRows = document.querySelectorAll('.row.request')
const cancelButtons = document.querySelectorAll('button.cancel')
const deleteTeacherButtons = document.querySelectorAll('button.deleteTeacher')
const registerTeacherButtons = document.querySelectorAll(
  'button.registerTeacher'
)
const lessonStudentOptions = document.querySelector('select#studentOptions')
const registeredStudentOption = document.querySelector('div[value="registered"]')
const emailStudentOption = document.querySelector('div[value="email"]')
const startTimeInputs = document.querySelectorAll('input[name="startTime"]')
const endTimeInputs = document.querySelectorAll('input[name="endTime"]')
const cancelLessonButtons = document.querySelectorAll('button.cancelLesson')
const completeLessonButtons = document.querySelectorAll('button.completeLesson')
const assignTeacherButtons = document.querySelectorAll('button.assignTeacher')
const deleteStudentButtons = document.querySelectorAll('button.deleteStudent')
// const statusTabs = document.querySelector('tabs')

// for (const tab of statusTabs.querySelectorAll('a')) {
//   tab.addEventListener('click', () => {
//   })
// }

for (let i = 0; i < startTimeInputs.length; i++) {
  const startTime = startTimeInputs[i]
  const endTime = endTimeInputs[i]
  if (startTime) {
    startTime.addEventListener('change', (e) => {
      const d = new Date(e.target.value)
      const nextHour = new Date((d.getTime() + (-new Date().getTimezoneOffset()) * 60 * 1000) + (60 * 60 * 1000))
      const maxHour = new Date((d.getTime() + (-new Date().getTimezoneOffset()) * 60 * 1000) + (60 * 60 * 4000))
      endTime.setAttribute('min', e.target.value)
      endTime.setAttribute('max', maxHour.toISOString().split('.')[0])
      endTime.value = nextHour.toISOString().split('.')[0]
    })
  }
}

if (lessonStudentOptions) {
  lessonStudentOptions.addEventListener('change', (e) => {
    if (e.target.value === 'registered') {
      registeredStudentOption.style.display = 'block'
      emailStudentOption.style.display = 'none'
    }
    if (e.target.value === 'email') {
      emailStudentOption.style.display = 'block'
      registeredStudentOption.style.display = 'none'
    }
  })
}

deleteButtons.forEach((button) => {
  button.addEventListener('click', () => {
    button.parentElement.remove(button)
  })
})

function getLevel (level) {
  if (level) {
    return `<li>Nivel <b>${level}</b></li>`
  }
  return ''
}

function getServices (services) {
  if (services.length > 0 && services[0] !== null) {
    return `
      <li>
        Servicios:
        <ul>
          ${services
            .map((service) => `<li><b>${service.name}</b></li>`)
            .join('')}
        </ul>
      </li>
    `
  }
  return ''
}

for (const button of registerTeacherButtons) {
  button.addEventListener('click', () => {
    const data = JSON.parse(
      button.parentElement.parentElement.getAttribute('data')
    )
    /* eslint-disable no-new */
    new Modal({
      title: `Registrar profesor ${data.name}`,
      content: `
          <form action="/panel/dashboard/teachers/" method="POST" id="form" enctype="multipart/form-data">
            <ul class="menu-list">
              <li>
                <div class="field">
                  <label class="label">Name</label>
                  <div class="control">
                    <input class="input" type="text" name="name" placeholder="Nombre" value="${
                      data.name
                    }">
                  </div>
                </div>
              </li>
              <li>
                <div class="field">
                  <label class="label">Email</label>
                  <div class="control">
                    <input class="input" type="text" name="email" placeholder="Email" value="${
                      data.email
                    }">
                  </div>
                </div>
              </li>
              <li>
                <div class="field">
                  <label class="label">Teléfono</label>
                  <div class="control">
                    <input class="input" type="text" name="phone" placeholder="Teléfono" value="${
                      data.phone
                    }">
                  </div>
                </div>
              </li>
              <li>
                <div class="field">
                  <label class="label">Código Postal</label>
                  <div class="control">
                    <input class="input" type="text" name="cp" placeholder="Código Postal" value="${
                      data.cp
                    }">
                  </div>
                </div>
              </li>
              <li>
                <div class="field">
                  <label class="label">Servicios</label>
                  <div class="control">
                    ${data.services.reduce(
                      (html, service) =>
                        (html += `
                          <input style="margin-bottom: 5px;" class="input" type="text" placeholder="Servicio" value="${service.name}" disabled>
                          <input type="hidden" name="services" value="${service.id}" />
                        `),
                      ''
                    )}
                  </div>
                </div>
              </li>
            </ul>
          </form>
      `,
      buttons: '<button class="button" form="form">Registrar profesor</button>'
    })
  })
}

for (const row of requestRows) {
  row.addEventListener('click', (e) => {
    if (e.target.tagName === 'BUTTON') return
    const data = JSON.parse(row.getAttribute('data'))
    new Modal({
      title: data.name,
      content: `
          <ul class="menu-list">
            <li>Nombre: <b>${data.name}</b></li>
            <li>Teléfono: <b>${data.phone}</b></li>
            <li>Código Postal: <b>${data.cp}</b></li>
            <li>Modalidad: <b>${data.typeClass}</b></li>
            <li>Perfil: <b>${data.profile}</b></li>
            ${getLevel(data.level)}
            ${getServices(data.services)}
          </ul>
      `,
      buttons: `<a class="button is-success" href="https://wa.me/${data.phone}" target="_blank">Contactar Whatsapp</a>`
    })
  })
}

for (const button of cancelButtons) {
  button.addEventListener('click', () => {
    const id = button.getAttribute('id')
    const name = button.getAttribute('name')
    new Modal({
      title: '¿Está seguro que desea cancelar la suscripción?',
      content: `
          <h3><b>ESTA ACCIÓN NO ES REVERSIBLE</b></h3>
          <br />
          <b>Si el alumno queda sin suscripciones activas los datos de su método de pago serán eliminados</b>
          <br />
          <div>Se notificará al alumno sobre la cancelación de su suscripción</div>
          <br />
          <br />
          <div>Cancelar suscripción de <b>${name}</b></div>
      `,
      buttons: `
        <form method="POST" action="/panel/dashboard/subscriptions/cancel"  enctype="multipart/form-data">
          <input type="hidden" value="${id}" name="id" />
          <button type="submit" class="button is-danger">CANCELAR SUSCRIPCIÓN</button>
        </form>
      `
    })
  })
}

for (const button of deleteTeacherButtons) {
  button.addEventListener('click', () => {
    const id = button.getAttribute('id')
    const name = button.getAttribute('name')
    new Modal({
      title: '¿Seguro?',
      content: `
          <h3><b>ESTA ACCIÓN NO ES REVERSIBLE</b></h3>
          <h4>Está seguro que desea eliminar el registro de este profesor</h2>
          <br />
          <div>Eliminar registro de <b>${name}</b></div>
      `,
      buttons: `
        <form method="POST" action="/panel/dashboard/teachers/delete"  enctype="multipart/form-data">
          <input type="hidden" value="${id}" name="id" />
          <button type="submit" class="button is-danger">ELIMINAR REGISTRO</button>
        </form>
      `
    })
  })
}

for (const button of completeLessonButtons) {
  button.addEventListener('click', () => {
    const id = button.getAttribute('id')
    const name = button.getAttribute('name')
    new Modal({
      title: 'Completar',
      content: `
          <h4><b>Marque su clase con ${name} como completada</b></h2>
          <br />
      `,
      buttons: `
        <form method="POST" action="/panel/dashboard/lessons/complete"  enctype="multipart/form-data" style="width: 100%">
          <input type="hidden" value="${id}" name="id" />
          <div class="field">
            <div class="control" style="width: 100%">
              <textarea class="textarea" placeholder="Observaciones (opcional)" name="observations"></textarea>
            </div>
          </div>
          <button type="submit" class="button is-success">Completar</button>
        </form>
      `
    })
  })
}

for (const button of cancelLessonButtons) {
  button.addEventListener('click', () => {
    const id = button.getAttribute('id')
    const name = button.getAttribute('name')
    new Modal({
      title: '¿Seguro?',
      content: `
          <h4><b>Está seguro que desea cancelar la clase</b></h2>
          <br />
          <div>Cancelar la clase con alumno: <b>${name}</b></div>
      `,
      buttons: `
        <form method="POST" action="/panel/dashboard/lessons/cancel"  enctype="multipart/form-data">
          <input type="hidden" value="${id}" name="id" />
          <button type="submit" class="button is-danger">Cancelar clase</button>
        </form>
      `
    })
  })
}

for (const button of assignTeacherButtons) {
  button.addEventListener('click', () => {
    const id = button.getAttribute('id')
    const name = button.getAttribute('name')
    const teachers = JSON.parse(button.getAttribute('teachers'))
    new Modal({
      title: 'Asigne un profesor',
      content: `
          <h4><b>Asigne un profesor a la suscripción de ${name}</b></h2>
      `,
      buttons: `
        <form method="POST" action="/panel/dashboard/subscriptions/assign-teacher" enctype="multipart/form-data" style="width: 100%">
          <input type="hidden" value="${id}" name="id" />
          <div class="field">
            <div class="select" style="width: 100%">
                <select style="width: 100%" name="teacherId">
                    <option disabled selected>Seleccionar</option>
                    ${teachers.reduce((acc, teacher) => {
                      acc += `<option value="${teacher.id}">${teacher.name}</option>`
                      return acc
                    }, '')}
                </select>
            </div>
          </div>
          <button type="submit is-sucess" type="submit" class="button">Asignar profesor a suscripción</button>
        </form>
      `
    })
  })
}

for (const button of deleteStudentButtons) {
  button.addEventListener('click', () => {
    const id = button.getAttribute('id')
    const name = button.getAttribute('name')
    new Modal({
      title: '¿Seguro?',
      content: `
          <h4><b>Eliminar alumno ${name}</b></h2>
          <br/>
          <p>Si elimina este alumno, todas sus suscripciones serán eliminadas en consecuencia.</p>
      `,
      buttons: `
        <form method="POST" action="/panel/dashboard/clients/delete" enctype="multipart/form-data" style="width: 100%">
          <input type="hidden" value="${id}" name="id" />
          <button type="submit" class="button is-danger">Eliminar alumno</button>
        </form>
      `
    })
  })
}
