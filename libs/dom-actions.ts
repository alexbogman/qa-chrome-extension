function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export function elementExists(selector: string): boolean {
  return !!document.querySelector(selector);
}

function optionLabel(opt: HTMLElement): string {
  return (
    opt.querySelector(".text")?.textContent?.trim() ||
    opt.textContent?.replace(/\s+/g, " ").trim() ||
    ""
  );
}

function findDropdownOption(
  root: ParentNode,
  optionText: string,
): HTMLElement | undefined {
  const candidates = [
    ...Array.from(root.querySelectorAll('div[role="option"]')),
    ...Array.from(root.querySelectorAll(".visible.menu .item")),
  ] as HTMLElement[];

  return candidates.find((opt) => optionLabel(opt) === optionText);
}

/** Select a Semantic UI dropdown option by its visible text (works with or without search). */
export async function selectOptionByText(
  selector: string,
  optionText: string,
) {
  try {
    const dropdown: HTMLElement | null = document.querySelector(selector);
    if (!dropdown) {
      console.warn(`Dropdown not found for selector: ${selector}`);
      return;
    }

    dropdown.click();
    await delay(150);

    let match: HTMLElement | undefined;
    for (let tries = 0; tries < 20; tries++) {
      match =
        findDropdownOption(dropdown, optionText) ||
        findDropdownOption(document, optionText);
      if (match) break;
      await delay(100);
    }

    if (match) {
      match.click();
      await delay(200);
    } else {
      console.warn(
        `Dropdown option not found for text "${optionText}" (selector: ${selector})`,
      );
    }
  } catch (err) {
    console.error(
      `Error selecting option "${optionText}" for selector: ${selector}`,
      err,
    );
  }
}

/** Set value on a React controlled input (native setter + input event). */
export async function setReactInputValue(
  selector: string,
  value: string,
) {
  try {
    const inputs = Array.from(
      document.querySelectorAll(selector),
    ) as HTMLInputElement[];
    if (inputs.length === 0) {
      console.warn(`Element not found for selector: ${selector}`);
      return false;
    }

    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    for (const el of inputs) {
      el.focus();
      if (nativeSetter) {
        nativeSetter.call(el, value);
      } else {
        el.value = value;
      }
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }

    await delay(100);
    return true;
  } catch (err) {
    console.error(`Error setting React input for selector: ${selector}`, err);
    return false;
  }
}

const VACCINE_PICKER_SEARCH_PLACEHOLDER = "Type at least 2 characters…";

function normalizeText(text: string | null | undefined): string {
  return text?.replace(/\s+/g, " ").trim() ?? "";
}

/**
 * shadcn VaccinePicker (bluefox packages/ui/VaccinePicker.tsx -> Combobox).
 * Trigger is a `button[role=combobox]` inside the picker; the menu is portaled
 * to <body> with its own search input. Options are `button[role=option]`
 * rendering the vaccine name in the first <span> and its types as badges.
 * Prefers the generic vaccine whose name and type both equal `value`
 * (same rule as the old Semantic UI picker), falling back to name match.
 */
export async function selectVaccinePickerValue(
  pickerSelector: string,
  value: string,
) {
  try {
    const picker = document.querySelector(pickerSelector);
    const trigger = picker?.querySelector<HTMLButtonElement>(
      'button[role="combobox"]',
    );
    if (!trigger) {
      console.warn(`Vaccine picker trigger not found: ${pickerSelector}`);
      return false;
    }

    const findMenu = () =>
      Array.from(
        document.querySelectorAll<HTMLElement>('[role="listbox"]'),
      ).find((menu) =>
        menu.querySelector(
          `input[placeholder="${VACCINE_PICKER_SEARCH_PLACEHOLDER}"]`,
        ),
      );

    if (!findMenu()) trigger.click();

    let menu: HTMLElement | undefined;
    for (let tries = 0; tries < 20 && !menu; tries++) {
      menu = findMenu();
      if (!menu) await delay(100);
    }
    if (!menu) {
      console.warn("Vaccine picker menu did not open");
      return false;
    }

    const search = menu.querySelector<HTMLInputElement>(
      `input[placeholder="${VACCINE_PICKER_SEARCH_PLACEHOLDER}"]`,
    )!;
    const nativeSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    search.focus();
    if (nativeSetter) nativeSetter.call(search, value);
    else search.value = value;
    search.dispatchEvent(new Event("input", { bubbles: true }));

    let match: HTMLButtonElement | undefined;
    for (let tries = 0; tries < 30 && !match; tries++) {
      const options = Array.from(
        (findMenu() ?? menu).querySelectorAll<HTMLButtonElement>(
          'button[role="option"]:not([disabled])',
        ),
      );
      // Option markup: button > svg + span > Stack > (row > span name),
      // span meta, Toolbar > Badge(type)... — read leaf texts in order.
      const leafTexts = (opt: HTMLElement) =>
        Array.from(opt.querySelectorAll<HTMLElement>("*"))
          .filter((el) => el.children.length === 0 && el.tagName !== "svg")
          .map((el) => normalizeText(el.textContent))
          .filter(Boolean);
      const parsed = options.map((opt) => {
        const [name, ...rest] = leafTexts(opt);
        return { opt, name, rest };
      });
      match =
        parsed.find((o) => o.name === value && o.rest.includes(value))?.opt ??
        parsed.find((o) => o.name === value)?.opt ??
        parsed.find((o) => o.rest.includes(value))?.opt;
      if (!match) await delay(200);
    }

    if (!match) {
      console.warn(`Vaccine picker option not found for value: ${value}`);
      trigger.click();
      return false;
    }

    match.click();
    await delay(200);
    return true;
  } catch (err) {
    console.error(`Error selecting vaccine "${value}"`, err);
    return false;
  }
}

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
