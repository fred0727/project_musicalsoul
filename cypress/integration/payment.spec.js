/// <reference types="cypress" />
import faker from 'faker'

Cypress.Cookies.debug(true)
Cypress.Cookies.defaults({
  preserve: 'shopping_cart_id' // Preserve cookies
})
describe('Payments', () => {
  before(function () {
    cy.setCookie('shopping_cart_id', '')
  })
  beforeEach(function () {
    cy.preserveAllCookiesOnce()
  })

  it('should add an item to the cart', () => {
    cy.visit('http://localhost:3000/precios')
    cy.contains('Suscribirme').click()
    cy.get('#alert__button').click()
    cy.get('#alert__button').click()
    cy.url().should('contain', 'carrito')
  })

  it('should delete previous item from the cart', () => {
    cy.get('.cart__delete__button').first().click()
    cy.get('#alert__button').click()
    cy.get('#alert__button').click()
    cy.url().should('contain', 'carrito')
    cy.contains('No tiene productos en el carrito.').should('not.be.empty')
  })

  it('should confirm shopping cart', () => {
    cy.visit('http://localhost:3000/precios')
    cy.contains('Suscribirme').click()
    cy.get('#alert__button').click()
    cy.get('#alert__button').click()
    cy.url().should('contain', 'carrito')
    const name = faker.name.findName()
    const email = faker.internet.email()
    cy.get('input[name="name"]').type(name)
    cy.get('input[name="email"]').type(email)
    cy.contains('Confirmar').click()
    cy.contains(name).should('not.be.empty')
    cy.contains(email).should('not.be.empty')
  })

  it('should modify shopping cart', () => {
    cy.contains('Modificar mi pedido').click()
    cy.get('input[name="email"]').clear()
    cy.get('input[name="name"]').clear()
    // const name = faker.name.findName();
    // const email = faker.internet.email();
    const name = 'Santiago Marcano'
    const email = 'smarcanoweb@gmail.com'
    cy.get('input[name="email"]').type(email)
    cy.get('input[name="name"]').type(name)
    cy.contains('Confirmar').click()
    cy.contains(name).should('not.be.empty')
    cy.contains(email).should('not.be.empty')
  })

  it('should trigger redsys redirect', () => {
    cy.get('input[name="terms"]').click()
    cy.contains('Comprar').click()
  })

  it('should pass redsys platform with ok response', () => {
    cy.get('#inputCard').type('4548810000000003')
    cy.get('#cad1').type('12')
    cy.get('#cad2').type('49')
    cy.get('#codseg').type('123')
    cy.get('#divImgAceptar').click()
    cy.get('input#boton').click()
    cy.get('input[lngid="continuar"]').click()
    cy.url()
      .should('contain', 'http://localhost:3000')
      .and('contain', 'MerchantParameters')
  })

  // it("should pass redsys platform with ko response", () => {
  //   cy.get("#inputCard").type("4548810000000003");
  //   cy.get("#cad1").type("12");
  //   cy.get("#cad2").type("49");
  //   cy.get("#codseg").type("123");
  //   cy.get("#divImgAceptar").click();
  //   cy.get('input[value="N"]').click();
  //   cy.get("input#boton").click();
  //   cy.get('button[lngid="cancelar"]').click();
  //   cy.get('input[lngid="continuar"]').click();
  // });
})
