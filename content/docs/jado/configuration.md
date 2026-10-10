---
title: "Install and configure JADO"
description: "Global or local installation, project linking, updates, removal and instruction migration."
status: "observed"
lastReviewed: "2026-10-10"
---

## Prepare the source

Clone the repository, use Node.js 22.22 or later and install dependencies:

```sh
git clone https://github.com/mattiamichini-design/jado.git
cd jado
npm ci
```

`npm run jado:compile` regenerates the method artifacts. To browse the playbook, run `npm run dev` and open `/docs`; each workflow contains a Mermaid map.

## Choose where to use JADO

Install JADO globally to make the method available in every project. Choose a complete local copy when the project must carry its own procedures, or when the AI tool can only read inside the repository. Linking makes a project's use of the global copy explicit.

```sh
npm run jado -- install --global --agents claude-code,codex,opencode
npm run jado -- install --local --target /repo/product --agents claude-code
npm run jado -- link --target /repo/product
```

Claude Code, Codex and OpenCode have native adapters, and global setup supports these three. Local setup also accepts other `skills` CLI IDs, which receive skills only.

For AI-assisted installation, choose the mode and tools in chat. The main agent follows [jado-install](/docs/automation/skills/jado-install) and the [setup route](/docs/jado/setup-project).

The profiles carry model settings for each tool, for example `claude-opus-5-5` in Claude Code and `gpt-6.1-sol` in Codex. They are defaults: change them in the tool-specific profile if your account uses other models. OpenCode profiles inherit the session model. [Roles](/docs/jado/roles) lists the defaults.

## What is prepared

| Mode | Method | Skills, profiles and instructions |
| --- | --- | --- |
| Global | `~/.jado` | User-level profiles, linked skills and a managed block in each tool's user instructions |
| Local | `.jado/` in the repository | A self-contained copy with relative links, project-level profiles and a project entry point |
| Link | Reference to the global copy | A managed block and `.jado/` entry files; no copies of skills or profiles |

A global install writes these files:

| Tool | Profiles | Skills | Instructions |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/agents/jado-agent-*.md` | `~/.claude/skills` | `~/.claude/CLAUDE.md` |
| Codex | `~/.codex/agents/jado-agent-*.toml`, registered in `~/.codex/config.toml` | `~/.agents/skills` | `~/.codex/AGENTS.md`, or `AGENTS.override.md` when present |
| OpenCode | `~/.config/opencode/agents/jado-agent-*.md` | `~/.agents/skills` | `~/.config/opencode/AGENTS.md` |

A local install writes the project-level equivalents: `.claude/agents/`, `.codex/agents/` and `.opencode/agents/`. It keeps an existing `.codex/config.toml` unchanged and saves the Codex registration to merge in `.jado/agents/codex-registration.toml`.

The method copy contains the graph, policies, catalog, procedures and `instructions.md`. `install.json` records destination, tools, revision and managed files; `migration.md` guides the review of existing instructions. Globally, `dependencies.json` records managed dependencies and their lock.

JADO links each owned skill individually and leaves other skills in the same folders untouched. Profiles are written as small regular files, so they work in tools with different symlink support.

Global entry points respect `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, `XDG_CONFIG_HOME` and the lock indicated by `XDG_STATE_HOME` when they stay inside the user's home directory. A path outside it requires local setup or a configuration review.

Credentials, connectors, MCP servers and applications required by skills follow their own configurations. Profile files do not prove that a session has loaded them.

## External skills and updates

Setup downloads upstream skills from their authors' repositories and replaces selected same-name skills, keeping backups and checking revisions. Unrelated skills stay in place. JADO keeps its dependencies in `.jado/skills/` with a lock in `.jado/jado/skill-lock.json`; global mode uses `~/.jado`. JADO removes the skills it manages from `~/.agents/.skill-lock.json`, so the generic skills CLI does not update them a second time. JADO-owned procedures live in `.agents/skills/`; this repository does not contain copies of other authors' skills.

```sh
npm run jado -- update --global
npm run jado -- update --local --target /repo/product
npm run jado -- update --global --component method
npm run jado -- update --local --target /repo/product --component skills
```

The full command updates the method and upstream skills. `method` keeps installed external skills; `skills` updates upstream procedures and references and keeps the method. JADO-owned skills update with the method and come from the source checkout: pull the checkout with Git before updating an installation.

Global updates do not touch complete local copies. A linked project follows the global method. Record the revision at the start of an assignment and verify the method in a new session after updating.

## Review and apply the plan

```sh
npm run jado -- install --global --agents claude-code --dry-run --json
npm run jado -- install --global --agents claude-code --yes --revision HASH
```

`HASH` is the revision of the plan you reviewed. Preparation may download packages into temporary folders and leaves the destination unchanged. If a file changes in the meantime, applying fails. Writes keep a backup with `recovery.json` and restore modified content on error. The CLI prints the backup path.

Reinstalling the same revision keeps files and ownership. Method updates keep adopted external skills. Compare managed files you customized before updating.

## Remove an installation

