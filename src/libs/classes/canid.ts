import { faker } from "@faker-js/faker";
import { addMonths, format, parse } from "date-fns";
import { selectDropdownValue, setValue, simulateTyping } from "../dom-utils";
import { VaccineScheduleInMonths } from "../../shared/vaccine-data";
import {
  PP_URL_LOCAL,
  PP_URL_PROD,
  PP_URL_STAGING,
  IT_URL_LOCAL,
  IT_URL_PROD,
  IT_URL_STAGING,
} from "../const/canid";

export class Canid {
  insertEnvAlert(envUrl: string) {
    if (envUrl.includes(PP_URL_LOCAL) || envUrl.includes(IT_URL_LOCAL)) {
      const alert = document.createElement("div");
      alert.style.position = "fixed";
      alert.style.left = "0";
      alert.style.right = "0";
      alert.style.bottom = "20px"
      alert.style.zIndex = "9999";
      alert.style.width = "fit-content";
      alert.style.margin = "0 auto";
      alert.style.fontSize = "0.9rem";
      alert.style.fontWeight = "600";
      alert.style.textAlign = "center";
      alert.style.textShadow = "rgba(0, 0, 0, 0.2) 1px 1px";
      alert.style.padding = "0.8rem";
      alert.style.borderRadius = "0.5rem";
      alert.style.color = "white";
      alert.style.backgroundColor = "#45b39d";
      alert.textContent = "Chill: You are testing local environment.";
      document.body.insertAdjacentElement("afterbegin", alert);
    } else if (
      envUrl.includes(PP_URL_STAGING) ||
      envUrl.includes(IT_URL_STAGING)
    ) {
      const alert = document.createElement("div");
      alert.style.position = "fixed";
      alert.style.left = "0";
      alert.style.right = "0";
      alert.style.bottom = "20px"
      alert.style.zIndex = "9999";
      alert.style.width = "fit-content";
      alert.style.margin = "0px auto";
      alert.style.fontSize = "0.9rem";
      alert.style.fontWeight = "600";
      alert.style.textAlign = "center";
      alert.style.textShadow = "rgba(0, 0, 0, 0.2) 1px 1px";
      alert.style.padding = "0.8rem";
      alert.style.borderRadius = "0.5rem";
      alert.style.color = "white";
      alert.style.backgroundColor = "#f1c40f";
      alert.textContent = "Chill, but not too much: You are testing staging environment.";
      document.body.insertAdjacentElement("afterbegin", alert);

    } else if (envUrl.includes(PP_URL_PROD) || envUrl.includes(IT_URL_PROD)) {
      const alert = document.createElement("div");
      alert.style.position = "fixed";
      alert.style.left = "0";
      alert.style.right = "0";
      alert.style.bottom = "20px"
      alert.style.zIndex = "9999";
      alert.style.width = "fit-content";
      alert.style.margin = "0 auto";
      alert.style.fontSize = "0.9rem";
      alert.style.fontWeight = "600";
      alert.style.textAlign = "center";
      alert.style.textShadow = "rgba(0, 0, 0, 0.2) 1px 1px";
      alert.style.padding = "0.8rem";
      alert.style.borderRadius = "0.5rem";
      alert.style.color = "white";
      alert.style.backgroundColor = "#e74c3c";
      alert.textContent = "Danger: You are in a production environment, be careful or face the consequences.";
      document.body.insertAdjacentElement("afterbegin", alert);
    }
  }

