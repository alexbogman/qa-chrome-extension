export const VaccineTypes = {
  MMR: "MMR",
  Varicella: "VARICELLA",
  HepatitisA: "HepA",
  HepatitisB: "HepB",
  Influenza: "FLU",
  COVID19: "COVID-19",
  Tdap: "TDAP",
  Pneumococcal: "PneumoPCV",
  HPV: "HPV",
  Meningococcal: "MENING",
  Rotavirus: "ROTAVIRUS",
  Polio: "POLIO",
  DTaP: "DTAP",
  Hib: "HIB",
};

export const VaccineScheduleInMonths = {
  [VaccineTypes.MMR]: {
    dose_1: 12, // 12 meses (1 año)
    dose_2: 15, // 15 meses (1 año y 3 meses)
  },
  [VaccineTypes.Varicella]: {
    dose_1: 12, // 12 meses
    dose_2: 15, // 15 meses
  },
  [VaccineTypes.HepatitisA]: {
    dose_1: 12, // 12 meses
    dose_2: 18, // 18 meses (6 meses después de la primera)
  },
  [VaccineTypes.HepatitisB]: {
    dose_1: 0, // Al nacer
    dose_2: 1, // 1 mes
    dose_3: 6, // 6 meses
  },
  [VaccineTypes.Influenza]: {
    dose_1: 6, // 6 meses (primer dosis)
    // Luego anual, pero aquí solo la primera
  },
  [VaccineTypes.COVID19]: {
    dose_1: 60, // 5 años (60 meses) - según CDC, para niños pequeños
    dose_2: 61, // 1 mes después (ejemplo, depende del esquema)
    dose_3: 73, // 6 años y 1 mes (booster, ejemplo)
  },
  [VaccineTypes.Tdap]: {
    dose_1: 132, // 11 años (132 meses)
    dose_2: 144, // 12 años (144 meses, booster)
  },
  [VaccineTypes.Pneumococcal]: {
    dose_1: 2, // 2 meses
    dose_2: 4, // 4 meses
    dose_3: 6, // 6 meses
    dose_4: 12, // 12 meses
  },
  [VaccineTypes.HPV]: {
    dose_1: 132, // 11 años (132 meses)
    dose_2: 144, // 12 años (144 meses)
    dose_3: 192, // 16 años (192 meses, booster)
  },
  [VaccineTypes.Meningococcal]: {
    dose_1: 132, // 11 años (132 meses)
    dose_2: 192, // 16 años (192 meses, booster)
  },
  [VaccineTypes.Rotavirus]: {
    dose_1: 2, // 2 meses
    dose_2: 4, // 4 meses
    dose_3: 6, // 6 meses
  },
  [VaccineTypes.Polio]: {
    dose_1: 2, // 2 meses
    dose_2: 4, // 4 meses
    dose_3: 6, // 6 meses
    dose_4: 48, // 4 años (48 meses)
  },
  [VaccineTypes.DTaP]: {
    dose_1: 2, // 2 meses
    dose_2: 4, // 4 meses
    dose_3: 6, // 6 meses
    dose_4: 15, // 15 meses
    dose_5: 48, // 4 años (48 meses)
  },
  [VaccineTypes.Hib]: {
    dose_1: 2, // 2 meses
    dose_2: 4, // 4 meses
    dose_3: 6, // 6 meses
    dose_4: 12, // 12 meses
  },
};