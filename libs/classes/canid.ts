import { addMonths, format, parse } from "date-fns";
import { selectDropdownValue, setValue, simulateTyping } from "../dom-actions";
import { generatePatientTestData } from "../patient-test-data";
import { VaccineScheduleInMonths } from "../../vaccine-data";
import {
  PP_URL_LOCAL,
  PP_URL_PROD,
  PP_URL_STAGING,
  IT_URL_LOCAL,
  IT_URL_PROD,
  IT_URL_STAGING,
  ELEMENT_NOT_FOUND,
} from "../constants/canid";

export class Canid {
  private createAlertElement(text: string, bgColor: string) {
    const alert = document.createElement("div");
    Object.assign(alert.style, {
      position: "fixed",
      left: "50%",
      transform: "translate(-50%, 20px)",
      bottom: "1.25rem",
      zIndex: "9999",
      width: "fit-content",
      fontSize: "0.875rem",
      fontWeight: "600",
      textAlign: "center",
      boxShadow:
        "0 0.625rem 0.9375rem -0.1875rem rgba(0, 0, 0, 0.1), 0 0.25rem 0.375rem -0.125rem rgba(0, 0, 0, 0.05)",
      padding: "0.75rem 1.25rem",
      borderRadius: "0.5rem",
      color: "white",
      backgroundColor: bgColor,
      cursor: "pointer",
      opacity: "0",
      transition: "opacity 0.3s ease, transform 0.3s ease",
      fontFamily: "system-ui, -apple-system, sans-serif",
    });

    alert.textContent = text;
    alert.title = "Click to dismiss";

    alert.addEventListener("click", () => {
      alert.style.opacity = "0";
      alert.style.transform = "translate(-50%, 20px)";
      setTimeout(() => alert.remove(), 300);
    });

    document.body.insertAdjacentElement("beforeend", alert);

    setTimeout(() => {
      alert.style.opacity = "1";
      alert.style.transform = "translate(-50%, 0)";
    }, 50);
  }

  insertEnvAlert(envUrl: string) {
    if (envUrl.includes(PP_URL_LOCAL) || envUrl.includes(IT_URL_LOCAL)) {
      this.createAlertElement(
        "Chill: You are testing local environment. 😌",
        "#45b39d",
      );
    } else if (
      envUrl.includes(PP_URL_STAGING) ||
      envUrl.includes(IT_URL_STAGING)
    ) {
      this.createAlertElement(
        "Chill, but not too much: You are testing staging environment. 🤔",
        "#f39c12",
      );
    } else if (envUrl.includes(PP_URL_PROD) || envUrl.includes(IT_URL_PROD)) {
      this.createAlertElement(
        "Danger: You are in a production environment, be careful or face the consequences! 🚨",
        "#e74c3c",
      );
    }
  }

  async fillPatientForm() {
    const data = generatePatientTestData();

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
      data.email,
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
    await setValue(
      '[data-automation-id="patient-basic-zip"] > input',
      data.zip,
    );
  }

  async addHistoricImmunizations() {
    const dobElement: HTMLElement | null = document.querySelector(
      '[data-automation-id="patient-profile-head"] .ui.header > .sub.header :first-child',
    );
    if (!dobElement) {
      console.error(
        "Birthdate element not found in the patient profile header.",
      );
      return ELEMENT_NOT_FOUND;
    }
    const birth = parse(
      dobElement.textContent?.split(" / ")[0].trim() || "",
      "MM/dd/yyyy",
      new Date(),
    );
    const now = new Date();
    const currentAgeInMonths =
      (now.getFullYear() - birth.getFullYear()) * 12 +
      (now.getMonth() - birth.getMonth());

    for (const vaccineType of Object.keys(VaccineScheduleInMonths)) {
      const schedule =
        VaccineScheduleInMonths[
          vaccineType as keyof typeof VaccineScheduleInMonths
        ];
      for (const doseKey of Object.keys(schedule)) {
        const doseInfo = this.getDoseDueDate(
          vaccineType,
          doseKey,
          format(birth, "MM/dd/yyyy"),
          currentAgeInMonths,
        );
        if (doseInfo?.due) {
          await this.insertDoseToForm(vaccineType, doseKey, doseInfo.date);
        }
      }
    }
  }

  private async insertDoseToForm(
    vaccineType: string,
    _doseKey: string,
    date: string,
  ) {
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
      'form > button[type="submit"]',
    );

    saveBtn?.click();
    await new Promise((res) => setTimeout(res, 500));
  }

  private getDoseDueDate(
    vaccineType: string,
    doseKey: string,
    birthDate: string,
    currentAgeInMonths: number,
  ): { date: string; due: boolean } | null {
    const schedule =
      VaccineScheduleInMonths[
        vaccineType as keyof typeof VaccineScheduleInMonths
      ];
    if (!schedule || !(doseKey in schedule)) return null;

    const doseMonth = schedule[doseKey as keyof typeof schedule];
    if (doseMonth === undefined) return null;

    const birth = parse(birthDate, "MM/dd/yyyy", new Date());
    const dueDate = addMonths(birth, doseMonth);
    const formattedDueDate = format(dueDate, "MM/dd/yyyy");
    const due = currentAgeInMonths >= doseMonth;

    return { date: formattedDueDate, due };
  }
}
