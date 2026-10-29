import type {
  PatientAgeType,
  PatientTestData,
} from "./libs/patient-test-data.ts";
import type { HistoricImmunizationsData } from "./libs/historic-immunizations-data.ts";
import type { PageNote } from "./libs/notes.ts";
import { getPageScope } from "./libs/page-scope.ts";
import {
  filterInventoryItems,
  type InventoryFundingFilter,
  type InventoryQrItem,
} from "./libs/inventory-qr.ts";
import {
  LAST_PATIENT_DATA_KEY,
  LAST_IMMUNIZATIONS_DATA_KEY,
  LAST_INVENTORY_QR_KEY,
  PAGE_NOTES_KEY,
  PATIENT_AGE_TYPE_KEY,
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
const fetchInventoryBtn = document.getElementById(
  "fetchInventoryBtn",
) as HTMLButtonElement | null;
const inventorySearch = document.getElementById(
  "inventorySearch",
) as HTMLInputElement | null;
const inventoryFundingFilter = document.getElementById(
  "inventoryFundingFilter",
) as HTMLSelectElement | null;
const inventoryMeta = document.getElementById("inventoryMeta");
const inventoryList = document.getElementById("inventoryList");
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
let allPageNotes: PageNote[] = [];
let lastPatientData: PatientTestData | null = null;
let lastImmunizationsData: HistoricImmunizationsData | null = null;
let patientAgeType: PatientAgeType = "minor";
let inventoryItems: InventoryQrItem[] = [];

type TabResponse = {
  success: boolean;
  error?: string;
  patientData?: PatientTestData;
  immunizationsData?: HistoricImmunizationsData;
  inventory?: InventoryQrItem[];
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
    (data) => {
      const age = data.ageType === "adult" ? "adult" : "minor";
      return `${data.firstName} ${data.lastName} · ${data.sex} · ${age} · ${data.mrn}`;
    },
    "No data yet — run fill patient form",
  );
}

function getSelectedAgeType(): PatientAgeType {
  const checked = document.querySelector(
    'input[name="patientAgeType"]:checked',
  ) as HTMLInputElement | null;
  return checked?.value === "adult" ? "adult" : "minor";
}

function syncAgeTypeRadios() {
  const radios = document.querySelectorAll(
    'input[name="patientAgeType"]',
  ) as NodeListOf<HTMLInputElement>;
  radios.forEach((radio) => {
    radio.checked = radio.value === patientAgeType;
  });
}

function fundingBadgeClass(fundingType: string): string {
  if (fundingType === "vfc") return "inventory-item__badge inventory-item__badge--vfc";
  if (fundingType === "vfa") return "inventory-item__badge inventory-item__badge--vfa";
  if (fundingType === "private") {
    return "inventory-item__badge inventory-item__badge--private";
  }
  return "inventory-item__badge";
}

function getInventoryFundingFilter(): InventoryFundingFilter {
  const value = inventoryFundingFilter?.value;
  if (value === "private" || value === "vfc" || value === "vfa") return value;
  return "all";
}

