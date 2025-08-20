import DataAutomationId from "../libs/data-automation-id";
import { Canid } from "../libs/classes/canid";

let isHighlightingEnabled = false;
const dataAutomationId = new DataAutomationId();



function onReady(callback: () => void) {
  if (document.readyState === "complete" || document.readyState === "interactive") {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  }
}

onReady(() => {
  const canid = new Canid();
  canid.insertEnvAlert(window.location.href);

  chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
    if (message.action === "toggleHighlight") {
      isHighlightingEnabled = message.enabled;
      if (isHighlightingEnabled) {
        dataAutomationId.highlight(isHighlightingEnabled);
      } else {
        dataAutomationId.removeHighlights();
      }
      sendResponse({ success: true });
    }

    if (message.action === "randomPatientData") {
      const canid = new Canid();
      await canid.fillPatientForm();

      sendResponse({ success: true });
    }

    if (message.action === "addHistoricImmunizations") {
      const canid = new Canid();
      const dobElement: HTMLElement | null = document.querySelector(
        '[data-automation-id="patient-profile-head"] .ui.header > .sub.header :first-child'
      );

      if (!dobElement) {
        console.error("Birthdate element not found in the patient profile header.");
        sendResponse({ success: false, error: "Birthdate element not found" });
        return;
      }
      // @ts-ignore
      const birthdate: string =
        dobElement?.textContent?.split(" / ")[0].trim() || "";
      if (!birthdate) {
        console.error("Birthdate not found in the patient profile header.");
        sendResponse({ success: false, error: "Birthdate not found" });
        return;
      }

      canid.addHistoricImmunizations(birthdate);
      sendResponse({ success: true });
    }

    if (message.action === "getPatientInfo") {
      const canid = new Canid();
      const patientInfo = await canid.getPatientInfo();
      console.log('Patient info:', patientInfo);
      sendResponse({ data: patientInfo });
      return true; // Necesario para respuestas async
    }
  });
});

let observerTimeout: any;
const observer = new MutationObserver(() => {
  if (isHighlightingEnabled) {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      dataAutomationId.highlight(isHighlightingEnabled);
    }, 200);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
