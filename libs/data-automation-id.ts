export default class DataAutomationId {
  processedElements = new WeakSet<Element>();

  highlight(isHighlightingEnabled: boolean) {
    if (!isHighlightingEnabled) return;

    const elements = document.querySelectorAll("[data-automation-id]");
    elements.forEach((element) => {
      if (this.processedElements.has(element)) return;

      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      const positionValue = computedStyle.position;

      if (
        positionValue !== "absolute" &&
        positionValue !== "fixed" &&
        positionValue !== "relative"
      ) {
        htmlElement.style.position = "relative";
      }

      const overlay = document.createElement("div");
      overlay.classList.add("qa-popup-container");
      Object.assign(overlay.style, {
        position: "absolute",
        pointerEvents: "none",
        width: "98%",
        height: "90%",
        inset: "0",
        margin: "auto",
        zIndex: "1000",
        border: "2px dashed hsl(0 72% 51%)",
        borderRadius: "0.25rem",
      });

      const label = document.createElement("div");
      label.textContent = element.getAttribute("data-automation-id");
      label.classList.add("qa-popup");
      Object.assign(label.style, {
        position: "absolute",
        display: "none",
        backgroundColor: "hsl(0 72% 51%)",
        color: "#ffffff",
        padding: "0.125rem 0.375rem",
        borderRadius: "0.25rem",
        fontSize: "0.625rem",
        fontWeight: "500",
        boxShadow: "0 0.125rem 0.25rem rgba(0, 0, 0, 0.2)",
        top: "0.25rem",
        right: "0.1875rem",
        pointerEvents: "none",
        whiteSpace: "nowrap",
        fontFamily: "system-ui, -apple-system, sans-serif",
      });

      overlay.appendChild(label);
      htmlElement.appendChild(overlay);

      htmlElement.addEventListener("mouseover", () => {
        label.style.display = "block";
      });

      htmlElement.addEventListener("mouseout", () => {
        label.style.display = "none";
      });

      this.processedElements.add(element);
    });
  }

  removeHighlights() {
    document
      .querySelectorAll(".qa-popup-container")
      .forEach((popup) => popup.remove());
    this.processedElements = new WeakSet();
  }
}
