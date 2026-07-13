import type { PatientTestData } from "./libs/patient-test-data.ts";
import type { HistoricImmunizationsData } from "./libs/historic-immunizations-data.ts";
import type { PageNote } from "./libs/notes.ts";
import { getPageScope } from "./libs/page-scope.ts";
import {
  LAST_PATIENT_DATA_KEY,
  LAST_IMMUNIZATIONS_DATA_KEY,
  PAGE_NOTES_KEY,
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
const notesCount = document.getElementById("notesCount");
const notesList = document.getElementById("notesList");
const copyNotesBtn = document.getElementById(
  "copyNotesBtn",
) as HTMLButtonElement | null;
const downloadReportBtn = document.getElementById(
  "downloadReportBtn",
) as HTMLButtonElement | null;
const clearNotesBtn = document.getElementById(
  "clearNotesBtn",
) as HTMLButtonElement | null;
const statusEl = document.getElementById("status");

let highlightEnabled = false;
let currentTabUrl = "";
let currentPageNotes: PageNote[] = [];
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

function formatNoteTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatNotesReport(url: string, notes: PageNote[]): string {
  const generatedAt = formatNoteTimestamp(new Date().toISOString());
  const pageScope = getPageScope(url);
  const header = `QA Test Notes — ${pageScope}\nGenerated: ${generatedAt}\n`;

  if (notes.length === 0) {
    return `${header}\nNo notes recorded for this page.`;
  }

  const body = notes
    .map((note, index) => {
      return `[${index + 1}] Selector: ${note.selector}
    Note: ${note.note}
    Time: ${formatNoteTimestamp(note.createdAt)}`;
    })
    .join("\n\n");

  return `${header}\n${body}`;
}

function updateNotesSection() {
  const hasNotes = currentPageNotes.length > 0;

  if (notesCount) {
    notesCount.textContent = String(currentPageNotes.length);
  }

  if (copyNotesBtn) {
    copyNotesBtn.disabled = !hasNotes;
  }
  if (downloadReportBtn) {
    downloadReportBtn.disabled = !hasNotes;
  }
  if (clearNotesBtn) {
    clearNotesBtn.disabled = !hasNotes;
  }

  if (!notesList) return;

  notesList.innerHTML = "";

  if (!hasNotes) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "note-item note-item--empty";
    emptyItem.textContent = "No notes yet — right-click an element and choose Add QA Note";
    notesList.appendChild(emptyItem);
    return;
  }

  currentPageNotes.forEach((note, index) => {
    const item = document.createElement("li");
    item.className = "note-item";

    const badge = document.createElement("span");
    badge.className = "note-item__badge";
    badge.textContent = String(index + 1);

    const content = document.createElement("div");
    content.className = "note-item__content";

    const selector = document.createElement("code");
    selector.className = "note-item__selector";
    selector.textContent = note.selector;
    selector.title = note.selector;

    const text = document.createElement("p");
    text.className = "note-item__text";
    text.textContent = note.note;

    const time = document.createElement("span");
    time.className = "note-item__time";
    time.textContent = formatNoteTimestamp(note.createdAt);

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "note-item__delete";
    deleteBtn.setAttribute("aria-label", `Delete note ${index + 1}`);
    deleteBtn.textContent = "×";
    deleteBtn.addEventListener("click", async () => {
      const result = await sendToActiveTab({
        action: "deleteNote",
        id: note.id,
      });
      if (result.success) {
        currentPageNotes = currentPageNotes.filter((n) => n.id !== note.id);
        updateNotesSection();
        setStatus("Note deleted", "success");
      } else {
        setStatus(result.error ?? "Could not delete note", "error");
      }
    });

    content.append(selector, text, time);
    item.append(badge, content, deleteBtn);
    notesList.appendChild(item);
  });
}

function loadNotesForCurrentTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    currentTabUrl = tabs[0]?.url ?? "";
    const pageScope = getPageScope(currentTabUrl);
    chrome.storage.local.get(PAGE_NOTES_KEY, (result) => {
      const allNotes = (result[PAGE_NOTES_KEY] as PageNote[] | undefined) ?? [];
      currentPageNotes = allNotes.filter(
        (note) => note.url === pageScope || getPageScope(note.url) === pageScope,
      );
      updateNotesSection();
    });
  });
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
loadNotesForCurrentTab();

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[PAGE_NOTES_KEY]) return;
  const allNotes =
    (changes[PAGE_NOTES_KEY].newValue as PageNote[] | undefined) ?? [];
  const pageScope = getPageScope(currentTabUrl);
  currentPageNotes = allNotes.filter(
    (note) => note.url === pageScope || getPageScope(note.url) === pageScope,
  );
  updateNotesSection();
});

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

if (copyNotesBtn) {
  copyNotesBtn.addEventListener("click", async () => {
    if (currentPageNotes.length === 0) return;
    try {
      const report = formatNotesReport(currentTabUrl, currentPageNotes);
      await navigator.clipboard.writeText(report);
      const originalText = copyNotesBtn.textContent;
      copyNotesBtn.textContent = "Copied!";
      setStatus("Notes copied to clipboard", "success");
      setTimeout(() => {
        copyNotesBtn.textContent = originalText;
      }, 1500);
    } catch {
      setStatus("Could not copy to clipboard", "error");
    }
  });
}

if (downloadReportBtn) {
  downloadReportBtn.addEventListener("click", () => {
    if (currentPageNotes.length === 0) return;

    const report = formatNotesReport(currentTabUrl, currentPageNotes);
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeHost = (() => {
      if (!currentTabUrl) return "page";
      try {
        return new URL(currentTabUrl).hostname.replace(/[^a-z0-9.-]/gi, "-");
      } catch {
        return "page";
      }
    })();
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `qa-notes-${safeHost}-${timestamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Report downloaded", "success");
  });
}

if (clearNotesBtn) {
  clearNotesBtn.addEventListener("click", async () => {
    const result = await sendToActiveTab({ action: "clearNotes" });
    if (result.success) {
      currentPageNotes = [];
      updateNotesSection();
      setStatus("All notes cleared for this page", "success");
    } else {
      setStatus(result.error ?? "Could not clear notes", "error");
    }
  });
}
