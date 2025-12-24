// @ts-ignore
import { onReady } from "../libs/dom-utils?chunk=develo";
// @ts-ignore
import { Develo } from "../libs/classes/develo?chunk=develo";

const develo = new Develo();

onReady(() => {
  console.log("Develo content script loaded");
  chrome.runtime.onMessage.addListener(
    async (message, _sender, sendResponse) => {
      if (message.action === "getPatientDemographic") {
        const patientDemographics = await develo.getPatientDemographics();
        sendResponse(patientDemographics);
      }

      if (message.action === "getInsurance") {
        const insurance = await develo.getInsurance();
        sendResponse(insurance);
      }

      if (message.action === "getImmunizations") {
        const immunizations = await develo.getImmunizations();
        sendResponse(immunizations);
      }
    }
  );
});
