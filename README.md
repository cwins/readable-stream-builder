# readable-stream-builder

Basic utility to create a `Readable` stream from other strings or streams. Under the hood, this just uses an async generator function with a little bit of logic, and returns a `Readable` that can be piped into a `Response` (or whatever else).

## Why?

When dealing with server-side rendering, stitching together the final HTML can often be awkward, ugly, and brittle. Many times it can lead to mixed async data fetching, string concatenation, and response-handling logic. That leads to several pain points:

- Hard-to-follow control flow: data fetching patterns and string concatenation patterns tend to influence each other in bad ways.
- Tight coupling to `Response`: many solutions write directly to the response, scattering I/O logic across rendering code.

`readable-stream-builder` exists to make composition of streamed HTML (or any streamed text) simple and explicit. It accepts a mixed list of sources — plain strings, Node `Readable` streams, promises that resolve to either a string or `Readable` stream. It also accepts factory functions (which can be sync or async) that ultimately resolve to a string or `Readable` stream.

These sources can be passed in during instantiation, added later with the `push()` method, or a mix of both.

The `build()` method returns a single `Readable` that you can feed to server `Response`. Behind the scenes, this method kicks off the chain of sources asyncronously, but resolves them in order to the `Readable` stream that was returned.

**Benefits:**

- Compose synchronously and asynchronously without manual orchestration.
- Keep most of your render code server and framework agnostic by interacting with the stream builder instead of the response.
- Keep rendering logic declarative and local to components.
- Stream content as it becomes available to reduce latency and memory usage.

### Minimal example:

```js
import { Readable } from 'stream';
import { createReadStream } from 'fs';
import { ReadablePromiseStreamBuilder } from './src/index.js';

// ...
const handler = () => {
    const parts = [
        '<!doctype html>',
        '<html>',
        '<head>',
        async () => {
            const title = await fetchTitle();

            return `<title>${title}</title>`
        },
        '</head>',
        '<body>',
        '<div id="root">',
        () => createReadStream('./dummy.txt', { encoding: 'utf8' }),
        '</div>',
        '</body>',
        '</html>'
    ];

    const builder = new ReadablePromiseStreamBuilder(parts);

    return new Response(
        builder.build(),
        { headers: { 'content-type': 'text/html; charset=utf-8' } }
    );
}
```

## Installation

```sh
# pnpm
pnpm add readable-stream-builder

# bun
bun add readable-stream-builder

# npm
npm install readable-stream-builder

# yarn
yarn add readable-stream-builder
```

## Usage

### Import

```js
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';
```

### API

- `new ReadablePromiseStreamBuilder(sources?: StreamSource[])` — create a builder with an optional initial list of sources.
- `push(...sources: StreamSource[])` — add more sources after construction.
- `build()` — returns a Node `Readable` that yields content from each source in order.

`StreamSource` may be any of:

- `string`
- `Readable` (Node stream)
- `Promise<string>` or `Promise<Readable>`
- a factory function that returns any of the above (can be `async`)

This makes it easy to mix static strings, async-rendered fragments, and file/stream content without manual orchestration.

**Notes:**

- Use async factory functions to fetch data just-in-time; the builder will resolve them in order.
- When including file streams (e.g., `createReadStream()`), the file's chunks are forwarded to the resulting `Readable`.
- Keep fragments small and composable to get the most benefit from streaming (reduced latency, lower peak memory).

### Examples

#### Simple strings, promises, non-blocking data fetch, and inline render call

```js
// fetch-style handler (Bun / Cloudflare Workers / edge runtimes that support `Response`)
function handler() {
    // ... other routing logic hidden for simplicity

    // fetch title early, but don't wait here
    const titlePromise = fetchTitle();

    const parts = [
        '<!doctype html>',
        '<html>',
        titlePromise.then((title) => `<head><title>${title}</title></head>`), // non-blocking promise chain
        '<body>',
        renderAppHtml(), // sync or async render
        '</body>',
        '</html>'
    ];

    const builder = new ReadablePromiseStreamBuilder(parts);

    return new Response(builder.build(), { headers: { 'content-type': 'text/html; charset=utf-8' } });
}
```

#### Simple strings and lazy render with factory function

```js
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';
// ... imports

// Node.js http server with stream piped to the response
createServer((req, res) => {
    // ... other routing logic hidden for simplicity

    const builder = new ReadablePromiseStreamBuilder();
    builder.push('<!doctype html><html><body>');
    builder.push(async () => {
        const { html } = await renderApp();

        return html;
    });
    builder.push('</body></html>');

    const stream = builder.build();

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    stream.pipe(res);
}).listen(3000);
```

#### Basic HTML template with React renderToPipeableStream and suspense render

```js
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';
// ... imports

// fetch-style handler (Bun / Cloudflare Workers / edge runtimes that support `Response`)
function handler() {
    // ... other routing logic hidden for simplicity

    const builder = new ReadablePromiseStreamBuilder();
    const [openingHtml, closingHtml] = htmlTemplate.split('<!--ssr-outlet-->');

    builder.push(openingHtml);

    // create a passthrough stream to receive the piped React stream
    const appStream = new PassThrough();

    builder.push(appStream, closingHtml);

    // renderToPipeableStream doesn't return an actual stream
    const { pipe } = renderToPipeableStream(<App />, {
        // onShellReady is called when rendering is complete for any content above the first Suspense boundary
        onShellReady() {
            pipe(appStream);
        },
        onShellError(error) {
            appStream.write('<div>gone fishing</div>');
            appStream.end();
        }
    });

    return new Response(builder.build(), { headers: { 'content-type': 'text/html; charset=utf-8' } });
};
```

#### Conditional stream with rendered head and lazy rendered body

```js
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';
// ... imports

// Node.js http server with stream piped to the response
createServer((req, res) => {
    // ... other routing logic hidden for simplicity

    // don't block setup with async call
    const routeResult = verifyUserRequest(req);

    const builder = new ReadablePromiseStreamBuilder(['<!doctype html><html>']);
    builder.push(async () => {
        const { html } = await renderHead();

        return html;
    });
    builder.push(async () => {
        const { html } = await renderApp();

        return html;
    });
    builder.push('</html>');

    // block response until we know we are good to continue
    const { status } = await routeResult;

    if (status === 'OK') {
        // pre-checks are good, start the response
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        builder.build().pipe(res);
    }
    else {
        // pre-checks failed, don't invoke the stream builder
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end();
    }
    
}).listen(3000);
```
