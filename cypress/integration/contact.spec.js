/// <reference types="cypress" />
import faker from 'faker'

Cypress.Cookies.debug(true)
Cypress.Cookies.defaults({
  preserve: 'session_id' // Preserve cookies
})

const name = faker.name.firstName()
const lastName = faker.name.lastName()
const email = faker.internet.email()
const password = faker.internet.password()
const newPassword = faker.internet.password()
let validationId = null
let emailId = null
describe('Client registration', () => {
  // before(function () {
  //   cy.setCookie('session_id', '')
  // })
  // beforeEach(function () {
  //   cy.preserveAllCookiesOnce()
  // })

  it('should register a contact for teacher', () => {
    cy.visit('http://localhost:4000/contacto')
    cy.get('#teacherButton').click()
    cy.get('#teacher select[name="typeClass"]').select('ALL')
    cy.get('#teacher select[name="services"]').select('3')
    cy.get('#teacher select[name="services"]').select('4')
    cy.get('#teacher input[name="name"]').type(name)
    cy.get('#teacher input[name="lastName"]').type(lastName)
    cy.get('#teacher input[name="email"]').type('smarcanoweb@gmail.com')
    cy.get('#teacher input[name="phone"]').type('685070591')

    cy.get('#teacher select[name="provinceId"]').select(
      '3868fbd2-0876-4c3b-b83f-f1d994bffa88'
    )
    cy.get('#teacher select[name="provinceId"]').select(
      '3868fbd2-0876-4c3b-b83f-f1d994bffa88'
    )
    cy.get('#teacher select[name="districtId"]').select(
      '062808bc-2e67-4508-b176-fb076939bea4'
    )
    cy.get('#teacher select[name="neighborhoodId"]').select(
      '0ff1146d-78e7-4ff1-88a6-1aa9eac13394'
    )
    cy.get('#teacher input[name="cp"]').type('08100')
    cy.get('#teacher select[name="availableHours"]').select('1')
    cy.get('#teacher select[name="availableHours"]').select('2')
    cy.get('#teacher select[name="availableHours"]').select('3')

    cy.get('#teacher select[name="origin"]').select('SOCIALES')

    cy.get('#teacher input[name="terms"]').click()
    cy.get('#teacher button[type="submit"]').click()
  })
})
