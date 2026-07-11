# Frame System v2

## Purpose

Separate structure, animation and visual skin so future PNG assets can replace the current metallic CSS without changing application logic.

## Components

- `frameShellTop`: fixed header chrome.
- `frameShellBottom`: fixed bottom dock chrome.
- `frameShutter--top`: independent upper shutter.
- `frameShutter--bottom`: independent lower shutter.
- `frameStartupControls`: independent startup controls layer.
- `frameStartupChoice--left`: Google panel, moves left only.
- `frameStartupChoice--right`: offline panel, moves right only.
- `frameRail--left` / `frameRail--right`: side rails.
- `main`: scrollable application content.

## Layer contract

1. Content: `20`
2. Shutters: `200`
3. Startup controls: `260`
4. Header and dock chrome: `320`

Shutters always pass behind header and dock. Startup controls are independent from shutters.

## Animation contract

The opening state is represented by `frameStartup--opening` on `#entryGate`.

- top shutter: vertical negative translation;
- bottom shutter: vertical positive translation;
- Google control: horizontal negative translation;
- offline control: horizontal positive translation.

No opacity or display transition is used during motion. The gate may be hidden only after the common motion duration has completed.

## Skin contract

Visual backgrounds may later be replaced by PNG assets through the following selectors without changing DOM or JavaScript:

- `.frameShellTop`
- `.frameShellBottom`
- `.frameShutter--top`
- `.frameShutter--bottom`
- `.frameStartupChoice--left`
- `.frameStartupChoice--right`
- `.frameRail--left`
- `.frameRail--right`

Recommended future asset folders:

```text
assets/frame/header/
assets/frame/shutters/
assets/frame/rails/
assets/frame/dock/
assets/frame/startup/
```

## Service Worker rule

`service-worker.js` manages caching only. It must never inject CSS, transform HTML or contain component styling.
