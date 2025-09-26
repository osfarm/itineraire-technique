# Copilot Instructions for TIKA Itineraire Technique

## Project Overview
This project visualizes agricultural technical itineraries (sequences of interventions on a plot) for analysis and documentation. It provides both a visualizer and an editor, designed for easy integration into web pages and use on Triple Performance.

## Architecture & Key Components
- **HTML files**: Main entry points (`visualisateur.html`, `editor.html`, etc.)
- **JS directory**: Core logic for rendering charts, editing, exporting, and managing interventions. Key files:
  - `chart-render.js`: Main chart rendering logic (frise and rotation views)
  - `editor-attributes.js`, `editor-crops.js`, `editor-export.js`, `editor-interventions.js`, `editor-wiki-editor.js`: Editor and data manipulation modules
- **CSS/SCSS**: Styling for both editor and rendering views
- **test/**: Contains example JSON data and templates for validation and development

## Data Flow & Integration
- Input data is provided as JSON, following the format in `test/test.json` and `test.after.json`
- Rendering is performed by instantiating `RotationRenderer` with a target div and JSON data
- External dependencies: Apache Echarts, JQuery, Bootstrap, Underscore (included via CDN in HTML)

## Developer Workflows
- **Build**: No complex build system; use npm to install and copy files as needed
  - Example: `npm i @osfarm/itineraire-technique`
  - Copy JS/CSS from `node_modules` to local `js/` and `css/` folders
- **Testing**: Use the sample JSON files in `test/` for manual validation; no automated test runner
- **Debugging**: Open HTML files in browser, use browser dev tools; inspect JSON format and rendering

## Project-Specific Conventions
- All rendering logic expects a specific JSON schema (see `test/test.json`)
- Editor modules are split by concern (attributes, crops, interventions, etc.)
- No framework; vanilla JS modules and direct DOM manipulation
- CSS/SCSS files are mapped 1:1 to editor and rendering views

## Integration Points
- Designed for easy embedding in any HTML page
- Used on Triple Performance and Google Spreadsheet add-on
- Can be extended by adding new JS modules or updating JSON schema

## Example Usage
```js
let renderer = new RotationRenderer('uneDIVID', jsonData);
renderer.render();
```

## Key Files & Directories
- `js/chart-render.js`: Main chart logic
- `test/test.json`: Example data format
- `editor.html`, `visualisateur.html`: Entry points
- `css/styles-rendering.css`, `css/styles-editor.css`: Styling

## Tips for AI Agents
- Always validate JSON input against `test/test.json`
- When adding features, follow the modular JS file structure
- Reference CDN links for dependencies in HTML
- Prefer direct DOM manipulation and vanilla JS patterns

---
For questions about unclear conventions or missing documentation, ask the user for clarification or examples from their workflow.
