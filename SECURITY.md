# Security policy

The JADO installer writes files in your home directory or in a project, and runs the `skills` CLI to download skills from other repositories. The playbook is a separate Next.js site that serves read-only pages and a search endpoint.

Reports about the installer are the most useful: writes outside the paths listed in the README, changes to files outside the managed blocks, an uninstall that deletes a file you changed, or a way to make the installer run code from a source other than the repositories in `jado/skill-lock.json`.

A problem inside an upstream skill belongs to that skill's repository. [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md) links each one.

## Supported versions

Security fixes go into the latest commit on `main`. Pull the checkout and run `npm run jado -- update --global`, or the `--local` form for a project install, to get them.

## Report a vulnerability

Please do not open a public issue. Report it privately through GitHub instead: open the repository's Security tab and choose Report a vulnerability, or go to <https://github.com/mattiamichini-design/jado/security/advisories/new>. Include the steps to reproduce, the commit you tested and what an attacker could do.

The maintainer replies in the private advisory. Once a fix is on `main`, the advisory is published with credit to you, unless you ask to stay anonymous.
