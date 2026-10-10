---
name: fontshare
description: Select Fontshare families or pairs for logos, landing pages, portals, branding, or style guides; rank alternatives and produce typography proofs in the requested document.
---

# Fontshare

Turn a brief into a verifiable typography choice using [Fontshare](https://www.fontshare.com/) families.

## 1. Resolve the brief

Read project context and established art direction. Resolve artifact and text role, audience, tone, exact words, languages, minimum sizes, technical constraints, and requested alternative count.

If a consequential decision is missing, ask one focused round grouping the gaps. Logos need at least the exact name and direction; pages need content type and tone. With sufficient context proceed and disclose minor assumptions.

Complete when the brief distinguishes suitable from unsuitable candidates.

## 2. Select candidates

Read [catalog.md](references/catalog.md) to compare the 100 families: categories, personalities, and availability are official data; uses and caveats are editorial judgments. Find exact styles by slug in [catalog.json](references/catalog.json). If a requested family is absent or current data matters, verify its official page and endpoints in [availability.md](references/availability.md).

For two-font combinations read [pairs.md](references/pairs.md): all 59 official pairs, heading-to-body direction, and sample styles. Adapt to the brief; label additional combinations as proposals. Two weights of one family form a single-family system, not a two-font pair.

Compare the brief's tone with official personality labels, preserving their original names. Use this to narrow the shortlist, then validate role and real content. If no label matches, state the editorial interpretation. For pairs evaluate both families in their roles.

Rank by direction and role fit, actual-size readability, language/style coverage, and system coherence. The first candidate is recommended for this brief, not universally best. Give each candidate a relevant advantage and concrete tradeoff; numerical scores require a requested method.

- **Logo:** evaluate actual letters, kerning, silhouette, case, recognition, and reduction. A distinctive logo may need a different text family.
- **Landing:** compare hero, subtitle, paragraph, and CTA at the target mobile width too.
- **Portal:** prioritize body, labels, navigation, tables, numerals, states, and hierarchy; verify available italics and weights.
- **Branding/style guide:** assign display, body, and UI roles; show scale, weights, line height, and tracking on representative applications.

Return the requested number of distinct families or pairs. Differentiate typographic structure within the brief's direction. If constraints prevent the count, report valid candidates and the constraint that would need relaxing.

Complete when the ranked shortlist identifies official personalities, roles, available styles, rationale, caveats, and pair provenance.

## 3. Produce and verify proofs

When assigned document/canvas variants, create them in the requested destination after checking font availability through [availability.md](references/availability.md). Use tools available in the current environment.

Hold content, color, and comparison context constant. For logos hold optical height and comparable bounds while preserving natural proportions; for pages hold layout and viewport. Label each alternative with rank, family, style, and role; keep text editable. Show a reduced logo or actual-use-size proof. Disclose variant-specific kerning/scale adjustments.

Verify the actual applied font, overflow, accented glyphs, numerals, and legibility in target formats. When the tool cannot expose the resolved font, record the requested selection and verification limit; a label does not prove rendering. Identify substitutes as fallbacks, finish available variants, and report blocked ones.

Complete when the requested proofs exist in the correct document with font/style verification, recommendation, and observed limits. Advisory requests need only the shortlist; installation on disk does not prove canvas availability.
