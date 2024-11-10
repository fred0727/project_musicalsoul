class Multiselect {
  constructor ({ id, subvalues }) {
    this.element = document.getElementById(id)
    this.selectedContainer = document.createElement('div')
    this.selectedContainer.classList.add('multi__container')
    this.appendedContainer = false
    this._listen()
    this.items = {}
    this.selected = []
    this.subvalues = subvalues
    this.hours = [
      ...[...Array(16).keys()].map((_, index) => {
        const j = index + 7
        if (j <= 9) {
          return {
            value: `0${j}`,
            label: `0${j}`
          }
        }
        return {
          value: `${j}`,
          label: `${j}`
        }
      }),
      {
        label: 'Indiferente',
        value: 'all'
      }
    ]
  }

  _listen () {
    this.element.addEventListener('change', (e) => {
      this._push(e)
    })
  }

  _toggleSelectionState ({ disabled, value }) {
    const option = this.element.querySelector(`option[value="${value}"]`)
    option.disabled = disabled
    return option
  }

  _push (e) {
    if (!this.appendedContainer) {
      this.element.parentElement.parentElement.appendChild(
        this.selectedContainer
      )
    }
    const option = this._toggleSelectionState({
      disabled: true,
      value: e.target.value
    })
    this.selected.push(option.value)
    const item = document.createElement('div')
    item.innerHTML = `
    <div style="display: flex;width:100%;justify-content:space-between;align-items:center;">
      ${option.innerHTML}
      <img src="/static/public/images/close.svg" width="32" height="32"/>
    </div>
    `
    item.querySelector('img').addEventListener('click', (e) => {
      this._pop({ target: item })
    })
    item.classList.add('multi__item')
    item.setAttribute('value', option.value)
    this.items[option.value] = item
    this.selectedContainer.appendChild(item)
    this.element.setAttribute('values', JSON.stringify(this.selected))
    this.element.value = 'Seleccionar'
    if (this.subvalues) {
      const div = document.createElement('div')
      div.innerHTML = `
          <label for="${option.value}">Horas ${option.innerHTML}</label>
          <div class="select">
            <select id="${option.value}" name="${
        option.value
      }" placeholder="Seleccionar">
              <option value="Seleccionar">Seleccionar (opcional)</option>
              ${this.hours
                .map((h) => `<option value="${h.value}">${h.label}</option>`)
                .join('')}
            </select>
          </div>
      `
      div.classList.add('form__control')
      item.appendChild(div)
      /* eslint-disable no-new */
      new Multiselect({ id: `${option.value}` })
    }
    if (option.value === 'all') {
      for (const op of Object.keys(this.items).filter(
        (key) => this.items[key].getAttribute('value') !== 'all'
      )) {
        this._pop({ target: this.items[op] })
      }
      this._toggleAll(true)
    }
  }

  _pop (e) {
    const value = e.target.getAttribute('value')
    this.selected = this.selected.filter((i) => value !== i)
    this._toggleSelectionState({
      disabled: false,
      value: value
    })
    this.selectedContainer.removeChild(this.items[value])
    delete this.items[value]
    if (this.selected.length === 0) {
      this.appendedContainer = false
      this.element.parentElement.parentElement.removeChild(
        this.selectedContainer
      )
    }
    this.element.setAttribute('values', JSON.stringify(this.selected))
    if (value === 'all') {
      this._toggleAll(false)
    }
  }

  _toggleAll (value) {
    const elements = this.element.querySelectorAll(
      'option:not(option[value="all"])'
    )
    for (const element of elements) {
      element.disabled = value
    }
  }
}
/* eslint-disable no-new */
new Multiselect({ id: 'multiServicesStudent' })
new Multiselect({ id: 'multiServicesTeacher' })
new Multiselect({ id: 'multiScheduleTeacher', subvalues: true })
