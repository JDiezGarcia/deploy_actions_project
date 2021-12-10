/// <reference types="cypress" />

let TOTAL_USERS = 10;

describe("Test de endpoints", () => {
  before(() => {
    cy.visit("/");
    cy.request("DELETE", "api/users", {}).then((response) => {
      expect(response.body).to.have.property("message", `All users deleted`);
    });
  });

  Cypress._.times(TOTAL_USERS, () => {
    it("Endpoint user creation", () => {
      const uuid = () => Cypress._.random(0, 1e6);
      const id = uuid();
      const testName = `testname${id}`;
      const testLastName = `testname${id}`;

      cy.request("POST", "api/users", {
        name: testName,
        lastName: testLastName,
        email: `${testName}@gmai.com`,
      }).then((response) => {
        expect(response.body).to.have.property("greeting", `Hello ${testName}`);
      });
    });
  });

  it("Endpoint get users", () => {
    cy.request("GET", "api/users", {}).then((response) => {
      expect(response.body).to.have.lengthOf(TOTAL_USERS);
    });
  });

  after(() => {
    cy.visit("/");
    cy.request("DELETE", "api/users", {}).then((response) => {
      expect(response.body).to.have.property("message", `All users deleted`);
    });
  });
});
