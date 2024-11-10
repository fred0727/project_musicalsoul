class Modal {
  constructor ({ title, content, buttons }) {
    this.title = title
    this.content = content
    this.buttons = buttons
    this._render()
  }

  _render () {
    this.modal = document.createElement('div')
    this.modal.classList.add('modal')
    this.modal.classList.add('is-active')
    const innerHTML = `
        <div class="modal-background"></div>
        <div class="modal-card">
            <header class="modal-card-head">
            <p class="modal-card-title">${this.title}</p>
            <button class="delete" aria-label="close"></button>
            </header>
            <section class="modal-card-body">
                ${this.content ? this.content : ''}
            </section>
            <footer class="modal-card-foot">
            ${this.buttons ? this.buttons : ''}
            </footer>
        </div>
    `
    this.modal.innerHTML = innerHTML
    this.modal
      .querySelector('.delete')
      .addEventListener('click', this._closeModal.bind(this))
    document.body.appendChild(this.modal)
  }

  _closeModal () {
    this.modal.parentElement.removeChild(this.modal)
    this.modal
      .querySelector('.delete')
      .removeEventListener('click', this._closeModal.bind(this))
  }
}

window.Modal = Modal
