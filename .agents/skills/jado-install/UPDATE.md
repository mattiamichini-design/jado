# Update

Read this for an **update** or a refresh. Refresh is not a product-directory migration; an intact JADO block is replaced in place, and edits inside it stop the command (see [MIGRATION.md](MIGRATION.md) to resolve them).

`update` refreshes method and upstream skills. `--component method` preserves installed external skills; `--component skills` preserves the method while updating upstream skills and references. Linked projects update their global installation.

The generic skill manager retains unrelated skills. JADO dependencies use update or refresh. On explicit assignment enable a cadence with `npm run jado -- refresh --global --enable --every-days 7` or the local destination; `--check-only` checks without applying, and `--disable` stops it. Native scheduling uses macOS launchd and needs the source checkout with dependencies available. Refresh updates neither Git nor the method. Owned procedures arrive through the Git-updated source checkout and an installation update. Start a fresh session after updates.

Preserve the requested execution mode, or `executionModes.default` when absent. Macro agents group procedures; independent reviews keep separate read-only instances. Commands retain backups/fingerprints, detect concurrent changes, and roll back writes on error. Unrelated skills/profiles remain with their manager.

Complete when the requested component/cadence has an observed result and backup location. Commit, push, merge, and automation changes need their own task authorization.

