import type { Platform } from "../interfaces/platform";

export class Develo implements Platform {
  async getPatientDemographics() {
    const mrn = document.querySelector(
      '[data-testid="MRN"] [data-testid="value-box"]'
    );
    const firstName = document.querySelector(
      '[data-testid="first-name"] [data-testid="value-box"]'
    );
    const lastName = document.querySelector(
      '[data-testid="Family name"] [data-testid="value-box"]'
    );
    const dob = document.querySelector(
      '[data-testid="Date of birth"] [data-testid="value-box"]'
    );
    const gender = document.querySelector(
      '[data-testid="Sex at birth"] [data-testid="value-box"]'
    );
    const address = document.querySelector(
      '[data-testid="Home address"] [data-testid="value-box"]'
    );

    return {
      mrn: mrn?.textContent,
      firstName: firstName?.textContent,
      lastName: lastName?.textContent,
      dob: dob?.textContent,
      gender: gender?.textContent,
      address: address?.textContent,
    };
  }

  async getInsurance() {
    return {
      name: "Not implemented yet",
      policyNumber: "Not implemented yet",
      groupNumber: "Not implemented yet",
    };
  }

  async getImmunizations() {
    return {
      name: "Not implemented yet",
      date: "Not implemented yet",
    };
  }
}
