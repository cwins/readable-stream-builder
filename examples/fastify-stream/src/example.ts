import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Readable } from 'stream';
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';

async function fetchHighlights(): Promise<string[]> {
  await new Promise((resolve) => setTimeout(resolve, 5));
  return ['ready to stream'];
}

export function renderFastifyDocument(): Readable {
  const builder = new ReadablePromiseStreamBuilder();

  builder.push('<!doctype html><html><head><meta charset="utf-8"><title>Readable Stream Builder Example</title></head><body>');
  builder.push('<h1>Readable Stream Builder Example</h1>');

  builder.push(async () => {
    const highlights = await fetchHighlights();
    return `<p>Status: ${highlights.join(', ')}</p>`;
  });

  builder.push(
    Readable.from([
      '<section><p>Mix plain strings, async factories, and nested streams.</p></section>',
    ]),
    '<footer>powered by readable-stream-builder</footer>'
  );

  builder.push('</body></html>');

  return builder.build();
}

export function createFastifyApp(): FastifyInstance {
  const app = Fastify();
  const handler = (
    _request: FastifyRequest,
    reply: FastifyReply
  ) => {
    const stream = renderFastifyDocument();
    reply.headers({
      'Content-Type': 'text/html; charset=utf-8',
      'X-Example': 'fastify',
    });
    reply.send(stream);
  };

  app.get('/', handler);
  app.get('/testPage', handler);

  return app;
}

export type FastifyServer = {
  host: string;
  port: number;
  close: () => Promise<void>;
};

export async function createFastifyServer(
  host = '127.0.0.1',
  port = 0
): Promise<FastifyServer> {
  const app = createFastifyApp();
  await app.listen({ host, port });
  const address = app.server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine Fastify server address.');
  }

  return {
    host,
    port: address.port,
    close: async () => {
      await app.close();
    },
  };
}
