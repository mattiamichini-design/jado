---
name: jado-install
description: Install, link, update or uninstall JADO, refresh upstream skills, and migrate design instructions for the selected AI tools.
---

# Install and update JADO

Setup prepares files. The coordinator completes instruction migration and verifies which procedures and profiles the actual tool can use.

## 1. Resolve the branch, destination and tools

The request is one of four branches: **install** (global or local), **link** a project to the global method, **update** (including refresh), or **uninstall**. Use supplied choices; ask one missing decision at a time when necessary. Global installations live in `~/.jado`; local installations live in the product's `.jado`; linked projects use the global method and receive entry/migration information only.

Claude Code, Codex, and OpenCode have native adapters. Local setup also supports other `skills` CLI agent IDs for skills only; global setup supports the three native adapters. Tool selection does not choose models.

Read Git state, effective entry instructions, overrides, referenced Markdown, and nested instructions. For global setup also read the selected tools' user-level instructions. Preserve domain, components, tokens, accessibility, verification, Git, and release contracts.

Complete when branch, destination, tools, effective instruction chain, and migration scope are known.

## 2. Prepare and apply the concrete plan

In the JADO source checkout consult `npm run jado -- <command> --help`. Main planning entries:

```sh
npm run jado -- install --global --agents claude-code,codex,opencode --dry-run --json
npm run jado -- install --local --target /repo/product --agents claude-code --dry-run --json
npm run jado -- link --target /repo/product --dry-run --json
npm run jado -- update --global --dry-run --json
npm run jado -- update --local --target /repo/product --dry-run --json
npm run jado -- uninstall --global --dry-run --json
```

The plan records operations, conflicts, and revision. `--dry-run` leaves the destination unchanged but may download skills into temporary staging. Show the concrete replacement plan. Apply authorized mechanical changes with `--yes --revision HASH` using the inspected revision; replan if files change.

JADO takes priority over same-name skills in global and local installs, retaining replaced copies in backup. Third-party dependencies download upstream through the public skills CLI into staging; this repository holds references and attribution. JADO-owned procedures live in `.agents/skills`. Read the file identified by the installed catalog. Global JADO removes the generic manager's lock entries for packages it takes over, preserving unrelated entries.

Owned skills link individually to the installed method. Profiles are small real files in each tool's format; for Codex, setup also registers the roles in `config.toml`. Credentials, MCP, Paper, and Mobbin access retain their own configuration.

Complete when the inspected revision is installed or concrete conflicts are reported, with a known backup path.

## 3. Do the branch work

- **install** or **link** → [MIGRATION.md](MIGRATION.md): the entry block and the semantic migration of existing design instructions.
- **update** → [UPDATE.md](UPDATE.md): components, refresh cadence and preserved settings.
- **uninstall** → run the uninstall plan with `--dry-run`, show what it removes, which managed blocks it cuts and which changed files it keeps, then apply with `--yes --revision HASH`. It disables a scheduled refresh first. Instructions migrated by hand outside the managed blocks stay as they are: list them for the user.

Complete when the branch file's completion criterion holds.

## 4. Verify runtime access

Resolve links and catalog paths. For linked setup verify that the AI session can read the external method and procedures; CLI validation alone does not prove session permissions. Use a full local copy when external access is blocked; symlinks do not grant access.

When assigned, open a fresh tool session and plan a normal design request. Verify root, revision, route, and available roles. For Codex verify local configuration is enabled; the installer preserves preferences and leaves project trust to the tool.

Distinguish prepared files, migrated instructions, and verified delegation. If a role/tool is missing, report it and execute directly only when the route permits. Deliver destination, tool selection, revision, backup, checks, and remaining work.