function updateInventorySection() {
  const hasItems = inventoryItems.length > 0;
  if (inventorySearch) inventorySearch.disabled = !hasItems;
  if (inventoryFundingFilter) inventoryFundingFilter.disabled = !hasItems;
  if (!inventoryList) return;

  if (!hasItems) {
    inventoryList.hidden = true;
    inventoryList.innerHTML = "";
    return;
  }

  const filtered = filterInventoryItems(
    inventoryItems,
    inventorySearch?.value ?? "",
    getInventoryFundingFilter(),
  );

  if (inventoryMeta) {
    inventoryMeta.textContent = `${filtered.length} of ${inventoryItems.length} lots · click Apply on Scan`;
  }

  inventoryList.hidden = false;
  inventoryList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("li");
    empty.className = "inventory-empty";
    empty.textContent = "No lots match this filter";
    inventoryList.appendChild(empty);
    return;
  }

  // Keep the popup usable — show a focused slice; refine with search
  const visible = filtered.slice(0, 40);
  visible.forEach((item) => {
    const li = document.createElement("li");
    li.className = "inventory-item";

    const top = document.createElement("div");
    top.className = "inventory-item__top";

    const text = document.createElement("div");
    const name = document.createElement("p");
    name.className = "inventory-item__name";
    name.textContent = item.name;

    const meta = document.createElement("p");
    meta.className = "inventory-item__meta";
    meta.textContent = `Lot ${item.lot} · Exp ${item.expiration} · ${item.doses} dose${item.doses === 1 ? "" : "s"} · ${item.saleNdc}`;

    text.append(name, meta);

    const badge = document.createElement("span");
    badge.className = fundingBadgeClass(item.fundingType);
    badge.textContent = item.fundingType;

    top.append(text, badge);

    const actions = document.createElement("div");
    actions.className = "inventory-item__actions";

    const applyBtn = document.createElement("button");
    applyBtn.type = "button";
    applyBtn.className = "btn btn--outline";
    applyBtn.textContent = "Apply to Scan";
    applyBtn.addEventListener("click", () => applyInventoryQr(item, applyBtn));

    const copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "btn btn--outline";
    copyBtn.textContent = "Copy QR";
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(item.qrCode);
        const original = copyBtn.textContent;
        copyBtn.textContent = "Copied!";
        setStatus("QR code copied", "success");
        setTimeout(() => {
          copyBtn.textContent = original;
        }, 1200);
      } catch {
        setStatus("Could not copy QR code", "error");
      }
    });

    actions.append(applyBtn, copyBtn);
    li.append(top, actions);
    inventoryList.appendChild(li);
  });

  if (filtered.length > visible.length) {
    const more = document.createElement("li");
    more.className = "inventory-empty";
    more.textContent = `Showing ${visible.length} of ${filtered.length} — refine search to narrow`;
    inventoryList.appendChild(more);
  }
}

async function applyInventoryQr(item: InventoryQrItem, button: HTMLButtonElement) {
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "Applying…";
  setStatus("");

  const result = await sendToActiveTab({
    action: "applyInventoryQr",
    qrCode: item.qrCode,
  });

  button.disabled = false;
  button.textContent = original;

  if (result.success) {
    setStatus(`Applied ${item.name} · ${item.lot}`, "success");
  } else {
    setStatus(result.error ?? "Could not apply QR to Scan", "error");
  }
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

function formatAllNotesReport(notes: PageNote[]): string {
  const generatedAt = formatNoteTimestamp(new Date().toISOString());
  const header = `QA Test Notes — All pages\nGenerated: ${generatedAt}\n`;

  if (notes.length === 0) {
    return `${header}\nNo notes recorded.`;
  }

  const notesByPage = new Map<string, PageNote[]>();
  for (const note of notes) {
    const pageScope = getPageScope(note.url) || note.url || "(unknown page)";
    const pageNotes = notesByPage.get(pageScope) ?? [];
    pageNotes.push(note);
    notesByPage.set(pageScope, pageNotes);
  }

  let noteIndex = 1;
  const sections = [...notesByPage.entries()].map(([pageScope, pageNotes]) => {
    const body = pageNotes
      .map((note) => {
        const line = `[${noteIndex}] Selector: ${note.selector}
    Note: ${note.note}
    Time: ${formatNoteTimestamp(note.createdAt)}`;
        noteIndex += 1;
        return line;
      })
      .join("\n\n");
    return `=== ${pageScope} ===\n\n${body}`;
  });

  return `${header}\n${sections.join("\n\n")}`;
}

function updateNotesSection() {
  const hasNotes = currentPageNotes.length > 0;
  const hasAnyNotes = allPageNotes.length > 0;

  if (notesCount) {
    notesCount.textContent = String(currentPageNotes.length);
  }

  if (copyNotesBtn) {
    copyNotesBtn.disabled = !hasNotes;
  }
  if (downloadReportBtn) {
    downloadReportBtn.disabled = !hasAnyNotes;
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
        allPageNotes = allPageNotes.filter((n) => n.id !== note.id);
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
      allPageNotes = (result[PAGE_NOTES_KEY] as PageNote[] | undefined) ?? [];
      currentPageNotes = allPageNotes.filter(
        (note) => note.url === pageScope || getPageScope(note.url) === pageScope,
      );
      updateNotesSection();
    });
  });
}

