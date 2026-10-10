# JADO

JADO (Just Another Design Orchestrator) is a design method for AI coding tools. It routes a design request to one of eight routes and gives the agent the procedures, profiles and review steps for that workflow. Claude Code, Codex and OpenCode each get native agent profiles and skills.

This repository contains the method sources, a command-line installer and the playbook site that documents every workflow with a Mermaid diagram.

## Requirements

- Node.js 22.22 or later. The CLI imports TypeScript files directly, which earlier versions cannot do.
- npm.
- Git, and network access to GitHub during install and update.
- At least one of Claude Code, Codex or OpenCode.

## Install

Clone the repository and install its dependencies:

```sh
git clone https://github.com/mattiamichini-design/jado.git
cd jado
npm ci
```

Then install JADO for your user:

```sh
npm run jado -- install --global
```

The command asks which tools to set up, prints the plan and waits for confirmation. To choose the tools up front, pass `--agents`:

```sh
npm run jado -- install --global --agents claude-code,codex,opencode
```

Keep the checkout after installing. Updates and refreshes run from it.

Start a new session in your AI tool afterwards. Tools load profiles and skills when a session starts, so an open session keeps its old instructions.

## Use it

Ask for design work as usual: a screen, a flow, a review, alternatives to compare. The instruction block that JADO adds tells the agent to read `~/.jado/instructions.md` and pick a route. You can also name the entry point, `jado-run`, or ask `ask-jado` which skill or workflow fits.

Each run has three settings: stage (`explore`, `refine`, `ship`), involvement (`autopilot`, `checkpoints`, `pair`) and budget (`lean`, `normal`, `deep`). Set project defaults with a line in the project instructions, for example `JADO defaults: stage=refine involvement=checkpoints budget=normal`, or change one during a run with `jado: autopilot`.

To print a route's plan without running it:

```sh
npm run jado:plan -- --workflow R05 --stage explore --budget lean
```

## Workflows

`jado/workflows.json` defines ten workflows: the router, eight routes and the setup workflow.

| ID | Route |
| --- | --- |
| `00-router` | Entry and route selection |
| `R01` | Patch |
| `R03` | Decide with the user |
| `R04` | Build |
| `R05` | Explore alternatives |
| `R07` | Staged delivery |
| `R08` | Council |
| `R09` | VariantHub on explicit request |
| `visual-research` | Patterns and style research |
| `setup-project` | Install or link JADO |

The playbook pages under `/docs/jado` describe each one. `jado/README.md` collects all the diagrams in one file.

## What a global install writes

| Path | Content |
| --- | --- |
| `~/.jado/` | The method: graph, policies, runtime packets, catalog, JADO skills, upstream skills, `instructions.md`, `migration.md` and the `install.json` manifest |
| `~/.claude/agents/jado-agent-*.md` | Claude Code profiles |
| `~/.claude/skills/` | Links to JADO and upstream skills |
| `~/.claude/CLAUDE.md` | A managed instruction block |
| `~/.codex/agents/jado-agent-*.toml` | Codex profiles |
| `~/.codex/config.toml` | A managed block that registers the Codex profiles |
| `~/.codex/AGENTS.md` | A managed instruction block, written to `AGENTS.override.md` instead when that file exists |
| `~/.config/opencode/agents/jado-agent-*.md` | OpenCode profiles |
| `~/.config/opencode/AGENTS.md` | A managed instruction block |
| `~/.agents/skills/` | Links to JADO and upstream skills, read by Codex and OpenCode |

Each row applies only to a tool you selected. The managed block sits between `# BEGIN JADO — managed design entry` and `# END JADO — managed design entry`, and the rest of each file stays as it was. A skill with the same name as a JADO skill is replaced; other skills in those folders are left alone.

The installer also removes the skills it manages from `~/.agents/.skill-lock.json`, so the `skills` CLI does not update them a second time.

The paths follow `CLAUDE_CONFIG_DIR`, `CODEX_HOME`, `XDG_CONFIG_HOME` and `XDG_STATE_HOME` when those point inside your home directory. To try the installer without touching your home directory, add `--user-root DIR` or `--dry-run`.

The profiles set a model for each tool, such as `claude-opus-5-5` for Claude Code and `gpt-6.1-sol` for Codex. They are defaults: edit the installed profile if your account uses other models. OpenCode profiles use the session model.

## Uninstall

```sh
npm run jado -- uninstall --global
```

Uninstall reads `~/.jado/install.json`, prints its plan and asks for confirmation. It disables a scheduled refresh, deletes the files JADO wrote that are unchanged since installation, removes the managed blocks and deletes files that only contained a block. A file you edited after installation is kept and listed in the plan. Folders left empty are removed.

Uninstall does not put back the entries the installer removed from `~/.agents/.skill-lock.json`. It also cannot restore a skill that JADO replaced during install: that skill exists only in the backup folder the install printed, under your system's temporary directory. Copy that folder somewhere safe after installing if you may want those skills again.

## Project installs

A local install copies the method into a repository, so the project carries its own procedures:

```sh
npm run jado -- install --local --target /path/to/project --agents claude-code
```

