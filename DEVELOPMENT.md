# Development

## Install Dependencies

```sh
pnpm install
```

## Building
- `pnpm run build` compiles the TypeScript into `dist/`, which is the artifact the tests and published package run against.

## Testing the library

- `pnpm run test` runs unit tests for both Node and Bun to ensure compatibility with both, calling the following two commands in sequence `pnpm run test:node && pnpm run test:bun`.
- `pnpm run test:node` runs Vitest on `__tests__/stream-builder.test.ts` using Node and collects coverage.
- `pnpm run test:bun` runs the same Vitest file using Bun via `bunx --bun vitest` with coverage disabled.

## Examples

Each folder under `examples/` is a standalone package that consumes `readable-stream-builder` via `file:../..`, ships a `src/example.ts`, and includes its own `__tests__/`.

- **express-stream-basic** – `renderExpressHomePage()` mixes plain strings, async factories, and `Readable.from` fragments. `createExpressServer()` boots an Express server that serves the test HTML on `/testPage`.
- **fastify-stream-basic** – `renderFastifyDocument()` uses the same mixed builder inputs. `createFastifyServer()` starts Fastify and serves the test HTML on `/testPage` with an example header.
- **hono-stream-basic** – `renderHonoPage()` follows the same HTML contract with string/async/stream chunks. `createHonoServer()` runs a local Node bridge for Hono and serves the test HTML on `/testPage`.
- **express-stream-react** – demonstrates prefetching page and product promises, streaming head markup first, then piping React SSR (`renderToPipeableStream`) through a `PassThrough` source using `onShellReady` and `onAllReady`.
- **fastify-stream-react** – mirrors the React streaming flow in Fastify, with prefetch promises feeding a shell-first stream builder and React SSR piped through `onAllReady`.
- **hono-stream-react** – mirrors the React streaming flow in Hono, using a Node bridge server for tests while keeping the same shell-first + React stream composition.

You can run the tests for all of the examples from the root of the project.

- `pnpm run examples:install` installs dependencies for the `examples/` workspace.
- `pnpm run examples:test` runs the shared Vitest suite for all example packages from the `examples/` workspace.
- `pnpm run examples:clean` removes `node_modules` from all example workspace packages.
