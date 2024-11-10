class CalendarController {
  constructor ({ date, element, type = 'MONTH' }) {
    this.date = date
    this.type = type
    this.styles = `
        <style>
            body {
                scroll-behavior: smooth;
            }
            .grid {
                display: grid;
                grid-template-columns: repeat(7, 1fr);
                width: 100%;
                grid-column-gap: 1px;
                grid-row-gap: 1px;
                scrollbar-width: none;
                cursor: pointer;
            }
            .grid::-webkit-scrollbar {
                display: none;
            }
            .grid {
                max-height: 500px;
                overflow-y: scroll;
            }
            .grid div {
                padding: 15px;
                text-align: center;
                box-shadow: 0 0 0 1px;
            }
            .grid div.calendar-header {
                background-color: lightgray;
                position: sticky;
                top: 0;
            }
            .header {
                margin-bottom: 1rem;
            }
            .buttons {
                width: 100%;
                margin-top: 0.5rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .buttons button {
                margin-bottom: 0!important;
            }
            .select {
                margin-right: 0.3rem;
            }
            .blink {
                animation-duration: 1s;
                animation-name: blink;
                animation-iteration-count: infinite;
            }
            .hour-expand, .duration {
                grid-column: 1 / 8;
            }
            @keyframes blink {
                from {
                    opacity: 0.4;
                }
                to {
                    opacity: 1;
                }
            }
            @media (min-width: 768px) {
                .header {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                }
                .header div:last-child {
                    grid-column: 1 / 3;
                }
                .buttons {
                    margin-top: 0;
                    justify-content: flex-end;
                }
                .buttons:last-child {
                    margin-bottom: 0rem!important;
                }
            }
        </style>
    `
    this.lessons = JSON.parse(element.getAttribute('rows'))
    this.students = this._removeDuplicates(
      this.lessons.map(row => ({ id: row.clientId, name: row.clientName }))
    )
    this.calendar = document.createElement('div')
    this.header = document.createElement('div')
    this.headerLabel = document.createElement('div')
    this.teacherId = element.getAttribute('teacherId')
    this.buttons = document.createElement('div')
    this.calendar.classList.add('grid')
    this.header.innerHTML = `
        <div class="header">
            <div class="button is-fullwidth" id="label">
                ${this.getMonthLabel()} - ${this.getYear()}
            </div>
            <div class="buttons">
                <div class="select">
                    <select class="select">
                        <option value="MONTH">Mes</option>
                        <option value="WEEK">Semana</option>
                    </select>
                </div>
                <div>
                    <button class="button" id="prev">Anterior</button>
                    <button class="button" id="next">Siguiente</button>
                </div>
            </div>
            <div></div>
            <div class="field">
                <label class="label">
                    Sus estudiantes
                </label>
                <div class="select is-fullwidth mb-2">
                <select id="student-selector">
                        ${this.students.reduce((acc, student) => {
                          if (!acc) {
                            acc += `<option selected value="${student.id}">${student.name}</option>`
                            return acc
                          }
                          acc += `<option value="${student.id}">${student.name}</option>`
                          return acc
                        }, '')}
                    </select>
                </div>
                <button class="button is-fullwidth" id="create">Crear nueva clase con estudiante seleccionado</button>
            </div>
        </div>
    `
    element.innerHTML += this.styles
    element.appendChild(this.header)
    element.appendChild(this.calendar)
    this.handleDayElement = this.handleDayElement.bind(this)
    this.handleHourElement = this.handleHourElement.bind(this)
    this.handleDurationElement = this.handleDurationElement.bind(this)
    this.handleCalendarInterface()
    this.handleCreateInterface()
    this.render({
      type: type
    })
    // Default value first
    this.selection = {
      student: {
        id: this.students[0].id,
        name: this.students[0].name
      }
    }
    this.handleStudentSelector()
  }

  //    new CalendarController({
  //       date: controller.getSameDayNextWeek(),
  //     })
  _removeDuplicates (arr) {
    return [...new Set(arr.map(row => JSON.stringify(row)))].map(i =>
      JSON.parse(i)
    )
  }

  handleStudentSelector () {
    document
      .querySelector('#student-selector')
      .addEventListener('change', ({ target: { value } }) => {
        this.selection.clientId = value
      })
  }

  handleCalendarInterface () {
    const buttons = this.header.querySelectorAll('button')
    for (const b of Array.from(buttons)) {
      b.addEventListener('click', ({ target: { id } }) => {
        switch (id) {
          case 'prev': {
            const previousMonth = this.date.getMonth() - 1
            // If it's bigger than 0 we are toggling on the same year
            if (previousMonth >= 0) {
              this.date = new Date(`${previousMonth + 1}-01-${this.getYear()}`)
            } else {
              // If not, we are talking about December of past year
              this.date = new Date(`12-01-${this.getYear() - 1}`)
            }
            this.render({ type: 'MONTH' })
            break
          }
          case 'next': {
            // Calculate previous month from current
            const nextMonth = this.date.getMonth() + 1
            // If it's less than 11 we are toggling on the same year
            if (nextMonth < 11) {
              this.date = new Date(`${nextMonth + 1}-01-${this.getYear()}`)
            } else {
              // If not, we are talking about January of next year
              this.date = new Date(`01-01-${this.getYear() + 1}`)
            }
            this.render({ type: 'MONTH' })
            break
          }
        }
      })
    }
    const select = this.header.querySelector('select')
    select.addEventListener('change', ({ target: { value } }) => {
      this.type = value
      this.render({ type: this.type })
    })
  }

  handleDayElement ({ target }) {
    const grid = document.querySelector('.grid[active="1"]')
    if (grid && target.getAttribute('value')) {
      this.selection.date = target.getAttribute('value')
      alert('Escoja hora para la clase')
      this.type = 'TIME'
      this.render({
        type: this.type
      })
    }
  }

  getSelectionDate () {
    const d = new Date(this.selection.date)
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()} - ${
      this.selection.hour
    }`
  }

  handleHourElement ({ target }) {
    const grid = document.querySelector('.grid[active="1"]')
    if (grid && target.getAttribute('value')) {
      this.selection.hour = target.getAttribute('value')
      alert('Escoja duración de la clase')
      this.type = 'DURATION'
      this.render({
        type: this.type
      })
    }
  }

  handleDurationElement ({ target }) {
    const grid = document.querySelector('.grid[active="1"]')
    if (grid && target.getAttribute('value')) {
      const date = new Date(this.selection.date)
      this.selection.duration = target.getAttribute('value')
      const [hours, minutes] = this.selection.hour.split(':')
      date.setHours(hours)
      date.setMinutes(minutes)
      new Modal({
        title: `Agendar clase con ${this.selection.student.name}`,
        content: `
            ¿Son los siguientes datos correctos?
            <br />
            Alumno: ${this.selection.student.name}
            <br />
            Fecha de clase: ${new Date(
              this.selection.date
            ).toLocaleDateString()}
            <br />
            Hora: ${this.selection.hour}h
        `,
        buttons: `
            <form method="POST" action="/panel/dashboard/lessons"  enctype="multipart/form-data">
                <input type="hidden" value="${
                  this.selection.student.id
                }" name="clientId" />
                <input type="hidden" value="${
                  this.teacherId
                }" name="teacherId" />
                <input type="hidden" value="${date.toISOString().slice(0, 19).replace('T', ' ')}" name="startTime"/>
                <input type="hidden" value="${new Date(date.getTime() + Number(this.selection.duration)).toISOString().slice(0, 19).replace('T', ' ')}" name="endTime" />
                <button class="button" type="submit">Agendar clase</button>
            </form>
          `
      })
    }
  }

  handleCreateInterface () {
    const createElement = document.querySelector('#create')
    const dayElements = Array.from(this.calendar.querySelectorAll('.day'))
    createElement.addEventListener('click', ({ target }) => {
      target.innerHTML = 'Cancelar'
      target.classList.add('is-warning')
      target.setAttribute('active', 1)
      this.calendar.setAttribute('active', 1)
      this.type = 'MONTH'
      this.render({
        type: this.type
      })
      for (let dayElement of dayElements) {
        dayElement.addEventListener('click', this.handleDayElement)
      }
      alert('Escoja día del mes para la clase')
      this.calendar.classList.add('blink')
    })
  }

  MONTHS = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre'
  ]

  HOURS = Array(24)
    .fill(0)
    .map((_, index) => {
      if (index <= 9 && index % 2 === 0) {
        return [`0${index}:00`, `0${index}:30`]
      } else {
        return [`${index}:00`, `${index}:30`]
      }
    })
    .flat()

  DURATIONS = [
    {
      label: '30 minutos',
      duration: 60 * 30 * 1000
    },
    {
      label: '45 minutos',
      duration: 60 * 45 * 1000
    },
    {
      label: '1 hora',
      duration: 60 * 60 * 1000
    },
    {
      label: '1 hora y 30 minutos',
      duration: 60 * 75 * 1000
    },
    {
      label: '2 horas',
      duration: 60 * 90 * 1000
    },
    {
      label: '2 horas y 30 minutos',
      duration: 60 * 105 * 1000
    },
    {
      label: '3 horas',
      duration: 60 * 120 * 1000
    }
  ]

  DAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  ROW_MAP = {
    '00': 1,
    '01': 2,
    '02': 3,
    '03': 4,
    '04': 5,
    '05': 6,
    '06': 7,
    '07': 8,
    '08': 9,
    '09': 10,
    10: 11,
    11: 12,
    12: 13,
    13: 14,
    14: 15,
    15: 16,
    16: 17,
    17: 18,
    18: 19,
    19: 20,
    20: 21,
    21: 22,
    22: 23,
    23: 24
  }

  getMonth () {
    return this.date.getMonth()
  }

  getDate () {
    return this.date.getDate()
  }

  getDay () {
    return this.date.getDay()
  }

  getYear () {
    return this.date.getFullYear()
  }

  getDaysInMonth () {
    return new Date(this.getYear(), this.getMonth() + 1, 0).getDate()
  }

  getMonthMatrix () {
    const firstDay = new Date(this.getYear(), this.getMonth(), 1).getDay()
    const daysInMonth = this.getDaysInMonth()
    const matrix = []
    for (let day = 1; day < daysInMonth + firstDay; day++) {
      if (firstDay > day) {
        matrix.push(null)
        continue
      }
      matrix.push(day - firstDay + 1)
    }
    return matrix
  }

  getMonthLabel () {
    return this.MONTHS[this.getMonth()]
  }

  getWeekMatrix () {
    const first = this.getDate() - this.getDay()
    const last = first + 6
    const matrix = []
    for (let day = 1; day <= last; day++) {
      if (first > day) {
        matrix.push([])
        continue
      }
      matrix.push(this.HOURS)
    }
    return matrix
  }

  getWeekDates () {
    const first = this.getDate() - this.getDay() + 1
    const last = first + 6
    const days = []
    for (let day = first; day <= last; day++) {
      days.push(
        day <= this.getDaysInMonth() ? day : day - this.getDaysInMonth()
      )
    }
    return days
  }

  getOneWeekInMs () {
    return 7 * 24 * 60 * 60 * 1000
  }

  getSameDayNextWeek () {
    const diff = this.date.getTime() + this.getOneWeekInMs()
    return new Date(diff)
  }

  getSameDayPreviousWeek () {
    const diff = this.date.getTime() - this.getOneWeekInMs()
    return new Date(diff)
  }

  render ({ type = 'MONTH' }) {
    // Clean listeners
    const hourElements = Array.from(this.calendar.querySelectorAll('.hour'))
    const dayElements = Array.from(this.calendar.querySelectorAll('.day'))
    const durationElements = Array.from(
      this.calendar.querySelectorAll('.duration')
    )
    hourElements.forEach(el => {
      el.removeEventListener('click', () => this.handleHourElement)
    })
    dayElements.forEach(el => {
      el.removeEventListener('click', () => this.handleDayElement)
    })
    durationElements.forEach(el => {
      el.removeEventListener('click', () => this.handleDurationElement)
    })
    this.calendar.innerHTML = ''
    console.log(this.header.querySelector('#label'))
    this.header.querySelector('#label').innerHTML = `
        ${this.getMonthLabel()} - ${this.getYear()}
    `
    switch (type) {
      case 'MONTH': {
        let html = ''
        const matrix = this.getMonthMatrix()
        for (let i = 0; i < 7; i++) {
          html += `<div class="calendar-header">${this.DAY_LABELS[i] ||
            ''}</div>`
        }
        for (let i = 0; i < matrix.length; i++) {
         const value = `${new Date(this.getYear())}-${this.getMonth() + 1}-${i - matrix.filter(i => i === null).length + 1}`
        //  console.log(value === lessons)
        // const a = this.lessons.find(lesson => {
        //     console.log(lesson.startTime)
        //     // // console.log(lesson.startTime, value)
        //     // const startDate = new Date(lesson.startTime)
        //     // const valueDate = new Date(value)
        //     // console.log(startDate.getDate(), valueDate.getDate())
        //     return false
        //     // return new Date(lesson.startTime) === value
        // })
        console.log(a)
          html += `<div class="day" value="${value}">${matrix[i] || ''}</div>`
        }
        this.calendar.innerHTML += html
        const elements = Array.from(this.calendar.querySelectorAll('.day'))
        elements.forEach(el => {
          el.addEventListener('click', e => {
            this.handleDayElement(e)
          })
        })
        break
      }
      case 'WEEK': {
        let html = ''
        for (let i = 0; i < 7; i++) {
          html += `<div class="calendar-header">${this.DAY_LABELS[i] ||
            ''}</div>`
        }
        for (let i = 0; i < this.HOURS.length; i++) {
          for (let j = 0; j < 7; j++) {
            const current = new Date()
            if (current.getHours() === +this.HOURS[i].split(':')[0]) {
              html += `<div id="current" class="hour">${this.HOURS[i]}</div>`
              continue
            }
            html += `<div class="hour">${this.HOURS[i]}</div>`
          }
        }
        this.calendar.innerHTML += html
        const elements = Array.from(this.calendar.querySelectorAll('.hour'))
        elements.forEach(el => {
          el.addEventListener('click', e => {
            this.handleHourElement(e)
          })
        })
        setTimeout(() => {
          this.calendar
            .querySelector('#current')
            .scrollIntoView({ behavior: 'smooth' })
        }, 200)
        break
      }
      case 'TIME': {
        let html = ''
        for (let i = 0; i < this.HOURS.length; i++) {
          const current = new Date()
          if (current.getHours() === +this.HOURS[i].split(':')[0]) {
            html += `<div id="current" class="hour-expand" value=${this.HOURS[i]}>${this.HOURS[i]}</div>`
            continue
          }
          html += `<div class="hour-expand" value=${this.HOURS[i]}>${this.HOURS[i]}</div>`
        }
        this.calendar.innerHTML += html
        const elements = Array.from(
          this.calendar.querySelectorAll('.hour-expand')
        )
        elements.forEach(el => {
          el.addEventListener('click', e => {
            this.handleHourElement(e)
          })
        })
        setTimeout(() => {
          this.calendar
            .querySelector('#current')
            .scrollIntoView({ behavior: 'smooth' })
        }, 200)
        break
      }
      case 'DURATION': {
        let html = ''
        for (let i = 0; i < this.DURATIONS.length; i++) {
          const current = new Date()
          html += `<div class="duration" value="${this.DURATIONS[i].duration}">${this.DURATIONS[i].label}</div>`
        }
        this.calendar.innerHTML += html
        const elements = Array.from(this.calendar.querySelectorAll('.duration'))
        elements.forEach(el => {
          el.addEventListener('click', e => {
            this.handleDurationElement(e)
          })
        })
        break
      }
    }
  }
}

new CalendarController({
  date: new Date(),
  element: document.querySelector('#calendar')
})
