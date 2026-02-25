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

- **express-stream** – `renderExpressHomePage(name)` mixes async status lookups with `Readable.from` fragments before piping the builder into an Express `GET /` response. Run `bun test examples/express-stream/__tests__/example.test.ts` to exercise the helper.
- **fastify-stream** – `renderFastifyDocument(name)` resolves async highlights and streams a section, while `/stream` replies with headers plus the builder output. Its test asserts the dynamic name and highlight sentence appear in the HTML.
- **hono-stream** – `renderHonoPage(topic)` stitches async quotes with chunked sections so a Hono handler can return `new Response(builder.build(), ...)` from an edge-style route. Run `bun test examples/hono-stream/__tests__/example.test.ts` to validate the payload.

You can run the tests for all of the examples from the root of the project.

- `pnpm run test:examples` installs dependencies and runs both Node and Bun tests for each example within the examples/ folder.
