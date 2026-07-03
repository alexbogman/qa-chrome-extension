import type { PatientTestData } from "./libs/patient-test-data.ts";
import type { HistoricImmunizationsData } from "./libs/historic-immunizations-data.ts";
import {
  LAST_PATIENT_DATA_KEY,
  LAST_IMMUNIZATIONS_DATA_KEY,
} from "./libs/constants/storage.ts";

const highlightToggle = document.getElementById(
  "highlightToggle",
) as HTMLInputElement | null;
const randomPatientDataBtn = document.getElementById("randomPatientDataBtn");
const addHistoricImmunizationsBtn = document.getElementById(
  "addHistoricImmunizationsBtn",
);
const copyPatientDataBtn = document.getElementById(
  "copyPatientDataBtn",
) as HTMLButtonElement | null;
const copyImmunizationsDataBtn = document.getElementById(
  "copyImmunizationsDataBtn",
) as HTMLButtonElement | null;
const lastPatientPreview = document.getElementById("lastPatientPreview");
const lastImmunizationsPreview = document.getElementById(
  "lastImmunizationsPreview",
);
const statusEl = document.getElementById("status");

let highlightEnabled = false;
let lastPatientData: PatientTestData | null = null;
let lastImmunizationsData: HistoricImmunizationsData | null = null;

type TabResponse = {
  success: boolean;
  error?: string;
  patientData?: PatientTestData;
  immunizationsData?: HistoricImmunizationsData;
};

function setStatus(message: string, type: "success" | "error" | "" = "") {
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = type ? `status status--${type}` : "status";
}

function sendToActiveTab(
  message: Record<string, unknown>,
): Promise<TabResponse> {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (typeof tabId !== "number") {
        resolve({ success: false, error: "No active tab found" });
        return;
      }
      chrome.tabs.sendMessage(tabId, message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            error: "Extension not available on this page",
          });
          return;
        }
        resolve((response as TabResponse) ?? { success: true });
      });
    });
  });
}

function updatePreview<T>(
  previewEl: HTMLElement | null,
  data: T | null,
  format: (value: T) => string,
  emptyMessage: string,
) {
  if (!previewEl) return;

  if (data) {
    previewEl.textContent = format(data);
    previewEl.classList.remove("copy-section__preview--empty");
  } else {
    previewEl.textContent = emptyMessage;
    previewEl.classList.add("copy-section__preview--empty");
  }
}

function updatePatientCopySection() {
  if (copyPatientDataBtn) {
    copyPatientDataBtn.disabled = lastPatientData === null;
  }
  updatePreview(
    lastPatientPreview,
    lastPatientData,
    (data) => `${data.firstName} ${data.lastName} · ${data.mrn}`,
    "No data yet — run fill patient form",
  );
}

function updateImmunizationsCopySection() {
  if (copyImmunizationsDataBtn) {
    copyImmunizationsDataBtn.disabled = lastImmunizationsData === null;
  }
  updatePreview(
    lastImmunizationsPreview,
    lastImmunizationsData,
    (data) => {
      const doseLabel = data.doses.length === 1 ? "dose" : "doses";
      return `${data.doses.length} ${doseLabel} · DOB ${data.patientBirthDate}`;
    },
    "No data yet — run historic immunizations",
  );
}

function loadStoredData() {
  chrome.storage.local.get(
    [LAST_PATIENT_DATA_KEY, LAST_IMMUNIZATIONS_DATA_KEY],
    (result) => {
      lastPatientData = result[LAST_PATIENT_DATA_KEY] ?? null;
      lastImmunizationsData = result[LAST_IMMUNIZATIONS_DATA_KEY] ?? null;
      updatePatientCopySection();
      updateImmunizationsCopySection();
    },
  );
}

function syncHighlightToTab() {
  sendToActiveTab({ action: "toggleHighlight", enabled: highlightEnabled });
}

function updateHighlightToggle() {
  if (highlightToggle) {
    highlightToggle.checked = highlightEnabled;
  }
}

async function copyJsonToClipboard(
  button: HTMLButtonElement,
  data: unknown,
  successMessage: string,
) {
  try {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    const originalText = button.textContent;
    button.textContent = "Copied!";
    setStatus(successMessage, "success");
    setTimeout(() => {
      button.textContent = originalText;
    }, 1500);
  } catch {
    setStatus("Could not copy to clipboard", "error");
  }
}

chrome.storage.local.get("isHighlightingEnabled", (result) => {
  highlightEnabled = result.isHighlightingEnabled ?? false;
  updateHighlightToggle();
  syncHighlightToTab();
});

loadStoredData();

if (highlightToggle) {
  highlightToggle.addEventListener("change", () => {
    highlightEnabled = highlightToggle.checked;
    chrome.storage.local.set({ isHighlightingEnabled: highlightEnabled });
    syncHighlightToTab();
  });
}

async function runAction(
  button: HTMLElement | null,
  action: string,
  runningLabel: string,
  successLabel: string,
) {
  if (!button) return;

  button.setAttribute("disabled", "true");
  const originalText = button.textContent;
  button.textContent = runningLabel;
  setStatus("");

  const result = await sendToActiveTab({ action });

  button.removeAttribute("disabled");
  button.textContent = originalText;

  if (result.success) {
    if (action === "randomPatientData" && result.patientData) {
      lastPatientData = result.patientData;
      chrome.storage.local.set({ [LAST_PATIENT_DATA_KEY]: result.patientData });
      updatePatientCopySection();
    }
    if (action === "addHistoricImmunizations" && result.immunizationsData) {
      lastImmunizationsData = result.immunizationsData;
      chrome.storage.local.set({
        [LAST_IMMUNIZATIONS_DATA_KEY]: result.immunizationsData,
      });
      updateImmunizationsCopySection();
    }
    setStatus(successLabel, "success");
  } else {
    setStatus(result.error ?? "Action failed", "error");
  }
}

if (randomPatientDataBtn) {
  randomPatientDataBtn.addEventListener("click", () => {
    runAction(
      randomPatientDataBtn,
      "randomPatientData",
      "Running…",
      "Patient form filled",
    );
  });
}

if (addHistoricImmunizationsBtn) {
  addHistoricImmunizationsBtn.addEventListener("click", () => {
    runAction(
      addHistoricImmunizationsBtn,
      "addHistoricImmunizations",
      "Running…",
      "Immunizations added",
    );
  });
}

if (copyPatientDataBtn) {
  copyPatientDataBtn.addEventListener("click", () => {
    if (!lastPatientData) return;
    copyJsonToClipboard(
      copyPatientDataBtn,
      lastPatientData,
      "Patient JSON copied to clipboard",
    );
  });
}

if (copyImmunizationsDataBtn) {
  copyImmunizationsDataBtn.addEventListener("click", () => {
    if (!lastImmunizationsData) return;
    copyJsonToClipboard(
      copyImmunizationsDataBtn,
      lastImmunizationsData,
      "Immunizations JSON copied to clipboard",
    );
  });
}
