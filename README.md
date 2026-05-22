# NZXT Kraken Flightdeck

Flightdeck is a static NZXT Kraken Elite web integration with a circular cockpit-style display for CPU, GPU, RAM, liquid temperature, and cooling RPMs.

It supports the NZXT Web Integration split:

- `/` opens the configuration browser with a live preview.
- `/?kraken=1` opens the Kraken display browser.

## Run Locally

```bash
npm install
npm run dev
```

Use this URL in NZXT CAM while developing:

```text
http://localhost:5173/?kraken=1
```

In NZXT CAM, open the device lighting controls, choose Web Integration mode, edit Custom Mode, then paste the URL.

## Settings

Settings are stored in:

```text
localStorage["krakenFlightdeck.settings.v1"]
```

The saved object uses this contract:

```json
{
  "theme": "ice",
  "unit": "c",
  "focus": "balanced",
  "demoMode": true,
  "motion": "normal"
}
```

Supported values:

- `theme`: `ice`, `green`, `amber`
- `unit`: `c`, `f`
- `focus`: `balanced`, `cpu`, `gpu`, `liquid`
- `demoMode`: `true`, `false`
- `motion`: `normal`, `reduced`, `off`

## GitHub Pages

This project is static and can be deployed to GitHub Pages with the included workflow.

After publishing, replace `YOUR-GITHUB-USER` in the config page links with your GitHub username and repository URL:

```text
https://YOUR-GITHUB-USER.github.io/nzxt-kraken-flightdeck/
```

NZXT CAM share link:

```text
https://cam-redirect.nzxt.com/action/load-web-integration?url=https%3A%2F%2FYOUR-GITHUB-USER.github.io%2Fnzxt-kraken-flightdeck%2F
```

NZXT CAM Beta share link:

```text
https://cam-beta-redirect.nzxt.com/action/load-web-integration?url=https%3A%2F%2FYOUR-GITHUB-USER.github.io%2Fnzxt-kraken-flightdeck%2F
```

## Screenshot For Submission

NZXT asks for an example image at `640x640px`. Open:

```text
http://localhost:5173/?kraken=1
```

Capture the browser at exactly `640x640px`, with demo mode enabled if CAM is not available.

## Build Checks

```bash
npm run lint
npm test
npm run build
```

## Device Support

This v1 build targets Kraken Elite `640x640px` circular screens. Smaller square/circular previews should scale, but are not the official target for submission.

## Assets And License

The attached reference image was used only as visual inspiration and is not shipped in this project. The interface is built from original CSS and SVG. NZXT CAM monitoring types come from `@nzxt/web-integrations-types`.

License: MIT.
