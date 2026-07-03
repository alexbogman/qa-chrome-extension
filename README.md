# QA Tools – Chrome Extension

Chrome extension for QA engineers working on Canid's Practice Portal and Internal Tools.

## Features

- **Highlight automation IDs** – Visual overlay on elements with `data-automation-id`
- **Fill patient form** – Populate the patient form with random test data
- **Add historic immunizations** – Insert immunization history based on patient age and CDC schedule
- **Environment alert** – Banner on page load indicating local, staging, or production

## Setup

```bash
pnpm install
pnpm run build
```

Load the `dist` folder in `chrome://extensions/` via **Load unpacked** (Developer mode required).

For development with hot reload:

```bash
pnpm run dev
```

## Supported URLs

- Practice Portal: `localhost:3000`, staging, production
- Internal Tools: `localhost:3001`, `localhost:4000`, `localhost:4001`, staging, production

## Roadmap

- Athena: count immunizations
- Registries: count immunizations
