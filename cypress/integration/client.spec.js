/// <reference types="cypress" />
import faker from 'faker'

Cypress.Cookies.debug(true)
Cypress.Cookies.defaults({
  preserve: 'session_id' // Preserve cookies
})

const name = faker.name.findName()
const email = faker.internet.email()
const password = faker.internet.password()
const newPassword = faker.internet.password()
let validationId = null
let emailId = null
describe('Client registration', () => {
  before(function () {
    cy.setCookie('session_id', '')
  })
  beforeEach(function () {
    cy.preserveAllCookiesOnce()
  })

  it('should register a new user', () => {
    cy.visit('http://localhost:3000/registro')
    cy.get('input[name="name"]').type(name)
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('input[name="terms"]').click()
    cy.get('input[name="privacy"]').click()
    cy.get('button[type="submit"]').click()
    cy.get('h3').contains('Su registro se ha realizado correctamente.')
    cy.get('p').contains(
      'Hemos enviado un correo electrónico a la dirección proporcionada para que valides la misma.'
    )
  })

  it('should validate email', () => {
    cy.get('input[type="hidden"]')
      .invoke('val')
      .then((id) => {
        validationId = id
        cy.visit(`http://localhost:3000/validar?id=${validationId}`)
        cy.get('h1').contains('Se ha validado su email correctamente.')
      })
  })

  it('should log in', () => {
    cy.visit('http://localhost:3000/ingresar')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(password)
    cy.get('button[type="submit"]').click()
    cy.get('h1').contains('Bienvenido')
  })

  it('should redirect to area if email is already validated', () => {
    cy.log(validationId)
    cy.visit(`http://localhost:3000/validar?id=${validationId}`)
    cy.url().should('contain', 'http://localhost:3000/area')
  })

  it('should log out', () => {
    cy.get('input[type="submit"]').click()
    cy.url().should('not.contain', 'http://localhost:3000/area')
  })

  it('should change password', () => {
    cy.visit('http://localhost:3000/ingresar')
    cy.get('a[href="/olvide-contrasena"]').click()
    cy.get('input[name="email"]').type(email)
    cy.get('button[type="submit"]').click()
    cy.get('h3').contains(
      'Hemos enviado un correo electrónico con un enlace para que reestablezca su contraseña.'
    )
    cy.get('input[name="cypress"]')
      .invoke('val')
      .then((id) => {
        emailId = id
        cy.visit(`http://localhost:3000/reestablecer?id=${emailId}`)
        cy.get('h3').contains('Introduzca su nueva contraseña')
        cy.get('input[type="password"]').type(newPassword)
        cy.get('button[type="submit"]').click()
        cy.get('h3').contains(
          'Su contraseña se ha reestablecido correctamente. Ingrese a su área de usuario con la nueva contraseña '
        )
      })
  })

  it('should log in with new password', () => {
    cy.visit('http://localhost:3000/ingresar')
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="password"]').type(newPassword)
    cy.get('button[type="submit"]').click()
    cy.get('h1').contains('Bienvenido')
  })
})
