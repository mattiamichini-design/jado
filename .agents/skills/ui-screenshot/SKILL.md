---
name: ui-screenshot
description: Capture realistic UI screenshots as minimal device-framed digital polaroids for visual history and Figma.
disable-model-invocation: true
---

# UI Screenshot

Deliver a **digital polaroid**: a clean product render inside a black iPhone-like or MacBook-like frame, with route and source date/time in its lower band. Keep the raw render beside it and map both in `manifest.json`.

## 1. Fix the capture matrix

Resolve pages, UI states, viewports, DPR, targets, color scheme, locale, timezone, provenance, and archive directory. Use exact requested values. With no viewport requirement, use Retina defaults: `desktop=1440x900@2` and `mobile=390x844@3,mobile`. For historical renders, provenance is the source revision and its ISO commit timestamp; for current renders, the driver derives provenance from Git and capture time.

After reaching a page, compare `scrollHeight` with the viewport height. When the page scrolls beyond one viewport and the user has not chosen a capture mode, ask whether to capture: (1) the initial viewport or a specific scroll point, (2) one full-page image, or (3) consecutive viewport-height segments through the entire page. Record the choice before capture.

Completion criterion: every requested page/state × viewport × target has an explicit density, scroll mode, source timestamp, and source revision in the matrix.

## 2. Reach the real state

Confirm the application is reachable. Start its documented local server only when needed. Use the Playwright skill for login or interaction and pass saved authentication with `--storage-state`. Preserve real requested data and state.

Treat readiness as a fail-closed gate. When analytics consent applies, accept it through the real control or pass a verified consent cookie and use `--accept-analytics`; the flag succeeds only with verified `accepted` or `preaccepted` state. Omit the flag when consent is not applicable to the page. Name meaningful content with `--wait-for`; name transient UI with `--wait-until-hidden`; reject known error, login, empty-placeholder, or permanent-loader states with `--reject-selector` and `--reject-visible-text`. A delay can follow readiness, but cannot replace it. A historical state that can never become meaningful belongs in the rejection report with its stable successor, not in the Figma-ready archive.

Read [capture-options.md](references/capture-options.md) when the run needs authentication, component targets, custom labels, or non-default browser conditions.

Completion criterion: each URL visibly contains its requested state, analytics consent is verified when applicable, every named blocker is absent, and the readiness settle window has completed.

## 3. Produce the digital polaroids

Run from the project root:

```bash
node <skill-dir>/scripts/capture.mjs \
  --url http://localhost:3000/recipes \
  --viewport desktop=1440x900@2 \
  --viewport mobile=390x844@3,mobile \
  --locale en-US \
  --timezone Europe/Rome \
  --source-at 2026-08-03T14:32:08+02:00 \
  --source-revision 9f2b945260412c48081ac13da5e5ac68785bdf8f \
  --out artifacts/screenshots/2026-08-03-recipes
```

The driver settles the page, fails on framework errors, removes non-error Next.js/Vercel development chrome, and captures the underlying interface. It writes timestamp-prefixed transparent framed PNGs at the archive root, raw PNGs under `raw/`, and a git-aware manifest. The footer derives its left label from the route and prints the localized source date/time at right; use `--page-label` to override the route. `sourceAt` and `sourceRevision` identify the UI being represented, while `capturedAt` records when the file was generated. Use `--scroll-y`, `--full-page`, or `--segments` for the chosen long-page mode.

Read [realism-contract.md](references/realism-contract.md) before changing overlay selectors, frame geometry, or settling rules.

Completion criterion: the manifest is `complete` and contains one framed file plus one raw file for every matrix cell or requested scroll segment.

## 4. Review every framed image

Open every root-level PNG. Confirm the product render is settled and unclipped, development chrome is absent, the device family matches the viewport, and route/date remain legible. Confirm `cornerAlpha` is `[0,0,0,0]`; partially opaque outer corners fail review. Open the matching raw file when the frame or crop looks suspicious. Recapture every rejected artifact.

Completion criterion: every framed PNG has been visually accepted; manifest dimensions and files agree with disk; every capture records a successful readiness gate and, when requested, `consentAction` is `accepted` or `preaccepted`.

## 5. Hand off

Return the archive directory, manifest, capture count, viewports, and inferred defaults. Point the user to root-level PNGs for Figma and `raw/` for unframed sources.

Completion criterion: each Figma-ready image can be traced to route, source date/time, source revision, capture date/time, viewport, DPR, target, raw source, and checksum.
