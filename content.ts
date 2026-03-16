import { Canid } from "./libs/classes/canid.ts";
import DataAutomationId from "./libs/data-automation-id.ts";
import { onReady } from "./libs/dom-utils.ts";

let isHighlightingEnabled = false;
const dataAutomationId = new DataAutomationId();
const canid = new Canid();

onReady(() => {
  canid.insertEnvAlert(window.location.href);

  chrome.storage.local.get("isHighlightingEnabled", (result) => {
    isHighlightingEnabled = result.isHighlightingEnabled ?? false;
    if (isHighlightingEnabled) {
      dataAutomationId.highlight(isHighlightingEnabled);
    }
  });

  chrome.runtime.onMessage.addListener(
    async (message, _sender, sendResponse) => {
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
          '[data-automation-id="patient-profile-head"] .ui.header > .sub.header :first-child',
        );

        if (!dobElement) {
          console.error(
            "Birthdate element not found in the patient profile header.",
          );
          sendResponse({
            success: false,
            error: "Birthdate element not found",
          });
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
    },
  );
});

let observerTimeout: any;
const observer = new MutationObserver(() => {
  //canid.showInputScan();
  if (isHighlightingEnabled) {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      dataAutomationId.highlight(isHighlightingEnabled);
    }, 200);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
