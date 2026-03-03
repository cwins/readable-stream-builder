import { Hono } from 'hono';
import type { Context } from 'hono';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'stream';
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';

async function fetchQuote(): Promise<string> {
  return 'ready to stream';
}

export function renderHonoPage(): Readable {
  const builder = new ReadablePromiseStreamBuilder([
    '<!doctype html><html><head><meta charset="utf-8"><title>Readable Stream Builder Example</title></head><body>',
  ]);

  builder.push('<h1>Readable Stream Builder Example</h1>');
  builder.push(async () => `<p>Status: ${await fetchQuote()}</p>`);
  builder.push(
    Readable.from([
      '<section><p>Mix plain strings, async factories, and nested streams.</p></section>',
    ])
  );
  builder.push('<footer>powered by readable-stream-builder</footer>');
  builder.push('</body></html>');

  return builder.build();
}

export function createHonoApp(): Hono {
  const app = new Hono();
  const handler = (_c: Context) => {
    const stream = renderHonoPage();
    return new Response(stream, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  };

  app.get('/', handler);
  app.get('/testPage', handler);

  return app;
}

export type HonoServer = {
  host: string;
  port: number;
  close: () => Promise<void>;
};

export async function createHonoServer(host = '127.0.0.1', port = 0): Promise<HonoServer> {
  const app = createHonoApp();
  const server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? host}`);
    const headers = new Headers();

    Object.entries(request.headers).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => headers.append(key, entry));
        return;
      }

      if (typeof value === 'string') {
        headers.set(key, value);
      }
    });

    const honoResponse = await app.fetch(
      new Request(url, {
        method: request.method,
        headers,
      })
    );

    response.statusCode = honoResponse.status;
    honoResponse.headers.forEach((value, key) => {
      response.setHeader(key, value);
    });

    if (!honoResponse.body) {
      response.end();
      return;
    }

    for await (const chunk of honoResponse.body as AsyncIterable<Uint8Array>) {
      response.write(chunk);
    }

    response.end();
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, resolve);
  });

  const address = server.address() as AddressInfo | string | null;
  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine Hono server address.');
  }

  return {
    host,
    port: address.port,
    close: async () =>
      await new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
  };
}
