const addItemElements = document.querySelectorAll('#add__form')
const deleteItemElements = document.querySelectorAll('.cart__delete__button')
// const deleteAllElement = document.querySelector('#empty')
const paymentForm = document.querySelector('#payment')
// deleteAllElement.addEventListener("click", () => {
//   new Alert({
//     title: "Confirmar",
//     message: "¿Quiere eliminar todos los productos del carrito?",
//     onSuccess: async () => {
//       try {
//         const url = "/carrito/delete/all";
//         const response = await post(url);
//         if (response) {
//           new Alert({
//             title: "Mensaje",
//             message: "Producto añadido al carrito",
//             onSuccess: () => {
//               window.location.reload();
//             },
//           });
//         }
//       } catch (err) {
//         alert(err);
//       }
//     },
//   });
// });

async function post (endpoint, body) {
  try {
    const response = await fetch(
      `${window.location.protocol}//${window.location.host}${endpoint}`,
      {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    return response.json()
  } catch (err) {
    alert(err)
  }
}

if (paymentForm) {
  // paymentForm.addEventListener("submit", (e) => {
  //   e.preventDefault();
  //   new Alert({
  //     title: "En construcción",
  //     message: "El carrito de compras está bajo construcción.",
  //   });
  // });
}

for (const element of addItemElements) {
  element.addEventListener('submit', (e) => {
    const id = e.target.elements[0].value
    e.preventDefault()
    /* eslint-disable no-new */
    new Alert({
      title: 'Confirmar',
      message: '¿Desea añadir este artículo al carrito?',
      onSuccess: async () => {
        try {
          const url = '/carrito'
          const response = await post(url, { id })
          if (response) {
            new Alert({
              title: 'Mensaje',
              message: 'Producto añadido al carrito',
              onSuccess: () => {
                window.location = '/carrito'
              }
            })
          }
        } catch (err) {
          alert(err)
        }
      }
    })
  })
}

for (let i = 0; i < deleteItemElements.length; i++) {
  deleteItemElements[i].addEventListener('click', (e) => {
    const id = deleteItemElements[i].getAttribute('pack_id')
    e.preventDefault()
    new Alert({
      title: 'Confirmar',
      message: '¿Desea eliminar este artículo del carrito?',
      onSuccess: async () => {
        try {
          const url = '/carrito/delete/product/' + id
          const response = await post(url, { id })
          if (response) {
            new Alert({
              title: 'Mensaje',
              message: 'Producto borrado del carrito',
              onSuccess: () => {
                window.location.reload()
              }
            })
          }
        } catch (err) {
          alert(err)
        }
      }
    })
  })
}
