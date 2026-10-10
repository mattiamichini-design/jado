# Contributing to JADO

Bug reports, fixes and small improvements are welcome. For a larger change, such as a new route, a new profile or a change to how the installer writes files, open an issue first so the approach is agreed before you write the code.

## Set up

You need Git and Node.js 22.22 or later. `.nvmrc` pins the version for nvm and similar tools.

```sh
git clone https://github.com/mattiamichini-design/jado.git
cd jado
npm ci
npm run dev
```

The playbook runs at http://127.0.0.1:3000. The Next.js version in this repository can differ from what you know: read `node_modules/next/dist/docs/` before you change Next.js APIs.

`AGENTS.md` describes which files are sources and which are generated. Edit the sources, then regenerate:

```sh
npm run jado:compile
npm run sync:catalog
```

## Test the installer safely

Never point a test install at your own home directory. Use `--dry-run`, or `--user-root` with a temporary folder:

```sh
mkdir -p /tmp/jado-home
npm run jado -- install --global --agents claude-code,codex,opencode --user-root /tmp/jado-home --yes
npm run jado -- uninstall --global --user-root /tmp/jado-home --yes
```

The install step downloads the upstream skills, so it needs network access.

## Checks

Run these before you open a pull request. CI runs the same pair.

```sh
npm run check
npm run build
```

`check` verifies that generated files match their sources, validates content and Mermaid diagrams, and runs the tests, lint and type checks.

## Pull requests

- Keep each pull request to one change, and explain what it changes and why.
- Commit the source change together with the files it regenerates.
- Add or update tests for installer or validator behaviour you change.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages, for example `fix(installer): keep file modes when cutting a managed block`.
- Write documentation and skills in English, and describe how things work now. Apply the `writing-for-agents` skill to text that agents read.
- Do not copy upstream skills into the repository. Add them as references with `npm run jado:import`.
- JADO is distributed through this GitHub repository only. Do not add publishing to a package registry.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE). Everyone taking part is expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).
