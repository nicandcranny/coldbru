# Contributing to ColdBru

Thanks for wanting to improve ColdBru.

ColdBru is an independent fork of Bruno, with a focus on navigation, Git tooling, and workspace UX. Small, focused contributions are the easiest to review and the easiest to merge.

## Before You Start

- Use Node.js 22 or the latest LTS version.
- Install dependencies with `npm i --legacy-peer-deps`.
- Read [CODING_STANDARDS.md](CODING_STANDARDS.md) before making larger changes.

## Running ColdBru Locally

Install dependencies:

```bash
npm i --legacy-peer-deps
```

Start the app:

```bash
# terminal 1
npm run dev:web

# terminal 2
npm run dev:electron
```

Or run both together:

```bash
npm run dev
```

If you want to isolate local Electron app data while developing:

```bash
ELECTRON_USER_DATA_PATH=$(realpath ~/Desktop/coldbru-test) npm run dev:electron
```

## Testing

Run the app package tests:

```bash
npm test --workspace=packages/coldbru-app
```

Run the Electron package tests:

```bash
npm test --workspace=packages/coldbru-electron
```

Run all workspace tests:

```bash
npm test --workspaces --if-present
```

Lint and auto-fix:

```bash
npm run lint:fix
```

## What Makes a Good Contribution

- Keep pull requests focused on one change.
- Prefer user-facing clarity over clever implementation.
- Include tests when behavior changes in a meaningful way.
- If a change affects UX, add screenshots or a short recording when possible.
- Keep ColdBru branding and Bruno attribution accurate.

## Pull Requests

Helpful pull requests usually include:

- a short description of the problem
- what changed
- how you tested it
- screenshots or video for UI changes

Branch naming suggestions:

- `feat/<name>`
- `fix/<name>`
- `docs/<name>`

## Questions and Ideas

If you are not sure whether something should be an issue, bug report, or feature request, use GitHub Discussions first:

- [ColdBru Discussions](https://github.com/nicandcranny/coldbru/discussions)
