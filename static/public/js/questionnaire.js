const questions = [
  {
    id: 1,
    label: '¿Dónde está la academia?',
    options: [
      {
        value: false,
        label: 'Tenemos varias localizaciones.'
      },
      {
        value: true,
        label:
          'Music & Soul es una plataforma de formación musical, no es una academia con un espacio físico. Impartimos las clases a domicilio (sin suplementos por desplazamiento), en el espacio del profesor u online.'
      }
    ]
  },
  {
    id: 2,
    label: '¿Puedo pagarle las clases al profesor?',
    options: [
      {
        value: false,
        label: 'Sí, de eso se trata.'
      },
      {
        value: true,
        label: 'No, Music & Soul paga al profesor por las clases que imparte.'
      }
    ]
  },
  {
    id: 3,
    label:
      '¿Tengo que recibir todas las clases que haya pagado dentro del mes en curso?',
    options: [
      {
        value: false,
        label: 'No es necesario, se pueden acumular para el mes siguiente.'
      },
      {
        value: true,
        label: 'El total de las clases debe impartirse dentro del mes en curso.'
      }
    ]
  },
  {
    id: 4,
    label: '¿Las clases que caen en días festivos no se imparten?',
    options: [
      {
        value: false,
        label: 'Nunca se imparten las clases que caigan en festivo.'
      },
      {
        value: true,
        label:
          'Las clases que caigan en festivo se mueven a otro día acordado con el profesor dentro del mes en curso.'
      }
    ]
  },
  {
    id: 5,
    label: '¿Las clases que caen en días festivos no se imparten?',
    options: [
      {
        value: false,
        label: 'Nunca se imparten las clases que caigan en festivo.'
      },
      {
        value: true,
        label:
          'Las clases que caigan en festivo se mueven a otro día acordado con el alumno dentro del mes en curso.'
      }
    ]
  },
  {
    id: 6,
    label:
      'Si cancelo alguna de mis clases, ¿tengo derecho a recuperarla independientemente de la antelación con que avise al profesor?',
    options: [
      {
        value: false,
        label:
          'El alumno puede cancelar sus clases cuando quiera y recuperarlas cuando quiera.'
      },
      {
        value: true,
        label:
          'El alumno podrá recuperar sus clases en función de la antelación con que avise al profesor; el profesor indicará al alumno cuál es su política de recuperaciones: estricta, media, flexible o muy flexible, y Music & Soul le hará llegar al alumno esta información para evitar futuros malentendidos.'
      }
    ]
  },
  {
    id: 7,
    label:
      '¿Qué ocurre si por cancelaciones del alumno o del profesor no se consigue recuperar la clase dentro del mes en curso por incompatibilidad horaria?',
    options: [
      {
        value: false,
        label:
          'Como el profesor ha cobrado sus clases por adelantado, no se tiene que preocupar de nada.'
      },
      {
        value: true,
        label:
          'El profesor y el alumno han de saber que en estos casos se puede recuperar una clase cancelada durante el mes siguiente si es por incompatibilidad horaria, siempre y cuando esto no implique que el alumno piense que el mes sucesivo se le descontará de su cuota mensual dicha clase, por lo que deberá recibir el número de clases correspondientes al pack al que esté suscrito más la clase pendiente de recuperar.'
      }
    ]
  },
  {
    id: 8,
    label:
      'Los meses de 5 semanas, si el profesor está de acuerdo, ¿puede el alumno recibir una 5ª clase?',
    options: [
      {
        value: false,
        label:
          'No, nunca se puede añadir una clase más en los meses de 5 semanas.'
      },
      {
        value: true,
        label:
          'Por supuesto que sí, el alumno tendrá que notificar a Music & Soul su deseo de recibir una clase más, para que Music & Soul le indique cómo debe proceder en cuanto al pago.'
      }
    ]
  },
  {
    id: 9,
    label:
      '¿Qué debe hacer el profesor si el alumno le propone continuar con su formación musical prescindiendo de Music & Soul?',
    options: [
      {
        value: false,
        label:
          'El profesor debe acceder, no le debe importar nada que Music & Soul sea quien le está facilitando los alumnos.'
      },
      {
        value: true,
        label:
          'El profesor debe tener un mínimo de honestidad y rechazar la propuesta, ya que Music & Soul siempre le va a facilitar el no tener que buscar los alumnos por su cuenta ni preocuparse de los pagos por parte del alumno.'
      }
    ]
  },
  {
    id: 10,
    label:
      'Los meses de 5 semanas, si el alumno está de acuerdo, ¿puede el profesor impartir una 5a clase?',
    options: [
      {
        value: false,
        label:
          'No, nunca se puede añadir una clase más en los meses de 5 semanas.'
      },
      {
        value: true,
        label:
          'Por supuesto que sí, el alumno tendrá que notificar a Music & Soul su deseo de recibir una clase más, para que Music & Soul le indique cómo debe proceder en cuanto al pago.'
      }
    ]
  },
  {
    id: 11,
    label:
      'En el caso de que un alumno o el profesor deban suspender la clase por contacto directo por un positivo de Covid-19, ¿qué ocurre con la clase de esa semana?',
    options: [
      {
        value: false,
        label: 'No se da la clase y se le descuenta al alumno.'
      },
      {
        value: true,
        label:
          'La clase se realizará de forma on-line, evitando contacto personal entre ambos, en caso contrario, el alumno/a perderá su clase, sin derecho a recuperación ni devolución del importe abonado.'
      }
    ]
  },
  {
    id: 12,
    label:
      'En el supuesto de clases presenciales que no puedan impartirse por haberse confinado el municipio, distrito, barrio o área de salud, del alumno o del profesor, ¿qué ocurre con la clase de esa semana y las posteriores?',
    options: [
      {
        value: false,
        label: 'Se dan todas sea como sea.'
      },
      {
        value: true,
        label:
          'El alumno decidirá si quiere recibir clases online o suspender temporalmente la prestación de las clases hasta el final de esta restricción de movilidad, por lo que Music & Soul procederá a reembolsar al alumno las clases correspondientes.'
      }
    ]
  }
]

