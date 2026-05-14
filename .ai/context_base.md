# rustpress-sdk-js — AI Context

> **Purpose**: Orient an AI agent to this repo without reading the whole tree. Pair with the RustPress organisation context in `rustpress-core-base/.ai/context/CONTEXT_BASE.md`.

## Project

`rustpress-sdk-js` is the **official plain-JavaScript SDK for RustPress**, published to npm as `rustpress-sdk`. It targets users who don't want a TypeScript toolchain — pure CommonJS, JSDoc `@typedef` blocks for editor hints, no compile step. Plugin/theme/app authors who pick this SDK get the same API shape as `rustpress-sdk-rs` / `rustpress-sdk-ts` / `rustpress-sdk-py`.

This is the **smallest and riskiest** of the four SDKs per the audit. API parity with the other three SDKs is a hard requirement.

> Not to be confused with `@rustpress/sdk` (the TypeScript SDK in `rustpress-sdk-ts`). The npm name here is plain `rustpress-sdk` — the same name the Python SDK uses on PyPI. Naming collision is intentional and avoided by ecosystem (npm vs PyPI).

## Tech stack

- **Language**: JavaScript (CommonJS), Node ≥16
- **Package**: `rustpress-sdk` v1.0.0, MIT
- **No build step** — `src/*.js` is shipped as-is
- **Test**: `jest` (testEnvironment: node)
- **Lint**: `eslint`
- **Docs**: `jsdoc` (`npm run docs`)
- **Binary**: ships a `rustpress` CLI (`bin/rustpress.js`) for scaffolding

## Directory layout

```
rustpress-sdk-js/
├── package.json        # rustpress-sdk, CJS, jest config inline
├── README.md           # uses require() consistently
├── LICENSE             # MIT
├── src/
│   ├── index.js        # 844 lines — full public API (CJS only)
│   ├── hooks.js        # subpath export target
│   └── plugins.js      # subpath export target
├── bin/
│   └── rustpress.js    # CLI scaffolder
└── __tests__/          # jest suite (uncommitted; being added)
```

## Public API / what this repo exposes

`package.json#exports`:
```
"."          → ./src/index.js
"./hooks"    → ./src/hooks.js
"./plugins"  → ./src/plugins.js
"./package.json"
```

API shape (from the audit, line numbers in `src/index.js`):

- **Constants** (14–44)
- **Functions/classes**: `defineHook`, `beforeHook`, `afterHook`, `BasePlugin`, `BaseTheme`, `BaseApp`, `parseTrigger`, `buildTrigger`, `isValidTrigger`, `sleep`, `retry`, `debounce`, `throttle`, `deepClone`, `deepMerge`, `generateId`, `formatDate`
- **Helpers**: `SimpleHttpClient`, `SimpleEventEmitter` (762–797)
- **Exports**: CommonJS `module.exports` block at 803–844

JSDoc `@typedef` blocks give editor type hints without TypeScript.

## How to build / test

```bash
npm install
npm test                 # jest
npm run test:coverage
npm run lint             # eslint src
npm run docs             # jsdoc → ./docs/
# No build — npm publish ships src/ + bin/ as-is (package.json#files)
```

CI: `rustpress-net/rustpress-core-devops/actions/ci-node@main`.

## Cross-repo dependencies

- **Depends on**: no other RustPress repo.
- **Depended on by**: every JS-without-TS plugin/theme/app built on RustPress.
- **Coordinated with**: `rustpress-sdk-rs`, `rustpress-sdk-ts`, `rustpress-sdk-py` for API parity.

## Conventions

- **License**: MIT (align to `MIT OR Apache-2.0` before publish to match org standard)
- **Commits**: Conventional Commits
- **Module system**: CommonJS only today. If you add ESM, do it via a real dual build (`exports.import` / `exports.require`) — don't half-do it.
- **Public API stability**: v1.0 — every CJS export is a commitment.

## Status

- Release readiness: **🟠 RISKY** (see `AUDIT-sdks.md`) — smallest, fewest tests, unclear module strategy
- `package.json` stamped at v1.0.0, not yet published to npm.
- Phase: alpha hardening — needs test suite and a module-system decision.

## Known issues / TODOs

From `AUDIT-sdks.md` (JavaScript SDK section):

- **P0**: Zero tests on `main`. jest is configured but `src/` has no `.test.js`/`.spec.js` files. Need ~40+ cases. The uncommitted `__tests__/` directory is the start.
- **P0**: CJS vs ESM ambiguity — the audit flagged that the `module` field on `package.json` is **not present** here (only `main`) but the broader concern is unclear ESM story. Decision needed before publish: stay CJS-only, or add an ESM build (e.g. via `rollup` or `esbuild` to `dist/`).
- **P1**: Add JSDoc validation in CI so `@typedef` drift is caught.
- **P1**: Repo URL in `package.json` still references `github.com/rustpress/rustpress-sdk-js` (should be `rustpress-net/`).
- **P1**: Align license to `MIT OR Apache-2.0`.
- **P1**: Bump Node engine floor to ≥18 to match the TS SDK (today this repo says ≥16; Node 16 is EOL).

## When working in this repo

- Stay in CommonJS until the ESM decision is made and shipped together. Don't mix `import`/`require` in `src/`.
- Every public function needs a JSDoc block with `@param`, `@returns`, and a usage `@example`. Editor IntelliSense relies on this — there's no `.d.ts`.
- Keep parity with the three sibling SDKs. Public-surface changes here trigger coordinated PRs in `rustpress-sdk-rs`, `rustpress-sdk-ts`, `rustpress-sdk-py`.
- Adding a subpath export (e.g. `./database`) requires: a new file in `src/`, an `exports` entry in `package.json`, AND a parallel entry in `rustpress-sdk-ts`'s package.json — drift between TS and JS subpaths confuses users.
- Don't add runtime deps. The SDK should be `npm install rustpress-sdk` followed by zero transitive installs.
