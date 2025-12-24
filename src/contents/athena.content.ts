import { onReady } from "../libs/dom-utils";
import { Athena } from "../libs/classes/athena";

onReady(() => {
  const athena = new Athena();

  chrome.runtime.onMessage.addListener(
    async (message, _sender, sendResponse) => {
      if (message.action === "getPatientDemographic") {
        athena.getPatientDemographics();
      }

      if (message.action === "getInsurance") {
        athena.getInsurance();
      }

      if (message.action === "getImmunizations") {
        athena.getImmunizations();
      }
    }
  );
});
