import { Hono } from 'hono';
import { Readable } from 'stream';
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';

async function fetchQuote(): Promise<string> {
  return 'Streaming keeps latency low.';
}

export function renderHonoPage(topic = 'streaming'): Readable {
  const builder = new ReadablePromiseStreamBuilder([
    '<!doctype html><html><head><meta charset="utf-8"><title>',
    `${topic} with Hono`,
    '</title></head><body>',
  ]);

  builder.push(async () => `<p>${await fetchQuote()}</p>`);
  builder.push(
    Readable.from([
      '<main><p>Edge-friendly responses can just await the builder.</p>',
      '</main>',
    ])
  );
  builder.push('</body></html>');

  return builder.build();
}

export function createHonoApp(): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const name = c.req.query('name') ?? 'friend';
    const stream = renderHonoPage(name);
    return new Response(stream, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  });

  return app;
}
