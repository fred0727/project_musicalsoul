const dropdowns = document.querySelectorAll('.dropdown')

document.addEventListener('click', (e) => {
  const isDropdownElement = Array.from(dropdowns).some(dropdown => dropdown.contains(e.target))
  if (isDropdownElement) {
    return
  }
  dropdowns.forEach(dropdown => dropdown.classList.remove('is-active'))
})

for (const dropdown of dropdowns) {
  const container = dropdown.querySelector('.dropdown-content')
  const options = Array.from(container.querySelectorAll('a'))
  const searchInputEl = dropdown.querySelector('input')
  const input = document.createElement('input')
  input.type = 'hidden'
  input.required = true
  input.setAttribute('name', dropdown.getAttribute('name'))
  input.value = searchInputEl.getAttribute('defaultValue') || null
  dropdown.appendChild(input)
  // Click listener for options
  for (const option of options) {
    option.addEventListener('click', (e) => {
      e.preventDefault()
      const { id, innerHTML } = e.target
      input.value = id
      searchInputEl.value = innerHTML
      dropdown.classList.remove('is-active')
    })
  }
  searchInputEl.addEventListener('focus', () => {
    dropdown.classList.toggle('is-active')
  })
  searchInputEl.addEventListener('input', (e) => {
    const { value } = e.target
    container.innerHTML = ''
    if (value === '') {
      input.value = ''
      container.append(...options)
      return
    }
    const filteredOptions = options.filter(el => new RegExp(value).test(el.innerHTML))
    if (filteredOptions.length === 0) {
      container.innerHTML = '<a class="dropdown-item" style="width: 100%; pointer-events: none">No hay resultados</a>'
      return
    }
    container.append(...filteredOptions)
  })
}
