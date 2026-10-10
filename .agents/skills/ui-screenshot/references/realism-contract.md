# UI Screenshot realism contract

Load this reference before changing capture stabilization, overlay cleanup, or digital-polaroid geometry.

## Product render

Represent the interface a user is meant to perceive at the requested viewport. Use the requested state and data, real browser rendering, settled fonts and images, the actual responsive breakpoint, and explicit locale, color, and time settings.

Apply these layers in order:

1. Send `x-vercel-skip-toolbar: 1`.
2. When analytics consent applies, require the real consent action or a supplied consent cookie and verify the granted cookie. Record only `accepted` or `preaccepted`; omit the consent request when it is not applicable.
3. Wait for DOM readiness, best-effort network idle, `document.fonts.ready`, image completion, meaningful content, named blockers to disappear, a readiness settle window, and two animation frames within one readiness deadline. Recheck named blockers after the window and before every segment.
4. Fail on known Next.js build, hydration, and runtime errors before removing development chrome.
5. Remove Vercel Toolbar and non-error Next.js development hosts plus explicit `--hide` selectors.
6. Recheck blockers before every segment, then capture with hidden carets and screenshot-time animations disabled.

Application-owned dialogs, toasts, skeletons, and debug UI are real state. Reach the requested state instead of removing them generically. Consent banners are interaction gates: accept analytics when the requested archive represents the usable product state. Preserve a consent screen only when it is itself the historical subject.

## Digital polaroid

Preserve the raw render under `raw/`. Make the root-level PNG the Figma artifact:

- Mobile semantics produce a clean black iPhone-like shell with a rounded screen.
- Desktop semantics produce a black MacBook-like display shell with restrained camera detail.
- Both use a thicker lower band without a divider against the image. Show the route at left; place viewport identity and localized source date/time on the row below, using identical typography and a shared baseline.
- Keep the frame functional: neutral black, no brand logos, no decorative background, no outer shadow, and fully transparent outer corners.
- Scale frame geometry in CSS pixels and render it at the requested DPR so the raw interface retains its intended density.

The driver decodes the framed PNG and requires alpha `0` at all four corner pixels. A partially transparent shadow or matte is a failed capture even when the file format reports RGBA.

The route defaults to the final URL pathname. Use `--page-label` when a state name is more useful in Figma, for example `/recipes · empty` and `/recipes · populated`.

For a historical render, pass the represented revision through `--source-revision` and its commit timestamp through `--source-at`. Treat that provenance as the artifact identity. Keep the later file-generation timestamp separately as `capturedAt` in the manifest.

## Viewports and dimensions

Width and height are CSS pixels; DPR controls output pixels. A raw `390x844@3` capture produces `1170x2532` pixels. The framed file is larger because bezel and footer are part of the artifact. Mobile semantics enable touch and mobile viewport behavior; desktop semantics retain desktop layout behavior.

Use DPR 2 for desktop Retina archives and DPR 3 for mobile by default. For a true 4K desktop artifact, use `1920x1080@2`; this yields a `3840x2160` raw render before the frame. Keep DPR at or below 3 for normal work and use DPR 4 only when explicitly required, because long or segmented pages can otherwise create large browser-memory spikes.

## Long pages

Probe the page height before choosing a mode. Ask the user when the page exceeds one viewport and the request does not already decide among:

- Initial or specific viewport: capture the top or use `--scroll-y`.
- Full page: use `--full-page` for one tall artifact.
- Sections: use `--segments` to scroll by one viewport height, capture each position, and align the final capture to the page bottom.

Number section artifacts and record `scrollY`, `segmentIndex`, and `segmentCount` in the manifest. Repeated sticky content is legitimate evidence of the scrolled viewport state.

## Review gate

Inspect every framed image. It remains incomplete when the render is blank, clipped, stale, loading, covered by consent or development tooling, redirected to an unintended login/not-found page, framed as the wrong device family, labeled ambiguously, or has nonzero corner alpha. Use the raw counterpart to distinguish a capture defect from a frame defect.
