---
name: html-show
description: Create standalone HTML section-presentations. Use for feature recaps, current-state audits, competitive research, and concept explainers when the user asks for a navigable HTML page or internal presentation.
---

# HTML Show

Build a standalone HTML **section-presentation**: one navigable page, not a slide deck. Choose one branch from the artifact map before writing.

## Artifact Map

| Branch | Use when | Template | Default path |
| --- | --- | --- | --- |
| Feature recap | Implemented change, design solution, handoff, before/after | `templates/feature-recap.html` | `docs/04-tasks/<area>/<slug>/index.html` |
| Competitive research | Competitor review, Mobbin research, market pattern scan | `templates/competitive-research.html` | `docs/ux/competitive-research/<slug>/index.html` |
| Current-state audit | Audit, heuristic review, current UX/UI diagnosis | `templates/current-state-audit.html` | `docs/05-audits/<date>-<slug>/index.html` |
| Explainer | Technical concept, product model, general explanation | `templates/explainer.html` | ask: project docs, temp file, or a shared explainers folder the user names (`<folder>/<slug>/index.html`) |

## Steps

1. **Map the artifact.** Pick one branch from the artifact map. If the default path is ambiguous, ask one routing question. Done when the branch, template, and output path are known.

2. **Ground the content.** Read the relevant source material before writing: code, docs, screenshots, audit notes, research, or user-provided text. For visual changes, gather before/after assets when available. Done when the page can cite concrete evidence instead of placeholders.

3. **Author one standalone HTML file.** Start from the mapped template. Inline CSS and JavaScript. Use local relative asset paths for screenshots. Keep the structure specific to the branch: feature pages emphasize before/after and implementation evidence; research pages emphasize competitor screens, pattern clusters, and opportunity mapping; audits emphasize findings and severity; explainers emphasize mental models and step-by-step comprehension. Done when the page is real content, not scaffold text.

4. **Make the page interactive where it clarifies.** Prefer sticky navigation, active section state, before/after comparison with a draggable vertical divider, filters, tabs, image mood boards, and a click-to-open lightbox with previous/next navigation. Avoid turning it into a SPA. Done when every interactive control has a visible, useful effect.

   Treat the primary navigation as a full-width page band, not as a floating card inside the content container. The band must touch both viewport edges, use `border-bottom` with no outer `border-radius`, and remain sticky at `top: 0`. Put a dedicated inner wrapper inside it whose width matches the page body container. Apply the shared max-width and responsive side gutters to that inner wrapper and to the page body independently.

   Section introductions are always vertical: the section title comes first and its description follows underneath. Never place the heading and description in side-by-side grid columns, including at wide desktop widths. Keep the description readable with a deliberate text measure.

   Internal search and filter toolbars may be spacious in their resting position, but must become compact when sticky. Mark reusable toolbars with `data-sticky-controls`, detect the stuck state with a sentinel or equivalent scroll measurement, and expose it as `data-stuck="true"`. In the stuck state, reduce the toolbar padding and gap, cap search inputs and buttons at `34px` high, and remove unnecessary vertical space. The compact state must not depend on viewport width alone.

   For sections that contain many screenshots or wide images, constrain the section to the page width and put horizontal scrolling on the local image strip only. The document itself must not get horizontal scroll. Lightboxes must trap left/right arrow keys while open, provide visible previous/next controls, and avoid upscaling images beyond their native pixel width unless the artifact explicitly calls for zoom.

   When presenting app screenshots, give both gallery thumbnails and lightbox images a minimal device frame. Mobile screenshots use a thin black phone frame inspired by VariantHub: dark 5px border, rounded corners, and a small notch. Desktop screenshots use only a simple dark border around the image, with no fake laptop stand, base, or camera detail. Keep frames minimal so the screenshot remains the primary object.

   In current-state archives, separate counts from viewport dimensions. Use labels like "Frames" or "Surfaces" for counts, and labels like "Desktop viewport 1600 px" or "Mobile viewport 390 px" for capture widths. Do not present viewport widths as metric counts.

   Metric cards must treat units as part of the value, not as ambiguous counts. Use explicit labels such as "Desktop viewport" or "Image segments", keep numeric type inside the card with `min-width: 0`, `overflow: hidden`, and responsive `clamp()` sizing, and verify at mid-width viewports around 1075px as well as mobile. Sticky section navigation must update after hash changes and explicit nav clicks, not only during passive scroll.

5. **Verify visually.** Open the file or serve it locally. Check desktop, a mid-width viewport around 1075px, and mobile. Confirm that the primary navigation spans the viewport while its contents align with the page body, every section title precedes its description vertically, sticky search/filter controls switch to the compact state with controls no taller than `34px`, and navigation, controls, assets, text wrapping, and responsive layout work. Fix issues before delivery. If browser verification is unavailable, state that and run static checks instead.

## Visual Default

Use a brand-agnostic light-mode style made only from white, black, and neutral grays. Use sans-serif system fonts only. Do not use colored accents, serif typefaces, gradients, decorative blobs, or project-specific visual language. Motion should feel quiet and premium: short fades, small transforms, smooth comparison dragging, and a `prefers-reduced-motion` fallback.

## References

- Feature recap template: `templates/feature-recap.html`
- Competitive research template: `templates/competitive-research.html`
- Current-state audit template: `templates/current-state-audit.html`
- Explainer template: `templates/explainer.html`
- Generic fallback shell: `templates/section-presentation.html` only when no mapped branch fits.
- Examples: `EXAMPLES.md`

## Completion Check

- [ ] Branch and output path are explicit.
- [ ] The selected template matches the case, not just the generic shell.
- [ ] Source material was inspected or the lack of source material is stated.
- [ ] Output is a single standalone HTML file.
- [ ] Navigation and interactive modules work.
- [ ] Primary navigation is full-width, square-edged, and separated by a bottom border; its inner content aligns with the page body.
- [ ] Section titles and descriptions stay vertically stacked at every viewport.
- [ ] Sticky search/filter toolbars compact to controls no taller than 34px.
- [ ] Desktop and mobile layouts were verified or the limitation is stated.
- [ ] No placeholder copy, broken assets, or unreadable sections remain.
