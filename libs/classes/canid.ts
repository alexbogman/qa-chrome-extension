import { faker } from "@faker-js/faker/locale/en";
import { addMonths, format, parse } from "date-fns";
import { selectDropdownValue, setValue, simulateTyping } from "../dom-utils";
import { VaccineScheduleInMonths } from "../../vaccine-data";
import {
  PP_URL_LOCAL,
  PP_URL_PROD,
  PP_URL_STAGING,
  IT_URL_LOCAL,
  IT_URL_PROD,
  IT_URL_STAGING,
} from "../constants/canid";

export class Canid {
  private createAlertElement(text: string, bgColor: string) {
    const alert = document.createElement("div");
    Object.assign(alert.style, {
      position: "fixed",
      left: "50%",
      transform: "translate(-50%, 20px)",
      bottom: "20px",
      zIndex: "9999",
      width: "fit-content",
      fontSize: "0.95rem",
      fontWeight: "600",
      textAlign: "center",
      textShadow: "rgba(0, 0, 0, 0.2) 1px 1px",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      padding: "0.8rem 1.5rem",
      borderRadius: "0.5rem",
      color: "white",
      backgroundColor: bgColor,
      cursor: "pointer",
      opacity: "0",
      transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)", // Smooth bounce effect
      fontFamily: "system-ui, -apple-system, sans-serif",
    });
    
    alert.textContent = text;
    alert.title = "Click to dismiss";

    // Dismiss on click
    alert.addEventListener("click", () => {
      alert.style.opacity = "0";
      alert.style.transform = "translate(-50%, 20px)";
      setTimeout(() => alert.remove(), 400);
    });

    document.body.insertAdjacentElement("beforeend", alert);

    // Trigger animation slightly after appending
    setTimeout(() => {
      alert.style.opacity = "1";
      alert.style.transform = "translate(-50%, 0)";
    }, 50);
  }

  insertEnvAlert(envUrl: string) {
    if (envUrl.includes(PP_URL_LOCAL) || envUrl.includes(IT_URL_LOCAL)) {
      this.createAlertElement("Chill: You are testing local environment. 😌", "#45b39d");
    } else if (
      envUrl.includes(PP_URL_STAGING) ||
      envUrl.includes(IT_URL_STAGING)
    ) {
      this.createAlertElement("Chill, but not too much: You are testing staging environment. 🤔", "#f39c12");
    } else if (envUrl.includes(PP_URL_PROD) || envUrl.includes(IT_URL_PROD)) {
      this.createAlertElement("Danger: You are in a production environment, be careful or face the consequences! 🚨", "#e74c3c");
    }
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
        "yyyy/MM/dd",
      ),
    };

    await setValue(
      '[data-automation-id="patient-basic-mrn"] > input',
      data.mrn,
    );
    await setValue(
      '[data-automation-id="patient-basic-first-name"] > input',
      data.firstName,
    );
    await setValue(
      '[data-automation-id="patient-basic-last-name"] > input',
      data.lastName,
    );
    await simulateTyping(
      '[data-automation-id="patient-basic-date-of-birth"] > input',
      data.dob,
    );
    await setValue(
      '[data-automation-id="patient-basic-email"] > input',
      `${data.firstName.toLowerCase()}.${data.lastName.toLowerCase()}@example.com`,
    );
    await setValue('[placeholder="Phone number"]', data.phone);
    await setValue(
      '[data-automation-id="patient-basic-street"] > input',
      data.address,
    );
    await setValue(
      '[data-automation-id="patient-basic-city"] > input',
      data.city,
    );
    // await setValue('[data-automation-id="patient-basic-state"] > input', data.state);
    await setValue(
      '[data-automation-id="patient-basic-zip"] > input',
      data.zip,
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
          currentAgeInMonths,
        );
        if (doseInfo?.due) {
          // Solo si corresponde, inserta la dosis
          const inserted = await this.insertDoseToForm(
            vaccineType,
            doseKey,
            doseInfo.date,
          );
          if (inserted) {
            console.log(
              `Inserted ${vaccineType} - ${doseKey} on ${doseInfo.date}`,
            );
          } else {
            console.warn(
              `Failed to insert ${vaccineType} - ${doseKey} on ${doseInfo.date}`,
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
      vaccineType,
    );
    await setValue(
      '[data-automation-id="historical-imm-date-given"] input',
      date,
      true,
    );
    await setValue(
      '[data-automation-id="historical-imm-vis-date"] input[type=text]',
      date,
      true,
    );

    const saveBtn: HTMLButtonElement | null = document.querySelector(
      //"body > div:nth-child(5) > div > div.scrolling.content > form > button"
      "body > div.modals:last-child > div > div.scrolling.content > form > button",
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
    currentAgeInMonths: number,
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
}
