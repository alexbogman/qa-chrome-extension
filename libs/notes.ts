import { PAGE_NOTES_KEY } from "./constants/storage.ts";

export interface PageNote {
  id: string;
  url: string;
  selector: string;
  elementLabel: string;
  note: string;
  createdAt: string;
  rect: { top: number; left: number; width: number; height: number };
}

const QA_NOTES_STYLE_ID = "qa-notes-style";

export class NoteManager {
  private currentUrl = window.location.href;
  private pageNotes: PageNote[] = [];
  private activeOverlay: HTMLElement | null = null;

  constructor() {
    this.injectStyles();
  }

  setContextMenuTarget(element: HTMLElement | null): void {
    this.lastContextMenuTarget = element;
  }

  private lastContextMenuTarget: HTMLElement | null = null;

  async renderAll(): Promise<void> {
    this.currentUrl = window.location.href;
    this.pageNotes = await this.loadNotesForCurrentUrl();
    this.removeAllCircles();
    this.pageNotes.forEach((note, index) => {
      this.addCircle(note, index + 1);
    });
  }

  openNoteForContextMenu(): boolean {
    if (!this.lastContextMenuTarget || this.isQaNoteElement(this.lastContextMenuTarget)) {
      return false;
    }

    const rect = this.lastContextMenuTarget.getBoundingClientRect();
    this.showInputOverlay(this.lastContextMenuTarget, rect);
    return true;
  }

  async deleteNote(id: string): Promise<void> {
    const allNotes = await this.loadAllNotes();
    const updatedNotes = allNotes.filter((note) => note.id !== id);
    await this.saveAllNotes(updatedNotes);
    this.pageNotes = updatedNotes.filter((note) => note.url === this.currentUrl);
    this.removeCircle(id);
  }

  async clearNotesForCurrentUrl(): Promise<void> {
    const allNotes = await this.loadAllNotes();
    const updatedNotes = allNotes.filter((note) => note.url !== this.currentUrl);
    await this.saveAllNotes(updatedNotes);
    this.pageNotes = [];
    this.removeAllCircles();
  }

