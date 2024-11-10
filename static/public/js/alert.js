class Alert {
  constructor ({ message, title, buttonLabel, redirect, onSuccess }) {
    this.title = title
    this.message = message
    this.buttonLabel = buttonLabel || 'OK'
    this.redirect = redirect || false
    this._draw()
    document
      .querySelector('#alert__button')
      .addEventListener('click', onSuccess)
  }

  _draw () {
    const overlay = document.createElement('div')
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
    `
    const content = `
        <div class="alert__container">
            <h3>${this.title}</h3>
            <p class="alert__body">${this.message}</p>
            <div class="alert__close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" width="16px" height="16px">
                <path d="M3.293,26.707a1,1,0,0,0,1.414,0L15,16.414,25.293,26.707a1,1,0,0,0,1.414-1.414L16.414,15,26.707,4.707a1,1,0,1,0-1.414-1.414L15,13.586,4.707,3.293A1,1,0,0,0,3.293,4.707L13.586,15,3.293,25.293A1,1,0,0,0,3.293,26.707Z"></path>
              </svg>
            </div>
            <div class="alert__button__container">
            <button
                id="alert__button"
                style="
                    font-size: var(--font-base);
                    margin-top: var(--m1);
                "
            >${this.buttonLabel}</button>
            </div>
        </div>
    `
    overlay.innerHTML = content
    document.body.append(overlay)
    function onClickButton () {
      overlay.parentElement.removeChild(overlay)
      overlay
        .querySelector('#alert__button')
        .removeEventListener('click', onClickButton)
      if (this.redirect) {
        window.location = '/'
      }
    }
    overlay
      .querySelector('#alert__button')
      .addEventListener('click', onClickButton.bind(this))
    overlay
      .querySelector('.alert__close')
      .addEventListener('click', onClickButton.bind(this))
  }
}

// window.Alert = Alert
