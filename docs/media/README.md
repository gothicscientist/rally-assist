# UI captures

These images show the actual Rally Assist extension rendered by Chromium on a controlled local HTML page, not a live Rally match. The surrounding presentation is a fixture. The panel is loaded through the real Manifest V3 MAIN-world content-script entry point.

| Image | State |
| --- | --- |
| `overview.png` | 1280 × 860 fixture, assist on, ready with no match, zero session hits |
| `panel.png` | Cropped expanded panel in the same state |
| `minimized.png` | Collapsed launcher, assist still on |
| `narrow.png` | 360 × 640 layout with scrollable panel body |

Reproduce from the repository root:

```sh
npm ci
npx playwright install chromium
npm run screenshots
```

The script overwrites these four captures. The GitHub Actions workflow also uploads them as `rally-assist-screenshots`. No phone connection, production game request, or invented statistics is used.

The original inline SVG paddle mark is part of the extension. There are no redistributed game images or stock photographs.
