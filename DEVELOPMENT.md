# Development

## Install Dependencies

```sh
pnpm install
```

## Building
- `pnpm run build` compiles the TypeScript into `dist/`, which is the artifact the tests and published package run against.

## Testing the library

- `pnpm run test` runs unit tests for both Node and Bun to ensure compatibility with both, calling the following two commands in sequence `pnpm run test:node && pnpm run test:bun`.
- `pnpm run test:node` executes the Node built-in runner against `__tests__/node/stream-builder.test.mjs` to confirm the builder serializes strings, promises, factories, and `Readable` streams in order.
- `pnpm run test:bun` runs Bun's test runner on `__tests__/bun/stream-builder.test.ts` so you can verify compatibility with Bun environments.

The following command runs the Node tests with coverage and outputs a report which you will find in `coverage/lcov-report/index.html`

- `pnpm run coverage` wraps the Node test run in `c8` to produce an `lcov` report covering the library code only.

## Examples

Each folder under `examples/` is a standalone package that consumes `readable-stream-builder` via `file:../..`, ships a `src/example.ts`, and includes its own `__tests__/`.

- **express-stream** – `renderExpressHomePage()` mixes plain strings, async factories, and `Readable.from` fragments. `createExpressServer()` boots an Express server that serves the test HTML on `/testPage`.
- **fastify-stream** – `renderFastifyDocument()` uses the same mixed builder inputs. `createFastifyServer()` starts Fastify and serves the test HTML on `/testPage` with an example header.
- **hono-stream** – `renderHonoPage()` follows the same HTML contract with string/async/stream chunks. `createHonoServer()` runs a local Node bridge for Hono and serves the test HTML on `/testPage`.

You can run the tests for all of the examples from the root of the project.

- `pnpm run test:examples` installs dependencies and runs both Node and Bun tests for each example within the examples/ folder.
