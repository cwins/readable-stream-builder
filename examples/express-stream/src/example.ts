import express, { Express, RequestHandler } from 'express';
import { Server } from 'node:http';
import { Readable } from 'stream';
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';

async function fetchStatusMessage(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return 'ready to stream';
}

export function renderExpressHomePage(): Readable {
  const builder = new ReadablePromiseStreamBuilder([
    '<!doctype html><html><head><meta charset="utf-8"><title>Readable Stream Builder Example</title></head><body>',
  ]);

  builder.push('<h1>Readable Stream Builder Example</h1>');

  builder.push(
    async () => `<p>Status: ${await fetchStatusMessage()}</p>`,
    Readable.from([
      '<section><p>Mix plain strings, async factories, and nested streams.</p></section>',
    ]),
    '<footer>powered by readable-stream-builder</footer>'
  );

  builder.push('</body></html>');

  return builder.build();
}

export function createExpressApp(): Express {
  const app = express();
  const handler: RequestHandler = (_req, res) => {
    const stream = renderExpressHomePage();
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    stream.pipe(res);
  };

  app.get('/', handler);
  app.get('/testPage', handler);

  return app;
}

export type ExpressServer = {
  host: string;
  port: number;
  close: () => Promise<void>;
};

export async function createExpressServer(
  host = '127.0.0.1',
  port = 0
): Promise<ExpressServer> {
  const app = createExpressApp();
  const server = await new Promise<Server>((resolve, reject) => {
    const listeningServer = app.listen(port, host, () => resolve(listeningServer));
    listeningServer.once('error', reject);
  });
  const address = server.address();

  if (!address || typeof address === 'string') {
    throw new Error('Failed to determine Express server address.');
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
