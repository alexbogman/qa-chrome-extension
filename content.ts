import { Canid } from "./libs/classes/canid.ts";
import { ELEMENT_NOT_FOUND } from "./libs/constants/canid.ts";
import { LAST_PATIENT_DATA_KEY, LAST_IMMUNIZATIONS_DATA_KEY } from "./libs/constants/storage.ts";
import DataAutomationId from "./libs/data-automation-id.ts";
import { onReady } from "./libs/dom-actions.ts";
import { NoteManager } from "./libs/notes.ts";

let isHighlightingEnabled = false;
const dataAutomationId = new DataAutomationId();
const canid = new Canid();
const noteManager = new NoteManager();

onReady(() => {
  canid.insertEnvAlert(window.location.href);
  noteManager.renderAll();

  document.addEventListener(
    "contextmenu",
    (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        noteManager.setContextMenuTarget(null);
        return;
      }

      if (target.closest("[data-qa-note-ui]")) {
        noteManager.setContextMenuTarget(null);
        return;
      }

      noteManager.setContextMenuTarget(target);
    },
    true,
  );

  chrome.storage.local.get("isHighlightingEnabled", (result) => {
    isHighlightingEnabled = result.isHighlightingEnabled ?? false;
    if (isHighlightingEnabled) {
      dataAutomationId.highlight(true);
    }
  });

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === "toggleHighlight") {
      isHighlightingEnabled = message.enabled;
      if (isHighlightingEnabled) {
        dataAutomationId.highlight(true);
      } else {
        dataAutomationId.removeHighlights();
      }
      sendResponse({ success: true });
      return false;
    }

    if (message.action === "randomPatientData") {
      canid
        .fillPatientForm()
        .then((patientData) => {
          chrome.storage.local.set({ [LAST_PATIENT_DATA_KEY]: patientData });
          sendResponse({ success: true, patientData });
        })
        .catch((err) =>
          sendResponse({ success: false, error: String(err) }),
        );
      return true;
    }

    if (message.action === "addHistoricImmunizations") {
      canid.addHistoricImmunizations().then((res) => {
        if (res === ELEMENT_NOT_FOUND) {
          sendResponse({ success: false, error: ELEMENT_NOT_FOUND });
          return;
        }
        chrome.storage.local.set({ [LAST_IMMUNIZATIONS_DATA_KEY]: res });
        sendResponse({ success: true, immunizationsData: res });
      });
      return true;
    }

    if (message.action === "addNoteFromContextMenu") {
      const opened = noteManager.openNoteForContextMenu();
      sendResponse({
        success: opened,
        error: opened ? undefined : "No element selected",
      });
      return false;
    }

    if (message.action === "deleteNote" && typeof message.id === "string") {
      noteManager.deleteNote(message.id).then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    if (message.action === "clearNotes") {
      noteManager.clearNotesForCurrentUrl().then(() => {
        sendResponse({ success: true });
      });
      return true;
    }

    return false;
  });
});

let observerTimeout: ReturnType<typeof setTimeout>;
const observer = new MutationObserver(() => {
  if (isHighlightingEnabled) {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      dataAutomationId.highlight(true);
    }, 200);
  }
});

observer.observe(document.body, { childList: true, subtree: true });
