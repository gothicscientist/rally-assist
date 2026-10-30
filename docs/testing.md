# Verification scope

## Core tests

Run `npm test` with Node.js 22+. The eight tests use controlled game objects to cover option validation, inert disabled state, reversible hooks, replacement matches, unsupported interfaces, match/player guards, hit accounting, and error recovery.

## Installed-extension browser test

```sh
npm ci
npx playwright install chromium
npm run test:ui
```

Playwright launches a fresh Chromium profile and loads this repository with `--load-extension`. A routed local HTML page supplies controlled state; the manifest injects the actual MAIN-world scripts. The test checks controls, immediate status, saved preferences, F8/F9, editable-field shortcut guards, focus after collapse, malformed storage, pause/unsupported states, route exclusions, and panel bounds at 360 × 640 and 1280 × 600.

This verifies injection and UI behavior against a fixture. It does not pair a phone or connect to Rally's live multiplayer service. Chrome and Edge stable must be checked separately from bundled Chromium.

The screenshot script uses the same installed-extension setup. Images contain no fabricated hit totals: the capture has assist enabled, no match attached, and counters at zero.

Optional environment overrides: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` selects an existing Chromium binary; `PLAYWRIGHT_MODULE` selects an existing Playwright module path. Normal development needs neither.

## Original game simulation tests

The original October 22 test suite has been retained in [simulation.test.mjs](../tests/simulation.test.mjs). It imports the game's real `Rally`, `Match`, `Segment`, and shot-generation modules from a separately supplied source directory. These game files are not included in this repository.

Set `RALLY_SOURCE_DIR` to a compatible Rally checkout's `public/` directory, containing `js/display/{rally,match,physics,shots}.js` and `js/shared/serve.js`:

```sh
RALLY_SOURCE_DIR=/path/to/rally/public npm run test:simulation
```

PowerShell:

```powershell
$env:RALLY_SOURCE_DIR = 'C:\path\to\rally\public'
npm run test:simulation
```

The modules must be interpreted as ES modules, as they are in the original Rally checkout. A fresh clone of the current game may have changed interfaces; the test is intentionally optional and is not fetched from an unpinned main branch in CI.

Coverage includes legal serves on both human sides at 15/30/60/144 FPS; smash, loop, chop, flick, and drive outcomes; manual early swings; pending-hit cancellation; pause/replay/gate behavior; remote-side isolation; mixed-preset rotation; and replacement-match detachment.

## Local evidence, October 30, 2026

- Eight core tests passed.
- Eight original-snapshot simulation tests passed using the previously saved game modules.
- Manifest/script validation and documentation-link checking are available through `npm run check`.
- Installed-extension browser tests and image capture run in the repository's GitHub Actions workflow. Consult the workflow result for the current revision.

No live online match was verified. Test coverage should not be described as a win rate, production reliability measurement, or proof that the current game accepts these modified swings.