It writes `.jado/`, project-level profiles in `.claude/agents/`, `.codex/agents/` and `.opencode/agents/`, and an entry in the project instructions. An existing `.codex/config.toml` is left unchanged; the Codex registration to merge is saved in `.jado/agents/codex-registration.toml`. Local installs also accept other `skills` CLI agent IDs, which receive skills only.

A link points a project at the global install instead of copying it:

```sh
npm run jado -- link --target /path/to/project
```

Use a local install when the AI tool can only read files inside the repository.

Remove either with `npm run jado -- uninstall --local --target /path/to/project`.

When the project already has design instructions, ask the agent to complete the setup. It follows `migration.md` and the `jado-install` skill and shows a diff before replacing older design routing.

## Review a plan before applying it

Every command prints its plan first. For an AI-assisted install, ask for JSON, review it, then apply that exact plan:

```sh
npm run jado -- install --global --agents claude-code --dry-run --json
npm run jado -- install --global --agents claude-code --yes --revision HASH
```

`HASH` is the `revision` field of the reviewed plan. If a file changes between the two commands, the apply step stops. Each apply keeps a backup and restores the previous files if a write fails.

## Update

Pull the checkout first, then update the installation:

```sh
git pull
npm ci
npm run jado -- update --global
npm run jado -- update --local --target /path/to/project
```

`--component method` updates the method and keeps the installed upstream skills. `--component skills` updates the upstream skills and keeps the method. A global update does not change local installs.

## Refresh upstream skills

Refresh downloads new versions of the upstream skills and leaves the method alone:

```sh
npm run jado -- refresh --global --dry-run
npm run jado -- refresh --global --yes
```

On macOS you can schedule it:

```sh
npm run jado -- refresh --global --enable --every-days 7
npm run jado -- refresh --global --enable --every-days 7 --check-only
npm run jado -- refresh --global --disable
```

`--enable` writes a LaunchAgent at `~/Library/LaunchAgents/com.jado.refresh.<hash>.plist`. The settings and log are `~/.jado/refresh.json` and `~/.jado/refresh.log`. `--check-only` reports updates without applying them. The schedule runs from the checkout, so keep it in place.

## Upstream skills

`jado/skill-lock.json` lists the skills that come from other authors and the repository of each one, and the installer downloads the skills with the [`skills`](https://www.skills.sh/docs/cli) CLI during install, update and refresh. The lock does not pin commits, so each install gets the version the source repository serves at that moment. Each skill keeps its author's license. [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) lists the repositories and their licenses.

The skills JADO owns live in `.agents/skills/` and are covered by this repository's license.

## Playbook site

The playbook is a Next.js and Fumadocs site with the landing page at `/`, the docs at `/docs` and the workflow overview at `/workflows`. Each docs page is also served as Markdown at the same path with `.md`, and `/llms.txt` lists them.

```sh
npm run dev       # http://127.0.0.1:3000
npm run build
npm run start
```

To deploy on Vercel, import the repository and keep the default Next.js settings. Set `PLAYBOOK_BASE_URL` to the public URL, for example `https://jado.example.com`. It is read at build time for canonical links, social images and the sitemap. Without it the site uses the Vercel production domain, or `http://localhost:3000` outside Vercel.

## Change the method

Method changes are edits to the sources followed by regeneration:

- `jado/workflows.json`: routes, steps and conditions.
- `jado/agents.json`: the five `jado-agent-*` profiles and the procedures they load.
- `jado/policies/`: the stage, involvement and budget settings and the protected checks.
- `.agents/skills/`: the skills JADO owns.
- `content/docs/`: hand-written playbook pages.

Then run:

```sh
npm run jado:compile    # profiles, runtime packets, catalog, workflow pages and diagrams
npm run sync:catalog    # skill and agent catalog pages
npm run check
npm run build
```

`npm run check` starts with `jado:check`, which fails when a generated file no longer matches its source. It then validates content and Mermaid diagrams and runs the tests, lint and type checks. Do not edit generated files by hand.

`npm run jado:import` adds upstream skill references to the lock. By default it reads the skills installed in `~/.agents/skills`, the folder the `skills` CLI uses for global installs; pass `--skills-root DIR` to read another folder.

`npm run jado:configure` is optional and Codex-specific. It writes an MCP server entry to this checkout's `.codex/config.toml` (ignored by Git) that exposes the catalog and workflow validation as read-only tools.

## Repository layout

| Path | Content |
| --- | --- |
| `jado/` | Workflow graph, profiles, policies, generated runtime packets and the skill lock |
| `.agents/skills/` | Skills JADO owns |
| `.codex/agents/` | Generated Codex profiles for this checkout |
| `registry/` | Catalog data for the site and the installer |
| `scripts/jado/` | CLI, installer, compiler and MCP server |
| `content/docs/` | Playbook pages |
| `app/`, `components/`, `lib/` | Site code; the landing page is in `app/(landing)`, `components/landing` and `public/landing` |
| `templates/` | Reusable documents for product repositories |

## License

[MIT](LICENSE). Upstream skills keep their own licenses; see [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
