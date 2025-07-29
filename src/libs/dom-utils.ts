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

    // Escribe el valor completo, pero el dropdown solo buscará a partir de 3 letras
    for (let i = 0; i < value.length; i++) {
      const char = value[i];

      input.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: char, // La tecla presionada
          code: `Key${char.toUpperCase()}`, // Opcional, más específico si es una letra
          bubbles: true,
          cancelable: true,
        })
      );

      input.value += char;

      input.dispatchEvent(
        new InputEvent("input", {
          bubbles: true,
          data: char, // El caracter que se insertó
          inputType: "insertText", // Tipo de input
        })
      );

      input.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: char,
          bubbles: true,
          cancelable: true,
        })
      );

      // 3d. Pequeño delay para simular tipeo real
      await new Promise((res) => setTimeout(res, 100));
    }

    // Espera a que aparezcan las opciones y selecciona la correcta
    let match: HTMLElement | undefined;
    for (let tries = 0; tries < 20; tries++) {
      const options = Array.from(
        document.querySelectorAll('div[role="option"].item')
      );
      match = options.find((opt) => {
        const mainText = opt
          .querySelector(".content")
          ?.childNodes[0]?.textContent?.trim();
        const labelType = opt
          .querySelector(".content")
          ?.childNodes[1]?.textContent?.trim();
        return mainText === value && labelType === value;
      }) as HTMLElement;
      if (match) break;
      await new Promise((res) => setTimeout(res, 200));
    }

    if (match) {
      if (
        typeof match === "object" &&
        Array.isArray(match) &&
        match.length > 1
      ) {
        match[0].click();
      } else if (typeof match === "object" && match instanceof HTMLElement) {
        match.click();
      }
      await new Promise((res) => setTimeout(res, 200)); // Espera a que se seleccione antes de avanzar
    } else {
      console.warn(`Dropdown option not found for value: ${value}`);
    }
  } catch (err) {
    console.error(
      `Error selecting dropdown value for selector: ${selector}`,
      err
    );
  }
}

export async function setValue(
  selector: string,
  value: string,
  pulseEnter: boolean = false
) {
  try {
    const el: HTMLInputElement | null = document.querySelector(selector);
    if (el) {
      el.focus();
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
      if (pulseEnter) {
        //console.log(`Pulsing Enter for selector: ${selector}`);
        el.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true,
          })
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
      el.focus(); // 1. Asegurar el foco explícitamente. el.click() también lo haría.
      el.value = ""; // 2. Limpiar el campo primero, como lo haces.

      // 3. Simular el tipeo de cada caracter
      for (let i = 0; i < value.length; i++) {
        const char = value[i];

        el.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: char, // La tecla presionada
            code: `Key${char.toUpperCase()}`, // Opcional, más específico si es una letra
            bubbles: true,
            cancelable: true,
          })
        );

        el.value += char;

        el.dispatchEvent(
          new InputEvent("input", {
            bubbles: true,
            data: char, // El caracter que se insertó
            inputType: "insertText", // Tipo de input
          })
        );

        el.dispatchEvent(
          new KeyboardEvent("keyup", {
            key: char,
            bubbles: true,
            cancelable: true,
          })
        );

        // 3d. Pequeño delay para simular tipeo real
        await new Promise((res) => setTimeout(res, 20));
      }

      el.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Enter",
          code: "Enter",
          keyCode: 13, // Para compatibilidad
          which: 13, // Para compatibilidad
          bubbles: true,
          cancelable: true, // Importante si algún manejador quiere prevenir la acción por defecto
        })
      );

      // (Opcional) Disparar 'keyup' para "Enter".
      // el.dispatchEvent(new KeyboardEvent("keyup", { key: "Enter", code: "Enter", bubbles: true, cancelable: true }));

      // 5. Disparar 'change' (CRUCIAL, estaba comentado, pero tus logs lo muestran después de Enter)
      el.dispatchEvent(new Event("change", { bubbles: true }));

      // 6. Disparar 'blur' (para simular la pérdida de foco, también estaba comentado y tus logs lo muestran al final)
      // Puedes usar new FocusEvent o directamente el.blur()
      // el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
      el.blur(); // el.blur() es más directo para simplemente quitar el foco.
    } else {
      console.warn(
        `[simulateTypingAndEnter] Elemento no encontrado para selector: ${selector}`
      );
    }
  } catch (error) {
    console.error(
      `[simulateTypingAndEnter] Error simulando tipeo para selector: ${selector}`,
      error
    );
  }
}