  async getPatientInfo() {
    console.log("Fetching patient info...");
    const patientInfoBtn: HTMLElement | null = document.querySelector(
      '[data-automation-id="patient-profile-head"] div a:first-child'
    );
    const insuranceInfoBtn: HTMLElement | null = document.querySelector(
      '[data-automation-id="patient-profile-head"] div a:nth-child(2)'
    );
    let insuranceName = "";
    let memberId = "";
    let patientInfo: any = {};
    const getText = (selector: string): string =>
      document.querySelector<any>(selector)?.value?.trim() || "";

    if (patientInfoBtn) {
      patientInfoBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 500)); // Espera a que cargue el form
      patientInfo.firstName = getText('[placeholder="First name"]');
      patientInfo.lastName = getText('[placeholder="Last name"]');
      patientInfo.dob = getText('[placeholder="Select date..."]');
      patientInfo.sex =
        document
          .querySelector(
            '[data-automation-id="patient-basic-sex"] div:first-child'
          )
          ?.textContent?.trim() || "";
      patientInfo.email = getText('[placeholder="Email"]');
      patientInfo.phone = getText('[placeholder="Phone number"]');
      patientInfo.street = getText('[placeholder="Street & number"]');
      patientInfo.city = getText('[placeholder="City"]');
      patientInfo.state = "New York";
      patientInfo.zip = getText('[placeholder="10010"]');
    }

    if (insuranceInfoBtn) {
      insuranceInfoBtn.click();
      await new Promise((resolve) => setTimeout(resolve, 500)); // Espera a que cargue la sección
      try {
        const insuranceTable = document.querySelectorAll("table")[1];
        if (insuranceTable) {
          insuranceName =
            insuranceTable
              .querySelector("tbody tr:first-child td:nth-child(2)")
              ?.textContent?.trim() || "";
          memberId =
            insuranceTable
              .querySelector("tbody tr:first-child td:nth-child(3)")
              ?.textContent?.trim() || "";
        }
      } catch (err) {
        console.warn("Insurance info not found", err);
      }
    }

    // Devuelve el string separado por comas
    return [
      patientInfo.firstName,
      patientInfo.lastName,
      patientInfo.dob,
      memberId,
      patientInfo.street,
      patientInfo.city,
      patientInfo.zip,
      patientInfo.state,
      //patientInfo.sex,
      patientInfo.phone,
      patientInfo.email,
      insuranceName,
    ]
      .map((v) => `${String(v).replace(/"/g, '""')}`)
      .join(",");
  }

  async fillPatientForm() {
    const sexType = faker.person.sexType();
    const data = {
      mrn: `QAT${faker.number
        .bigInt({ min: 1000000000, max: 9999999999 })
        .toString()}`,
      firstName: faker.person.firstName(sexType),
      lastName: faker.person.lastName(),
      sex: sexType,
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: "New York",
      zip: faker.location.zipCode(),
      dob: format(
        faker.date.birthdate({ min: 0, max: 18, mode: "age" }),
        "yyyy/MM/dd"
      ),
    };

    await setValue(
      '[data-automation-id="patient-basic-mrn"] > input',
      data.mrn
    );
    await setValue(
      '[data-automation-id="patient-basic-first-name"] > input',
      data.firstName
    );
    await setValue(
      '[data-automation-id="patient-basic-last-name"] > input',
      data.lastName
    );
    await simulateTyping(
      '[data-automation-id="patient-basic-date-of-birth"] > input',
      data.dob
    );
    await setValue(
      '[data-automation-id="patient-basic-email"] > input',
      `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`
    );
    await setValue('[placeholder="Phone number"]', data.phone);
    await setValue(
      '[data-automation-id="patient-basic-street"] > input',
      data.address
    );
    await setValue(
      '[data-automation-id="patient-basic-city"] > input',
      data.city
    );
    // await setValue('[data-automation-id="patient-basic-state"] > input', data.state);
    await setValue(
      '[data-automation-id="patient-basic-zip"] > input',
      data.zip
    );
  }

  async addHistoricImmunizations(birthdate: string) {
    const birth = parse(birthdate, "MM/dd/yyyy", new Date());
    const now = new Date();
    const currentAgeInMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());

    for (const vaccineType of Object.keys(VaccineScheduleInMonths)) {
      const schedule: any = VaccineScheduleInMonths[vaccineType];
      for (const doseKey of Object.keys(schedule)) {
        // Usa el validador aquí
        const doseInfo = this.getDoseDueDate(
          vaccineType,
          doseKey,
          format(birth, "MM/dd/yyyy"),
          currentAgeInMonths
        );
        if (doseInfo?.due) {
          // Solo si corresponde, inserta la dosis
          const inserted = await this.insertDoseToForm(
            vaccineType,
            doseKey,
            doseInfo.date
          );
          if (inserted) {
            console.log(
              `Inserted ${vaccineType} - ${doseKey} on ${doseInfo.date}`
            );
          } else {
            console.warn(
              `Failed to insert ${vaccineType} - ${doseKey} on ${doseInfo.date}`
            );
          }
        }
      }
    }
  }

  async insertDoseToForm(vaccineType: string, doseKey: string, date: string) {
    console.log(`Inserting ${vaccineType} - ${doseKey} on ${date}`);
    // Aquí va la lógica para manipular el DOM del formulario
    await selectDropdownValue(
      '[data-automation-id="vaccine-picker"] > input',
      vaccineType
    );
    await setValue(
      '[data-automation-id="historical-imm-date-given"] input',
      date,
      true
    );
    await setValue(
      '[data-automation-id="historical-imm-vis-date"] input[type=text]',
      date,
      true
    );

    const saveBtn: HTMLButtonElement | null = document.querySelector(
      //"body > div:nth-child(5) > div > div.scrolling.content > form > button"
      "body > div.modals:last-child > div > div.scrolling.content > form > button"
    );

    saveBtn?.click();
    await new Promise((res) => setTimeout(res, 500)); // Espera para que se procese la inserción

    return true;
  }

  /**
   * Retorna la fecha en que corresponde aplicar la dosis, si corresponde según la edad.
   * @param vaccineType Tipo de vacuna (string)
   * @param doseKey Clave de la dosis (ej: "dose_1")
   * @param birthDate Fecha de nacimiento en formato MM/dd/yyyy
   * @param currentAgeInMonths Edad actual en meses
   * @returns { date: string, due: boolean }
   */
  getDoseDueDate(
    vaccineType: string,
    doseKey: string,
    birthDate: string,
    currentAgeInMonths: number
  ): { date: string; due: boolean } | null {
    const schedule: any = VaccineScheduleInMonths[vaccineType];
    if (!schedule || !(doseKey in schedule)) return null;

    const doseMonth = schedule[doseKey];
    // Parsea la fecha de nacimiento
    const birth = parse(birthDate, "MM/dd/yyyy", new Date());
    // Calcula la fecha en que corresponde la dosis
    const dueDate = addMonths(birth, doseMonth);
    // Formatea la fecha en MM/dd/yyyy
    const formattedDueDate = format(dueDate, "MM/dd/yyyy");
    // ¿Corresponde la dosis según la edad actual?
    const due = currentAgeInMonths >= doseMonth;

    return { date: formattedDueDate, due };
  }

  // Ejemplo de uso:
  // const birthDate = "01/01/2025";
  // const ageInMonths = 2; // edad actual
  // const result = getDoseDueDate(VaccineTypes.DTaP, "dose_1", birthDate, ageInMonths);
  // result: { date: "03/01/2025", due: true }
}