  private showInputOverlay(element: HTMLElement, rect: DOMRect): void {
    this.closeOverlay();

    const overlay = document.createElement("div");
    overlay.className = "qa-note-overlay";
    overlay.setAttribute("data-qa-note-ui", "true");

    const selector = this.getSelector(element);
    const elementLabel = this.getElementLabel(element);

    const header = document.createElement("p");
    header.className = "qa-note-overlay__header";
    header.textContent = "Add note";

    const selectorEl = document.createElement("code");
    selectorEl.className = "qa-note-overlay__selector";
    selectorEl.textContent = selector;

    const textarea = document.createElement("textarea");
    textarea.className = "qa-note-overlay__textarea";
    textarea.placeholder = "Describe what you tested or observed…";
    textarea.rows = 3;

    const actions = document.createElement("div");
    actions.className = "qa-note-overlay__actions";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "qa-note-overlay__btn qa-note-overlay__btn--ghost";
    cancelBtn.textContent = "Cancel";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "qa-note-overlay__btn qa-note-overlay__btn--primary";
    saveBtn.textContent = "Save";

    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeOverlay();
    });

    saveBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const noteText = textarea.value.trim();
      if (!noteText) {
        textarea.focus();
        return;
      }

      const note: PageNote = {
        id: crypto.randomUUID(),
        url: this.currentUrl,
        selector,
        elementLabel,
        note: noteText,
        createdAt: new Date().toISOString(),
        rect: {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
        },
      };

      await this.saveNote(note);
      this.addCircle(note, this.pageNotes.length);
      this.closeOverlay();
    });

    overlay.addEventListener("click", (e) => e.stopPropagation());

    actions.append(cancelBtn, saveBtn);
    overlay.append(header, selectorEl, textarea, actions);
    document.body.appendChild(overlay);

    const overlayRect = overlay.getBoundingClientRect();
    const top = Math.min(rect.bottom + 8, window.innerHeight - overlayRect.height - 8);
    const left = Math.min(rect.left, window.innerWidth - overlayRect.width - 8);
    overlay.style.top = `${Math.max(8, top)}px`;
    overlay.style.left = `${Math.max(8, left)}px`;

    this.activeOverlay = overlay;
    textarea.focus();
  }

  private closeOverlay(): void {
    if (this.activeOverlay) {
      this.activeOverlay.remove();
      this.activeOverlay = null;
    }
  }

  private addCircle(note: PageNote, index: number): void {
    if (document.querySelector(`[data-qa-note-id="${note.id}"]`)) return;

    const circle = document.createElement("div");
    circle.className = "qa-note-circle";
    circle.setAttribute("data-qa-note-id", note.id);
    circle.setAttribute("data-qa-note-ui", "true");
    circle.textContent = String(index);
    circle.title = note.note;

    const { top, left, width, height } = note.rect;
    const circleTop = top + height / 2 - 12;
    const circleLeft = left + width / 2 - 12;
    circle.style.top = `${circleTop}px`;
    circle.style.left = `${circleLeft}px`;

    const tooltip = document.createElement("div");
    tooltip.className = "qa-note-tooltip";
    tooltip.setAttribute("data-qa-note-ui", "true");

    const noteText = document.createElement("p");
    noteText.className = "qa-note-tooltip__text";
    noteText.textContent = note.note;

    const selectorText = document.createElement("code");
    selectorText.className = "qa-note-tooltip__selector";
    selectorText.textContent = note.selector;

    const timeText = document.createElement("span");
    timeText.className = "qa-note-tooltip__time";
    timeText.textContent = this.formatTimestamp(note.createdAt);

    tooltip.append(noteText, selectorText, timeText);
    circle.appendChild(tooltip);

    circle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.showEditMenu(note, circle);
    });

    document.body.appendChild(circle);
  }

  private showEditMenu(note: PageNote, circle: HTMLElement): void {
    this.closeOverlay();

    const menu = document.createElement("div");
    menu.className = "qa-note-overlay qa-note-overlay--menu";
    menu.setAttribute("data-qa-note-ui", "true");

    const header = document.createElement("p");
    header.className = "qa-note-overlay__header";
    header.textContent = `Note #${circle.textContent}`;

    const notePreview = document.createElement("p");
    notePreview.className = "qa-note-overlay__preview";
    notePreview.textContent = note.note;

    const actions = document.createElement("div");
    actions.className = "qa-note-overlay__actions";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "qa-note-overlay__btn qa-note-overlay__btn--ghost";
    closeBtn.textContent = "Close";

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "qa-note-overlay__btn qa-note-overlay__btn--destructive";
    deleteBtn.textContent = "Delete";

    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.closeOverlay();
    });

    deleteBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this.deleteNote(note.id);
      this.closeOverlay();
    });

    menu.addEventListener("click", (e) => e.stopPropagation());
    actions.append(closeBtn, deleteBtn);
    menu.append(header, notePreview, actions);
    document.body.appendChild(menu);

    const circleRect = circle.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const top = Math.min(circleRect.bottom + 8, window.innerHeight - menuRect.height - 8);
    const left = Math.min(circleRect.left, window.innerWidth - menuRect.width - 8);
    menu.style.top = `${Math.max(8, top)}px`;
    menu.style.left = `${Math.max(8, left)}px`;

    this.activeOverlay = menu;
  }

  private removeCircle(id: string): void {
    document.querySelector(`[data-qa-note-id="${id}"]`)?.remove();
    this.renumberCircles();
  }

  private removeAllCircles(): void {
    document.querySelectorAll("[data-qa-note-id]").forEach((el) => el.remove());
  }

  private renumberCircles(): void {
    const circles = Array.from(document.querySelectorAll<HTMLElement>("[data-qa-note-id]"));
    circles.forEach((circle, index) => {
      circle.textContent = String(index + 1);
    });
  }

  private async saveNote(note: PageNote): Promise<void> {
    const allNotes = await this.loadAllNotes();
    allNotes.push(note);
    await this.saveAllNotes(allNotes);
    this.pageNotes = allNotes.filter((n) => n.url === this.currentUrl);
  }

  private loadAllNotes(): Promise<PageNote[]> {
    return new Promise((resolve) => {
      chrome.storage.local.get(PAGE_NOTES_KEY, (result) => {
        resolve((result[PAGE_NOTES_KEY] as PageNote[] | undefined) ?? []);
      });
    });
  }

  private async loadNotesForCurrentUrl(): Promise<PageNote[]> {
    const allNotes = await this.loadAllNotes();
    return allNotes.filter((note) => note.url === this.currentUrl);
  }

  private saveAllNotes(notes: PageNote[]): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [PAGE_NOTES_KEY]: notes }, () => resolve());
    });
  }

  private getSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${CSS.escape(element.id)}`;
    }

    const automationId = element.getAttribute("data-automation-id");
    if (automationId) {
      return `[data-automation-id="${automationId}"]`;
    }

    const path: string[] = [];
    let current: HTMLElement | null = element;

    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();

      if (current.id) {
        selector = `#${CSS.escape(current.id)}`;
        path.unshift(selector);
        break;
      }

      const parent: HTMLElement | null = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (child): child is HTMLElement =>
            child instanceof HTMLElement && child.tagName === current!.tagName,
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }

      path.unshift(selector);
      current = parent;
    }

    return path.join(" > ");
  }

  private getElementLabel(element: HTMLElement): string {
    const text = element.textContent?.trim() ?? "";
    if (text) {
      return text.slice(0, 60);
    }
    return element.tagName.toLowerCase();
  }

  private isQaNoteElement(element: HTMLElement): boolean {
    return Boolean(element.closest("[data-qa-note-ui]"));
  }

  private formatTimestamp(iso: string): string {
    const date = new Date(iso);
    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  private injectStyles(): void {
    if (document.getElementById(QA_NOTES_STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = QA_NOTES_STYLE_ID;
    style.textContent = `
      .qa-note-circle {
        position: fixed;
        width: 1.5rem;
        height: 1.5rem;
        border-radius: 50%;
        background: hsl(38 92% 50%);
        color: hsl(0 0% 0%);
        font-size: 0.75rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483645;
        cursor: pointer;
        box-shadow: 0 0.125rem 0.5rem hsl(0 0% 0% / 0.35);
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        user-select: none;
      }

      .qa-note-circle:hover {
        background: hsl(38 92% 45%);
      }

      .qa-note-tooltip {
        display: none;
        position: absolute;
        bottom: calc(100% + 0.5rem);
        left: 50%;
        transform: translateX(-50%);
        min-width: 12rem;
        max-width: 18rem;
        padding: 0.625rem 0.75rem;
        background: hsl(240 10% 3.9%);
        color: hsl(0 0% 98%);
        border-radius: 0.375rem;
        box-shadow: 0 0.25rem 0.75rem hsl(0 0% 0% / 0.3);
        pointer-events: none;
        text-align: left;
      }

      .qa-note-circle:hover .qa-note-tooltip {
        display: block;
      }

      .qa-note-tooltip__text {
        margin: 0 0 0.375rem;
        font-size: 0.75rem;
        line-height: 1.4;
        font-weight: 500;
      }

      .qa-note-tooltip__selector {
        display: block;
        margin: 0 0 0.25rem;
        padding: 0.125rem 0.375rem;
        background: hsl(240 5% 15%);
        border-radius: 0.25rem;
        font-size: 0.625rem;
        font-family: ui-monospace, monospace;
        word-break: break-all;
      }

      .qa-note-tooltip__time {
        font-size: 0.625rem;
        color: hsl(240 5% 65%);
      }

      .qa-note-overlay {
        position: fixed;
        z-index: 2147483647;
        min-width: 18rem;
        max-width: 22rem;
        padding: 0.75rem;
        background: hsl(0 0% 100%);
        border: 1px solid hsl(240 5.9% 90%);
        border-radius: 0.5rem;
        box-shadow: 0 0.25rem 1rem hsl(0 0% 0% / 0.15);
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      }

      .qa-note-overlay__header {
        margin: 0 0 0.5rem;
        font-size: 0.8125rem;
        font-weight: 600;
        color: hsl(240 10% 3.9%);
      }

      .qa-note-overlay__selector {
        display: block;
        margin: 0 0 0.5rem;
        padding: 0.25rem 0.5rem;
        background: hsl(240 4.8% 95.9%);
        border-radius: 0.25rem;
        font-size: 0.6875rem;
        font-family: ui-monospace, monospace;
        word-break: break-all;
        color: hsl(240 3.8% 46.1%);
      }

      .qa-note-overlay__preview {
        margin: 0 0 0.75rem;
        font-size: 0.8125rem;
        line-height: 1.4;
        color: hsl(240 10% 3.9%);
      }

      .qa-note-overlay__textarea {
        width: 100%;
        margin-bottom: 0.625rem;
        padding: 0.5rem 0.625rem;
        border: 1px solid hsl(240 5.9% 90%);
        border-radius: 0.375rem;
        font-size: 0.8125rem;
        font-family: inherit;
        line-height: 1.4;
        resize: vertical;
        outline: none;
      }

      .qa-note-overlay__textarea:focus {
        border-color: hsl(240 5.9% 10%);
        box-shadow: 0 0 0 0.125rem hsl(240 5.9% 10% / 0.1);
      }

      .qa-note-overlay__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
      }

      .qa-note-overlay__btn {
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid transparent;
        font-family: inherit;
      }

      .qa-note-overlay__btn--ghost {
        background: transparent;
        border-color: hsl(240 5.9% 90%);
        color: hsl(240 10% 3.9%);
      }

      .qa-note-overlay__btn--ghost:hover {
        background: hsl(240 4.8% 95.9%);
      }

      .qa-note-overlay__btn--primary {
        background: hsl(240 5.9% 10%);
        color: hsl(0 0% 98%);
      }

      .qa-note-overlay__btn--primary:hover {
        background: hsl(240 5.9% 20%);
      }

      .qa-note-overlay__btn--destructive {
        background: hsl(0 72% 51%);
        color: hsl(0 0% 98%);
      }

      .qa-note-overlay__btn--destructive:hover {
        background: hsl(0 72% 45%);
      }
    `;
    document.head.appendChild(style);
  }
}
