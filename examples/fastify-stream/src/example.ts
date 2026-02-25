import Fastify, { FastifyInstance } from 'fastify';
import { Readable } from 'stream';
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';

async function fetchHighlights(): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 5));
  return ['fast', 'safe', 'streaming'];
}

export function renderFastifyDocument(name = 'visitor'): Readable {
  const builder = new ReadablePromiseStreamBuilder();

  builder.push('<!doctype html><html><head><meta charset="utf-8"><title>');
  builder.push(`Fastify stream for ${name}`);
  builder.push('</title></head><body>');

  builder.push(async () => {
    const highlights = await fetchHighlights();
    return `<p>Highlights: ${highlights.join(', ')}</p>`;
  });

  builder.push(
    Readable.from([
      '<section><h2>Why stream?</h2>',
      '<p>Fastify responds faster when data is piped.</p>',
      '</section>',
    ]),
    '<footer>built using readable-stream-builder</footer>'
  );

  builder.push('</body></html>');

  return builder.build();
}

export function createFastifyApp(): FastifyInstance {
  const app = Fastify();

  app.get('/stream', (request, reply) => {
    const name = String((request.query as { name?: string }).name ?? 'visitor');
    const stream = renderFastifyDocument(name);
    reply.headers({
      'Content-Type': 'text/html; charset=utf-8',
      'X-Example': 'fastify',
    });
    reply.send(stream);
  });

  return app;
}
