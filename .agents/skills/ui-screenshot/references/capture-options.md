# UI Screenshot capture options

Load this reference when a run needs more than public, unauthenticated viewport screenshots.

## CLI

```text
--url <absolute-url>                 Repeat for pages.
--viewport <name=WIDTHxHEIGHT@DPR>  Repeat for viewports; DPR defaults to 2 desktop, 3 mobile.
--viewport <name=WxH@DPR,mobile>    Enable touch/mobile viewport semantics.
--target <name=css-selector>        Repeat for component captures.
--out <directory>                   Archive directory.
--label <text>                      Human-readable manifest label.
--full-page                         Capture the complete scrollable page.
--segments                          Capture consecutive viewport-height scroll segments.
--scroll-y <pixels>                 Capture one viewport at a specific vertical offset.
--color-scheme <light|dark|no-preference>
--locale <locale>                   Default: en-US.
--timezone <IANA-zone>              Default: UTC.
--browser <chromium|firefox|webkit> Default: chromium.
--storage-state <path>              Playwright authentication state.
--wait-for <css-selector>           Wait for meaningful content.
--wait-until-hidden <css-selector>  Repeatable blocker that must disappear.
--reject-selector <css-selector>    Repeatable visible selector that fails capture.
--reject-visible-text <text>        Repeatable visible text fragment that fails capture.
--accept-analytics                  Require verified accepted or preaccepted analytics consent.
--readiness-timeout <milliseconds>  Maximum readiness wait; default: 30000.
--stability-ms <milliseconds>       Readiness settle window; default: 1000.
--delay <milliseconds>              Extra settling time after fonts/images.
--hide <css-selector>               Repeat for app-specific debug chrome.
--header <name=value>               Repeat for non-secret request headers.
--page-label <text>                 Override the route shown at frame-left.
--source-at <ISO date-time>         Historical source timestamp used by frame and filename.
--source-revision <ref>             Historical source revision used by filename and manifest.
--keep-animations                   Preserve animation during capture.
--overwrite                         Allow a non-empty archive directory.
--dry-run                           Print the matrix without launching a browser.
```

Selectors may contain `=`; the driver splits `--target` and `--header` only at the first equals sign.

## Common runs

Pages at two viewports:

```bash
node <skill-dir>/scripts/capture.mjs \
  --url http://localhost:3000/ \
  --url http://localhost:3000/settings \
  --viewport desktop=1440x900@2 \
  --viewport iphone-15=393x852@3,mobile \
  --color-scheme light \
  --locale en-US \
  --timezone Europe/Rome \
  --out artifacts/screenshots/2026-08-03-settings
```

True 4K desktop output without an excessive DPR:

```bash
node <skill-dir>/scripts/capture.mjs \
  --url http://localhost:3000/recipes \
  --viewport desktop-4k=1920x1080@2 \
  --out artifacts/screenshots/2026-08-03-recipes-4k
```

Long page as sequential viewport-height captures:

```bash
node <skill-dir>/scripts/capture.mjs \
  --url http://localhost:3000/recipes \
  --viewport mobile=390x760@3,mobile \
  --segments \
  --out artifacts/screenshots/2026-08-03-recipes-segments
```

Segment files are numbered `segment-01-of-N`. The final segment aligns with the bottom of the page, so it may overlap the previous one instead of omitting trailing content.

Components in their real page layout:

```bash
node <skill-dir>/scripts/capture.mjs \
  --url http://localhost:3000/dashboard \
  --viewport desktop=1440x900@2 \
  --target activity-card='[data-testid="activity-card"]' \
  --target sidebar='[data-testid="sidebar"]' \
  --out artifacts/screenshots/2026-08-03-dashboard-components
```

Authenticated state:

1. Use Playwright CLI to log in.
2. Run `state-save /absolute/path/to/state.json`.
3. Pass `--storage-state /absolute/path/to/state.json`.
4. Remove the temporary state file after the archive is verified; never commit it.

## Historical naming

Prefer `artifacts/screenshots/YYYY-MM-DD-<activity>` or the repository's existing visual-history directory. Pass the historical commit timestamp as `--source-at` and its SHA as `--source-revision`. The driver prefixes every filename with the localized source timestamp and short revision. It rejects a non-empty output directory unless `--overwrite` is explicit. Root-level PNGs are framed digital polaroids for Figma; matching unframed renders live under `raw/`. The manifest keeps historical provenance under `sourceAt` and `sourceRevision`, and file-generation time under `capturedAt`.

## State that needs interaction

When the state cannot be expressed through URL, cookies, or saved storage alone, use one of these approaches in order:

1. Add a stable route/query/fixture already supported by the application.
2. Use the Playwright skill to reach the state and add a narrowly scoped project capture script.
3. Extend this driver only when the interaction is reusable across projects.

Keep one-off business workflows out of this generic skill.

## Readiness gate

Use `--wait-for` for route-specific proof that meaningful content mounted. Use `--wait-until-hidden` for legitimate transient loaders and skeletons. Use `--reject-selector` or `--reject-visible-text` for terminally invalid states such as build errors, unintended login screens, not-found pages, or historical placeholders that never resolve. Visible-text rejection reads rendered body text, including phrases split across nested elements. Enable `--accept-analytics` whenever analytics consent applies: the driver must verify a granted consent cookie before reporting `accepted` or `preaccepted`, and fails when neither can be proved. Omit the flag only when consent is not applicable to that page. Every readiness wait shares the `--readiness-timeout` deadline; the driver fails the matrix cell when a gate remains unresolved and never saves a best-effort image.
