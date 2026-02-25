import express, { Express } from 'express';
import { Readable } from 'stream';
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';

async function fetchStatusMessage(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 10));
  return 'ready to stream';
}

export function renderExpressHomePage(name = 'visitor'): Readable {
  const builder = new ReadablePromiseStreamBuilder([
    '<!doctype html><html><head><meta charset="utf-8"><title>',
    `Welcome ${name}`,
    '</title></head><body>',
  ]);

  builder.push(
    async () => `<p>${await fetchStatusMessage()}</p>`,
    Readable.from([
      '<section>',
      '<p>Fragments with Express look like tidy chunks.</p>',
      '</section>',
    ]),
    '<footer>powered by readable-stream-builder</footer>'
  );

  builder.push('</body></html>');

  return builder.build();
}

export function createExpressApp(): Express {
  const app = express();

  app.get('/', (req, res) => {
    const name = String(req.query.name ?? 'visitor');
    const stream = renderExpressHomePage(name);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    stream.pipe(res);
  });

  return app;
}
