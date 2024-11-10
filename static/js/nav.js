const burger = document.querySelector('.navbar-burger')
const menu = document.querySelector('.column.is-one-quarter')
const asideLinks = document.querySelectorAll(
  "aside .menu-list li a:not([type='home'])"
)
const asideHomeLink = document.querySelector("a[type='home']")

burger.addEventListener('click', () => {
  burger.classList.toggle('is-active')
  menu.classList.toggle('active')
})

for (const link of asideLinks) {
  const paths = link.getAttribute('path').split('|')
  for (const path of paths) {
    const exp = new RegExp(path)
    if (exp.test(window.location.pathname)) {
      link.classList.add('is-active')
    }
  }
}

if (window.location.pathname === '/panel/dashboard') {
  asideHomeLink.classList.add('is-active')
}
