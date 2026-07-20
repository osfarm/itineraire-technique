# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TIKA (`@osfarm/itineraire-technique`) is a vanilla-JS library + demo site that visualizes agricultural
"itinéraires techniques" (technical itineraries): the sequence of interventions (tillage, sowing,
spraying, harvest, etc.) applied to a plot across one or more crops/steps. It renders as an interactive
Apache ECharts timeline ("frise") or a circular rotation diagram, and ships with a standalone editor for
building the underlying JSON by hand.

No framework, no bundler, no transpilation: everything is plain JS files loaded via `<script>` tags and
plain SCSS compiled to CSS. There is no automated test suite and no linter configured.

## Commands

```bash
npm install          # installs the one devDependency (sass)
npm run dev:scss      # compile both SCSS files once, uncompressed (use while developing styles)
npm run watch:scss    # same as above but watches for changes (this is what `npm start` runs)
npm run build:scss    # compressed production build of both stylesheets (this is what `npm run build` runs)
```

There is no test runner. "Testing" means manually loading one of the JSON files under `test/` (e.g.
`test/test.json`, `test/test.after.json`, `test/itk-templates/export-itk-1.json`) into the editor or
visualizer in a browser and checking the rendered output. Use the `/run` skill to actually launch and
click through `editor.html` / `visualisateur.html` when validating changes — type-checking doesn't apply
here since this is untyped JS, so the only way to confirm a rendering/editor change works is to open it.

**Publishing is automatic**: `.github/workflows/publish.yml` runs `npm publish` on every push to `main`.
Bump the `version` in `package.json` as part of any PR that should ship a new npm release; pushing to
`main` without bumping it will make the publish step fail (npm rejects re-publishing the same version).

## Entry points

- `editor.html` — the itinerary builder UI (forms, drag-and-drop step reordering, import/export).
- `visualisateur.html` — minimal demo that just renders a JSON file with `RotationRenderer`.
- `index.html` — richer demo/landing page combining rendering with extra chrome.
- `rendu_statique_1.html`, `visualisateur_avant-apres.html` — additional static demo variants.

Local script include order matters and mirrors the dependency graph below (see `editor.html`):
`intervention.js` → `step-model.js` → `chart-render.js` → `editor-interventions.js` →
`editor-loader-default.js` → `editor-loader-wiki.js` → `editor-loader-itinera.js` → `editor-main.js`.
External deps (Echarts, JQuery, Underscore, Bootstrap, jQuery UI for sortable) are pulled from CDN in the
HTML `<head>`, not from `node_modules` — this repo's own `js`/`css` files are the npm package payload
consumed by *other* projects (see the "Utilisation dans un autre contexte" section of `README.md` for the
npm consumer-side integration snippet).

## Architecture

### Rendering (`js/chart-render.js`)

Everything rendering-related lives in one class, `RotationRenderer` (exposed as `window.RotationRenderer`),
constructed with a target div id and a "system" JSON object (see schema below). It builds ECharts
`option` objects for two mutually exclusive views selected by `system.options.view`:
- `"horizontal"` (frise): a Gantt-like custom-series timeline of steps with interventions plotted above
  ("intervention_top", e.g. weed control) and below ("intervention_bottom", e.g. everything else) the
  timeline, plus optional temperature/precipitation series overlaid from `system.options.climate_data`.
- `"donut"` (rotation): the same steps laid out as a circular sunburst-style diagram instead.

This same class also renders the textual step/intervention list ("transcript") alongside the chart and
wires up click-to-highlight between the chart and that list. There's no separate view layer — chart
option-building, DOM/HTML string building, and event wiring are all methods on `RotationRenderer`.

### Data model (`js/step-model.js`, `js/intervention.js`)

`StepModel` wraps a single step (crop) plain object, filling in defaults (id via `crypto.randomUUID()`,
color, dates, `useDefaultColor`/`useDefaultStartDate`/`useDefaultEndDate` flags) and providing mutation
helpers (`setDurationInDays`, `addIntervention`, `updateFromForm` which reads directly from the editor's
`#cropForm` DOM inputs). `Intervention` is a tiny constructor for one intervention entry
(`{id, day, name, type, description}`). Both classes mutate/wrap plain objects rather than being separate
from the JSON — `step.getStep()` returns the same object that gets serialized to JSON on export, so
editing via `StepModel`/`Intervention` methods *is* editing the exported data.

