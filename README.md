# QA Tools – Chrome Extension

Extensión de Chrome para el equipo de QA de Canid. Funciona en **Practice Portal** e **Internal Tools** y automatiza tareas repetitivas del día a día: resaltar selectores de prueba, rellenar formularios y cargar inmunizaciones históricas.

## Requisitos

- [Node.js](https://nodejs.org/) ≥ 18
- [pnpm](https://pnpm.io/)
- Google Chrome (o Chromium)

## Instalación y carga en Chrome

### 1. Clonar e instalar dependencias

```bash
cd qa-chrome
pnpm install
```

### 2. Generar el build

```bash
pnpm run build
```

Esto crea la carpeta `dist/` con la extensión lista para cargar.

### 3. Cargar la extensión en Chrome

1. Abrí `chrome://extensions/`
2. Activá **Developer mode** (esquina superior derecha)
3. Clic en **Load unpacked**
4. Seleccioná la carpeta **`dist`** del proyecto (no la raíz del repo)

La extensión aparece como **QA Tools** en la barra de Chrome.

### 4. Actualizar después de cambios

Cada vez que modifiques código:

```bash
pnpm run build
```

Luego en `chrome://extensions/` hacé clic en el ícono de **recargar** de la extensión.

### Desarrollo con hot reload

```bash
pnpm run dev
```

Vite recompila al guardar cambios. Igual tenés que recargar la extensión en Chrome cuando el build cambie.

---

## Utilidades

Todas las acciones se controlan desde el **popup** (clic en el ícono de la extensión). La extensión solo actúa en las URLs soportadas (ver abajo).

### Environment alert

Al entrar a Practice Portal o Internal Tools, aparece un cartel fijo en la parte inferior de la página:

| Entorno | Mensaje |
|---|---|
| Local | Verde — entorno local |
| Staging | Naranja — entorno staging |
| Production | Rojo — entorno producción |

Clic en el cartel para cerrarlo.

### Highlight automation IDs

Toggle en el popup que resalta elementos con atributo `data-automation-id`:

- Borde rojo punteado alrededor del elemento
- Label con el valor del ID al pasar el mouse
- Se actualiza automáticamente cuando el DOM cambia (SPAs)
- El estado (ON/OFF) se persiste entre sesiones

Útil para escribir selectores en Playwright o depurar automation IDs.

### Fill patient form

Rellena el formulario de alta/edición de paciente con datos de prueba aleatorios:

- MRN con prefijo `QAT`
- Nombre, apellido, email, teléfono, dirección, ciudad, zip y fecha de nacimiento (0–18 años)

Debajo del botón **Run** aparece una sección con el último paciente generado y un botón **Copy JSON** para copiar los datos al portapapeles. Los datos se guardan en el storage de la extensión y persisten al cerrar el popup.

**Requisito:** estar en la pantalla del formulario de paciente en Practice Portal.

### Historic immunizations

Inserta inmunizaciones históricas según la edad del paciente y un calendario de vacunas (CDC). Por cada dosis que corresponde por edad, completa el picker de vacuna, fechas de aplicación y VIS, y guarda el registro.

Debajo del botón **Run** hay una sección similar con preview, **Copy JSON** y persistencia del último resultado.

**Requisito:** estar en el perfil de un paciente existente (lee la fecha de nacimiento del header del perfil).

Ejemplo de JSON copiado:

```json
{
  "patientBirthDate": "03/15/2018",
  "currentAgeInMonths": 97,
  "doses": [
    {
      "vaccineType": "MMR",
      "doseKey": "dose_1",
      "dateGiven": "03/15/2019",
      "visDate": "03/15/2019"
    }
  ]
}
```

---

## URLs soportadas

La extensión solo se inyecta en:

| App | URLs |
|---|---|
| Practice Portal | `http://localhost:3000/*`, `https://app-staging.canid.io/*`, `https://app.canid.io/*` |
| Internal Tools | `http://localhost:3001/*`, `http://localhost:4000/*`, `http://localhost:4001/*`, `https://internal-tools-staging.canid.io/*`, `https://internal-tools.canid.io/*` |

Si el popup muestra *"Extension not available on this page"*, la pestaña activa no está en una URL soportada.

---

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `pnpm install` | Instala dependencias |
| `pnpm run build` | Compila TypeScript y genera `dist/` |
| `pnpm run dev` | Modo desarrollo con Vite |
| `pnpm run preview` | Preview del build de Vite |

---

