export async function selectDropdownValue(selector: string, value: string) {
  try {
    const input: HTMLInputElement | null = document.querySelector(selector);
    if (!input) {
      console.warn(`Dropdown input not found for selector: ${selector}`);
      return;
    }
    input.focus();
    input.click();
    input.value = "";

    for (let i = 0; i < value.length; i++) {
      const char = value[i];

      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: char,
          code: `Key${char.toUpperCase()}`,
          bubbles: true,
          cancelable: true,
        }),
      );

      input.value += char;

      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: char,
          inputType: "insertText",
        }),
      );

      input.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: char,
          bubbles: true,
          cancelable: true,
        }),
      );

      await new Promise((res) => setTimeout(res, 100));
    }

    let match: HTMLElement | undefined;
    for (let tries = 0; tries < 20; tries++) {
      const options = Array.from(
        document.querySelectorAll('div[role="option"].item'),
      );
      match = options.find((opt) => {
        const mainText = opt
          .querySelector(".content")
          ?.childNodes[0]?.textContent?.trim();
        const labelType = opt
          .querySelector(".content")
          ?.childNodes[1]?.textContent?.trim();
        return mainText === value && labelType === value;
      }) as HTMLElement | undefined;
      if (match) break;
      await new Promise((res) => setTimeout(res, 200));
    }

    if (match) {
      match.click();
      await new Promise((res) => setTimeout(res, 200));
    } else {
      console.warn(`Dropdown option not found for value: ${value}`);
    }
  } catch (err) {
    console.error(
      `Error selecting dropdown value for selector: ${selector}`,
      err,
    );
  }
}

export async function setValue(
  selector: string,
  value: string,
  pulseEnter: boolean = false,
) {
  try {
    const el: HTMLInputElement | null = document.querySelector(selector);
    if (el) {
      el.focus();
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      if (pulseEnter) {
        el.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          }),
        );
      }
      el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      await new Promise((res) => setTimeout(res, 100));
    } else {
      console.warn(`Element not found for selector: ${selector}`);
    }
  } catch (err) {
    console.error(`Error setting value for selector: ${selector}`, err);
  }
}

export async function simulateTyping(selector: string, value: string) {
  try {
    const el: HTMLInputElement | null = document.querySelector(selector);
    if (el) {
      el.focus();
      el.value = "";

      for (let i = 0; i < value.length; i++) {
        const char = value[i];

        el.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: char,
            code: `Key${char.toUpperCase()}`,
            bubbles: true,
            cancelable: true,
          }),
        );

        el.value += char;

        el.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            data: char,
            inputType: "insertText",
          }),
        );

        el.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: char,
            bubbles: true,
            cancelable: true,
          }),
        );

        await new Promise((res) => setTimeout(res, 20));
      }

      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13,
          which: 13,
          bubbles: true,
          cancelable: true,
        }),
      );

      el.dispatchEvent(new Event("change", { bubbles: true }));
      el.blur();
    } else {
      console.warn(`Element not found for selector: ${selector}`);
    }
  } catch (error) {
    console.error(`Error simulating typing for selector: ${selector}`, error);
  }
}

export function onReady(callback: () => void) {
  if (
    document.readyState === "complete" ||
    document.readyState === "interactive"
  ) {
    callback();
  } else {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  }
}
