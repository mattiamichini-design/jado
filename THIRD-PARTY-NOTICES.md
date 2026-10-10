# Third-party notices

JADO is released under the [MIT License](LICENSE). This file lists material that comes from other authors.

## Upstream skills

JADO does not include the content of these skills. `jado/skill-lock.json` records where each one comes from, and the installer downloads it from its author's repository with the [`skills`](https://www.skills.sh/docs/cli) CLI (a development dependency of this repository) when you install or update JADO. The lock records a folder hash for each skill but no commit, so an installation receives the version the repository serves at that moment. Each skill stays under its author's license; read it in the linked repository before you redistribute the downloaded files.

| Repository | Skills | License reported by GitHub |
| --- | --- | --- |
| [blader/humanizer](https://github.com/blader/humanizer) | `humanizer` | MIT |
| [conorbronsdon/avoid-ai-writing](https://github.com/conorbronsdon/avoid-ai-writing) | `avoid-ai-writing` | MIT |
| [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) | `copy-editing`, `copywriting`, `product-marketing` | MIT |
| [emilkowalski/skills](https://github.com/emilkowalski/skills) | `animation-vocabulary`, `emil-design-eng`, `find-animation-opportunities`, `improve-animations`, `review-animations` | MIT |
| [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | `fixing-accessibility`, `fixing-metadata`, `fixing-motion-performance` | MIT |
| [jakubkrehel/make-interfaces-feel-better](https://github.com/jakubkrehel/make-interfaces-feel-better) | `make-interfaces-feel-better` | MIT |
| [jakubkrehel/oklch-skill](https://github.com/jakubkrehel/oklch-skill) | `oklch-skill` | MIT |
| [jakubkrehel/skills](https://github.com/jakubkrehel/skills) | `better-accessibility`, `better-colors`, `better-interface`, `better-layout`, `better-typography`, `better-ui`, `better-writing` | MIT |
| [mattpocock/skills](https://github.com/mattpocock/skills) | `research`, `writing-for-agents` | MIT |
| [mobbin/skills](https://github.com/mobbin/skills) | `mobbin-search` | MIT |
| [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `impeccable` | Apache-2.0 |
| [shadcn/ui](https://github.com/shadcn/ui) | `shadcn` | MIT |
| [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) | `web-design-guidelines` | See the repository |

## Fontshare data

`.agents/skills/fontshare/references/` contains font names, categories, styles, personality labels, pairings and license names collected from [Fontshare](https://www.fontshare.com) by the Indian Type Foundry. No font files are included. `.agents/skills/fontshare/scripts/download.py` downloads fonts from Fontshare on request; those fonts are licensed by Fontshare under the [ITF Free Font License](https://www.fontshare.com/licenses/itf-ffl) or the [SIL Open Font License](https://www.fontshare.com/licenses/sil-ofl).

## Images and brand marks

The images in `public/landing/`, the JADO lyre mark and wordmark, and the app icons were made for this project by its author and are covered by the MIT License of this repository.

## npm dependencies

The playbook site and the CLI use npm packages listed in `package.json` and `package-lock.json`. Each package keeps its own license, which npm installs alongside it in `node_modules/`.
