const ADD_QA_NOTE_MENU_ID = "add-qa-note";

const CANID_URL_PATTERNS = [
  "http://localhost:3000/*",
  "https://app-staging.canid.io/*",
  "https://app.canid.io/*",
  "http://localhost:3001/*",
  "http://localhost:4000/*",
  "http://localhost:4001/*",
  "https://internal-tools-staging.canid.io/*",
  "https://internal-tools.canid.io/*",
];

function registerContextMenus(): void {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: ADD_QA_NOTE_MENU_ID,
      title: "Add QA Note",
      contexts: ["all"],
      documentUrlPatterns: CANID_URL_PATTERNS,
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  registerContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  registerContextMenus();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== ADD_QA_NOTE_MENU_ID || typeof tab?.id !== "number") {
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: "addNoteFromContextMenu" });
});