```sh
npm run jado -- uninstall --global
npm run jado -- uninstall --local --target /repo/product
```

Uninstall reads the manifest in `.jado/install.json`. It first disables a scheduled refresh, then removes the JADO files that are unchanged since installation and cuts the managed blocks from instruction files. Files changed since installation are kept and listed. It prints its plan before applying, like the other commands.

## Complete the instructions

Global mode and linking add a delimited block to the effective instructions and keep the surrounding text. The CLI can update the block while it stays intact; editing its content stops the command. For Codex, an existing `AGENTS.override.md` receives the block.

Local setup creates a short entry point when none exists and keeps existing Markdown. For Claude Code, it creates the `@AGENTS.md` reference when a new entry point is needed. Always read referenced documents and nested rules too.

Assisted migration replaces conflicting design routers and design assignments and keeps domain, design system, accessibility, verification, Git and release rules. The main agent presents the diff before replacing anything. The CLI-added block is an entry point: conflicting instructions still need resolution.

You can use this prompt:

```text
Complete JADO setup. Read migration.md in the installed copy and follow
jado-install. Check the entry point actually read, overrides and referenced
Markdown. Prepare the diff to replace old design routers, preserving
product contracts and instructions for other activities.
```

With UX Planner, keep the location and format of project documents. Flows, journeys and stories stay in product documentation.

## Verify access and delegation

Linking uses the current user's `~/.jado` and stores a portable reference in the repository. The CLI checks that files are readable for the installation process; the AI session must also check its own permissions and the procedures it needs.

Each tool controls reads outside the project differently. Claude Code may ask for approval of external imports or restrict reads outside working directories. Codex may restrict reads to certain folders. OpenCode controls external access with `external_directory`. A path in instructions or a symlink inside the repository does not grant access to an external file. When reads are blocked, use complete local setup.

For Codex, also check that project configuration is enabled. In a new session, try a normal design request with a plan: root, revision, route and roles must match the selected copy. Use the complete local copy when present, otherwise the global one. The main agent passes that root in delegations.

## Dependency refresh

```sh
npm run jado -- refresh --global --enable --every-days 7
npm run jado -- refresh --global --enable --every-days 7 --check-only
npm run jado -- refresh --global --disable
npm run jado -- refresh --local --target /repo/product --dry-run
npm run jado -- refresh --local --target /repo/product --yes
```

The schedule is opt-in, from 1 to 365 days. On macOS, `--enable` writes a LaunchAgent at `~/Library/LaunchAgents/com.jado.refresh.<hash>.plist`; on other systems, run updates manually. `--check-only` reports available updates without applying them. Status and logs stay in the installed copy; an error does not postpone the next attempt. The source checkout and its dependencies must stay available. Refresh does not pull, push or update the method, and builds, tests and installation never enable it.

[Apple LaunchAgent](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html).

## Skill references

`jado:import` reads the selected environment and imports only selected upstream references. It does not copy packages into the repository or change the originals. The compiler and catalog work on owned procedures and dependency metadata: builds and CI do not download external skills. Installation and refresh use the public skills CLI and keep the resources in the downloaded package.

## Execution modes

Choose solo, macro or specialists in the request, or prepare a plan with `npm run jado:plan -- --workflow R04 --mode macro`. The default mode is macro. See [dials, modes and limits](/docs/jado/execution): conditions, evidence, budget and independent reviews remain part of the contract. Installed files do not certify profile use in a session.

## MCP server and Codex export

The stdio MCP server exposes `get_catalog`, `get_workflows` and `validate_workflow`, all read-only. It uses the specified checkout and does not start agents or change sources.

```sh
npm run jado:configure
npm run jado:configure -- --export DIR
```

`jado:configure` is optional and Codex-specific: it writes the MCP server entry to the checkout's own `.codex/config.toml`. Open a new chat to load it. `--export DIR` writes the Codex TOML profiles to a folder for manual copying.

## Changes and recovery

A method change happens on a branch: the AI changes sources, regenerates with `jado:compile` and `sync:catalog`, runs `check` and `build`, and prepares a PR. Diagrams in the playbook and `jado/README.md` are generated views. Protected checks validate references, routes and review independence.

The site exposes no workflow write APIs. To restore the method, check out an earlier Git revision and regenerate the artifacts.

Official sources: [skills CLI](https://www.skills.sh/docs/cli), [Claude Code subagents](https://code.claude.com/docs/en/sub-agents), [OpenCode agents](https://opencode.ai/docs/agents/), [reading AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md#how-codex-discovers-guidance), [skill loading](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills), [Codex subagents](https://learn.chatgpt.com/docs/agent-configuration/subagents), [advanced configuration](https://learn.chatgpt.com/docs/config-file/config-advanced).

External reading: [Claude Code imports](https://code.claude.com/docs/en/memory#import-additional-files), [Codex permissions](https://learn.chatgpt.com/docs/app-server#sandbox-read-access-readonlyaccess), [OpenCode permissions](https://opencode.ai/docs/permissions/#external-directories).
