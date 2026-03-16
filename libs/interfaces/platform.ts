export interface Platform {
  getPatientDemographics(): void;
  getInsurance(): void;
  getImmunizations(): void;
}