The overall JSON schema consumed by both the renderer and the editor:
```
{
  "title": string,
  "options": {
    "view": "horizontal" | "donut",
    "show_transcript": bool,
    "title_top_interventions": string,
    "title_bottom_interventions": string,
    "title_steps": string,
    "show_climate_diagram": bool,
    "climate_data": { "temperatures": number[12], "precipitations": number[12] }
  },
  "address": {
    "raw": string,           // free-text address as typed/geocoded, e.g. "Rouen, France"
    "town": string,
    "region": string,        // French administrative région, e.g. "Normandie"
    "department": string,
    "country": string,
    "gpsLocation": { "lat": number, "lng": number } | null
  },
  "steps": [{
    "id", "name", "color", "startDate", "endDate", "description", "duration",
    "secondary_crop": bool,
    "useDefaultColor" / "useDefaultStartDate" / "useDefaultEndDate": bool,
    "attributes": {...},
    "interventions": [{ "id", "day", "name", "type": "intervention_top"|"intervention_bottom", "description" }]
  }]
}
```
`test/test.json` is the canonical example; treat it as the source of truth over this summary when the two
disagree. `address` is populated wholesale from the `itk-info` geocoding API response (see below) rather
than edited field-by-field; only `address.raw` and `address.gpsLocation` can be hand-edited in the editor
UI. Files exported before this struct existed may instead have `region`/`address`/`latitude`/`longitude`
directly under `options` — `TikaEditor.migrateLegacyAddress()` (`js/editor-main.js`) converts those into
the new `address` struct the first time such a file is loaded.

### Editor (`js/editor-main.js`, `js/editor-interventions.js`, `js/editor-loader-*.js`)

`TikaEditor` (`js/editor-main.js`) owns the in-memory `system` object, the currently-selected step, DOM
event wiring (crop form, drag-and-drop reordering via jQuery UI `sortable`, params modal), and delegates
the top/bottom intervention tables to `InterventionTable` (`js/editor-interventions.js`).

Persistence/integration is pluggable via an "editor loader" chosen at DOM-ready time based on
`window.location`, not build-time config (`TikaEditor.setupDomReady` in `js/editor-main.js`):
- host contains `itinera` and URL has an `itinera` query param → `ItineraLoader` (saves back into Itinera).
- host is `tripleperformance.ag`/`.fr` → `WikiLoader` (saves back into the Triple Performance MediaWiki).
- anything else (local/standalone use) → `DefaultLoader` (JSON file import/export only).

All three share `DefaultLoader` (`js/editor-loader-default.js`) as their base for the common toolbar
buttons, JSON file import/export, the wipe/confirmation modals, and unsaved-changes tracking (it wraps
`tikaeditorInstance.refreshAllTables` to flip a dirty flag and warns on `beforeunload`). `WikiLoader` and
`ItineraLoader` override `setupButtons()` to swap in their own save-to-backend buttons and implement
loading/saving against their respective remote systems. When adding a new host integration, subclass
`DefaultLoader` rather than branching inside `TikaEditor`.

The params modal (`setupParamsModal` in `js/editor-main.js`) also calls two external `itk-info.tripleperformance.fr`
endpoints: `/api/location` geocodes the free-text address into `system.address` (town/region/department/
country/gpsLocation) and climate normals, and `/api/culture` (called from `getChatGPTInfoFromCropName`)
looks up crop defaults (color, sowing date) using `system.address.region` as the locale hint.

### Styling

`scss/styles-editor.scss` and `scss/styles-rendering.scss` compile 1:1 to `css/styles-editor.css` and
`css/styles-rendering.css`. The rendering stylesheet is part of the published npm package (consumers copy
it alongside `chart-render.js`); the editor stylesheet is only used by this repo's own `editor.html`.
