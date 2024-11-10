const IntersectionObserver = window.IntersectionObserver
class Appear {
  constructor (selector) {
    this.elements = document.querySelectorAll(selector)
    this._start()
  }

  _start () {
    for (let i = 0; i < this.elements.length; i++) {
      const element = this.elements[i]
      const options = {
        rootMargin: '0px',
        threshold: 0.2
      }
      element.style.opacity = 0
      element.style.transform = 'translateY(-15px)'
      element.style.transition = 'opacity 1s, transform 2s'
      element.style.transitionDelay = '0.3s'
      /* eslint-disable no-new */
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          element.style.opacity = 1
          element.style.transform = 'translateY(0)'
          observer.unobserve(element)
        }
      }, options)
      observer.observe(element)
    }
  }
}

new Appear('.appear')
