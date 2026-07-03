export type HistoricImmunizationDose = {
  vaccineType: string;
  doseKey: string;
  dateGiven: string;
  visDate: string;
};

export type HistoricImmunizationsData = {
  patientBirthDate: string;
  currentAgeInMonths: number;
  doses: HistoricImmunizationDose[];
};
