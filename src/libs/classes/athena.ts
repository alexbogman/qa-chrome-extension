import type { Platform } from "../interfaces/platform";

export class Athena implements Platform {
  getPatientDemographics() {}

  getInsurance() {}

  getImmunizations() {
    let vaccineList: any[] = [];
    document
      .querySelectorAll(
        '[class="autostart accordion-container encounter-list administered-list"] > [class="clear encounter-list-item accordion-item accordion-trigger clickable"]'
      )
      .forEach((ele) => {
        if (!ele.querySelector('[class="accordion-trigger clickable name"]')) {
          return;
        }

        const vaccineName: string | null | undefined = ele?.querySelector(
          '[class="accordion-trigger clickable name"] > [class="genus-name administered"]'
        )?.textContent;
        const vaccineDateAdm: string | null | undefined = ele?.querySelector(
          '[class="accordion-trigger clickable name"] > [class="administer-date"] > span'
        )?.textContent;

        vaccineList.push(`${vaccineName} ${vaccineDateAdm}`);
      });
    vaccineList = [...new Set(vaccineList)];
    console.log("Vaccine Count: " + vaccineList.length);
  }
}
