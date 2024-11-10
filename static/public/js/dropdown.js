class Dropdown {
  constructor (selector) {
    this.elements = document.querySelectorAll(selector)
    this._listen()
  }

  _listen () {
    for (const dropdown of this.elements) {
      dropdown.addEventListener('click', (e) => {
        const ul = dropdown.querySelector('ul')
        ul.classList.toggle('active')
      })
    }
  }
}
/* eslint-disable no-new */
new Dropdown('.dropdown')