function loadStoredData() {
  chrome.storage.local.get(
    [
      LAST_PATIENT_DATA_KEY,
      LAST_IMMUNIZATIONS_DATA_KEY,
      LAST_INVENTORY_QR_KEY,
      PATIENT_AGE_TYPE_KEY,
    ],
    (result) => {
      lastPatientData = result[LAST_PATIENT_DATA_KEY] ?? null;
      lastImmunizationsData = result[LAST_IMMUNIZATIONS_DATA_KEY] ?? null;
      inventoryItems = (result[LAST_INVENTORY_QR_KEY] as InventoryQrItem[] | undefined) ?? [];
      patientAgeType =
        result[PATIENT_AGE_TYPE_KEY] === "adult" ? "adult" : "minor";
      syncAgeTypeRadios();
      updatePatientCopySection();
      updateImmunizationsCopySection();
      updateInventorySection();
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
  allPageNotes =
    (changes[PAGE_NOTES_KEY].newValue as PageNote[] | undefined) ?? [];
  const pageScope = getPageScope(currentTabUrl);
  currentPageNotes = allPageNotes.filter(
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
  payload: Record<string, unknown> = {},
) {
  if (!button) return;

  button.setAttribute("disabled", "true");
  const originalText = button.textContent;
  button.textContent = runningLabel;
  setStatus("");

  const result = await sendToActiveTab({ action, ...payload });

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
    if (action === "fetchInventoryQr" && result.inventory) {
      inventoryItems = result.inventory;
      chrome.storage.local.set({ [LAST_INVENTORY_QR_KEY]: result.inventory });
      updateInventorySection();
      setStatus(
        result.inventory.length === 0
          ? "No received lots with doses found"
          : `Loaded ${result.inventory.length} scannable lots`,
        "success",
      );
      return;
    }
    setStatus(successLabel, "success");
  } else {
    setStatus(result.error ?? "Action failed", "error");
  }
}

document.querySelectorAll('input[name="patientAgeType"]').forEach((el) => {
  el.addEventListener("change", () => {
    patientAgeType = getSelectedAgeType();
    chrome.storage.local.set({ [PATIENT_AGE_TYPE_KEY]: patientAgeType });
  });
});

if (randomPatientDataBtn) {
  randomPatientDataBtn.addEventListener("click", () => {
    patientAgeType = getSelectedAgeType();
    runAction(
      randomPatientDataBtn,
      "randomPatientData",
      "Running…",
      patientAgeType === "adult"
        ? "Adult patient form filled"
        : "Minor patient form filled",
      { ageType: patientAgeType },
    );
  });
}

if (fetchInventoryBtn) {
  fetchInventoryBtn.addEventListener("click", () => {
    runAction(
      fetchInventoryBtn,
      "fetchInventoryQr",
      "Loading…",
      "Inventory loaded",
    );
  });
}

if (inventorySearch) {
  inventorySearch.addEventListener("input", () => updateInventorySection());
}

if (inventoryFundingFilter) {
  inventoryFundingFilter.addEventListener("change", () =>
    updateInventorySection(),
  );
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
    if (allPageNotes.length === 0) return;

    const report = formatAllNotesReport(allPageNotes);
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `qa-notes-all-${timestamp}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Report downloaded", "success");
  });
}

if (clearNotesBtn) {
  clearNotesBtn.addEventListener("click", async () => {
    const result = await sendToActiveTab({ action: "clearNotes" });
    if (result.success) {
      const clearedIds = new Set(currentPageNotes.map((note) => note.id));
      allPageNotes = allPageNotes.filter((note) => !clearedIds.has(note.id));
      currentPageNotes = [];
      updateNotesSection();
      setStatus("All notes cleared for this page", "success");
    } else {
      setStatus(result.error ?? "Could not clear notes", "error");
    }
  });
}
