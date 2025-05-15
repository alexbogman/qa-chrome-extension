import DataAutomationId from "./contents/data-automation-id";
import { faker } from "@faker-js/faker";
import { format } from "date-fns";

let isHighlightingEnabled = false;
const dataAutomationId = new DataAutomationId();

chrome.runtime.onMessage.addListener(async (message, _sender, sendResponse) => {
  if (message.action === "toggleHighlight") {
    isHighlightingEnabled = message.enabled;
    if (isHighlightingEnabled) {
      dataAutomationId.highlight(isHighlightingEnabled);
    } else {
      dataAutomationId.removeHighlights();
    }
    sendResponse({ success: true });
  }

  if (message.action === "randomPatientData") {
    // Genera datos aleatorios de paciente
    const data = {
      mrn: `QAT${faker.number
        .bigInt({ min: 1000000000, max: 9999999999 })
        .toString()}`,
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      city: faker.location.city(),
      state: "New York",
      zip: faker.location.zipCode(),
      dob: format(
        faker.date.birthdate({ min: 18, max: 50, mode: "age" }),
        "yyyy/MM/dd"
      ),
    };

    const setValue = async (selector: string, value: string) => {
      try {
        const el: HTMLInputElement | null = document.querySelector(selector);
        if (el) {
          el.focus();
          el.value = value;
          el.dispatchEvent(new Event("input", { bubbles: true }));
          el.dispatchEvent(new Event("change", { bubbles: true }));
          el.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
          await new Promise((res) => setTimeout(res, 100));
        } else {
          console.warn(`Element not found for selector: ${selector}`);
        }
      } catch (err) {
        console.error(`Error setting value for selector: ${selector}`, err);
      }
    };

    const simulateTyping = async (selector: string, value: string) => {
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

            el.dispatchEvent(new KeyboardEvent("keyup", { key: char, bubbles: true, cancelable: true }));

            // 3d. Pequeño delay para simular tipeo real
            await new Promise((res) =>
              setTimeout(res, 20)
            );
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
    };

    await setValue(
      '[data-automation-id="patient-basic-mrn"] > input',
      data.mrn
    );
    await setValue(
      '[data-automation-id="patient-basic-first-name"] > input',
      data.firstName
    );
    await setValue(
      '[data-automation-id="patient-basic-last-name"] > input',
      data.lastName
    );
    await simulateTyping(
      '[data-automation-id="patient-basic-date-of-birth"] > input',
      data.dob
    );
    await setValue(
      '[data-automation-id="patient-basic-email"] > input',
      data.email
    );
    await setValue('[placeholder="Phone number"]', data.phone);
    await setValue(
      '[data-automation-id="patient-basic-street"] > input',
      data.address
    );
    await setValue(
      '[data-automation-id="patient-basic-city"] > input',
      data.city
    );
    // await setValue('[data-automation-id="patient-basic-state"] > input', data.state);
    await setValue(
      '[data-automation-id="patient-basic-zip"] > input',
      data.zip
    );

    sendResponse({ success: true });
  }
});

// Observa cambios en el DOM con debounce
let observerTimeout: any;
const observer = new MutationObserver(() => {
  if (isHighlightingEnabled) {
    clearTimeout(observerTimeout);
    observerTimeout = setTimeout(() => {
      dataAutomationId.highlight(isHighlightingEnabled); // Refresca los resaltados si está activado
    }, 200); // Debounce de 200ms
  }
});

// Configura el observador para observar cambios relevantes en el DOM
observer.observe(document.body, { childList: true, subtree: true });