const questionContainer = document.querySelector('.questionContainer')
let currentQuestion = 0
let results = []

function resetQuestionnaire () {
  currentQuestion = 0
  results = []
  renderQuestion()
}

function onClickAnswer (e) {
  // console.log(e.target)
  const id = e.target.getAttribute('questionid')
  let value = e.target.getAttribute('value')
  value = value === 'false' ? false : true
  if (currentQuestion === questions.length - 1) {
    results.push({
      id,
      value
    })
    const isValid = results.every(item => item.value)
    if (!isValid) {
      alert(
        'No ha completado el cuestionario satisfactoriamente. Inténtelo nuevamente'
      )
      resetQuestionnaire()
      return
    }
    // hacemos peticion
    fetch('/questionnaire', {
      method: 'POST',
      body: JSON.stringify({})
    })
      .then(res => {
        return res.json()
      })
      .then(body => {
        if (body.message === 'Updated') {
          alert('Formulario completado correctamente')
          window.location.reload()
        }
      })
    return
  }
  results.push({
    id,
    value
  })
  currentQuestion += 1
  renderQuestion()
}

function onPopAnswer () {
  results.pop()
  currentQuestion -= 1
  renderQuestion()
}

function renderQuestion () {
  if (!questionContainer) return
  questionContainer.innerHTML = `
        <div class="question">
            <h2>${questions[currentQuestion].id}.- ${
    questions[currentQuestion].label
  }</h2>
            <ul>
                <li questionId="${questions[currentQuestion].id}" value="${
    questions[currentQuestion].options[0].value
  }" class='answer'>${questions[currentQuestion].options[0].label}</li>
                <li questionId="${questions[currentQuestion].id}" value="${
    questions[currentQuestion].options[1].value
  }" class='answer'>${questions[currentQuestion].options[1].label}</li>
            </ul>
            ${
              results.length > 0
                ? `<button>Revisar pregunta anterior</button>`
                : ''
            }
        </div>
    `
  Array.from(document.querySelectorAll('.answer')).forEach(answer =>
    answer.removeEventListener('click', onClickAnswer)
  )
  Array.from(document.querySelectorAll('.answer')).forEach(answer =>
    answer.addEventListener('click', onClickAnswer)
  )
  const popButton = document.querySelector('.question button')
  if (popButton) {
    popButton.removeEventListener('click', onPopAnswer)
    popButton.addEventListener('click', onPopAnswer)
  }
}

renderQuestion()
