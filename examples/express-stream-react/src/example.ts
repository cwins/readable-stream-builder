import express, { Express, Request, RequestHandler } from 'express';
import { Server } from 'node:http';
import { PassThrough, Readable } from 'node:stream';
import { ReadablePromiseStreamBuilder } from 'readable-stream-builder';
import { fetchPageContext } from './data-fetchers/fetch-page-context.ts';
import { fetchProductInfo } from './data-fetchers/fetch-product-info.ts';
import { renderApp } from './render-app.ts';
import type { PageContext } from './types.ts';

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

function renderDocumentStart(pageContext: PageContext): string {
  return [
    '<!doctype html>',
    '<html>',
    '<head>',
    '<meta charset="utf-8">',
    `<title>${escapeHtml(pageContext.title)}</title>`,
    `<meta name="description" content="${escapeHtml(pageContext.description)}">`,
    `<meta name="robots" content="${escapeHtml(pageContext.robots)}">`,
    `<link rel="canonical" href="${escapeHtml(pageContext.canonicalPath)}">`,
    '</head>',
    '<body>',
    '<main id="root">',
  ].join('');
}

export function renderExpressReactPage(request: Request): Readable {
  const requestUrl = request.originalUrl || request.url || '/';
  const pageContextPromise = fetchPageContext(requestUrl);
  const productInfoPromise = fetchProductInfo(requestUrl);
  const builder = new ReadablePromiseStreamBuilder();

  builder.push(
    async () => renderDocumentStart(await pageContextPromise),
    async () => `<h1>${escapeHtml((await pageContextPromise).title)}</h1>`,
    async () => {
      const [pageContext, productInfo] = await Promise.all([
        pageContextPromise,
        productInfoPromise,
      ]);
      const appStream = new PassThrough();

      await renderApp({
        pageContext,
        productInfo,
        requestPath: request.path || request.url,
        responseStream: appStream,
      });

      return appStream;
    },
    '</main><footer>powered by readable-stream-builder</footer></body></html>'
  );

  return builder.build();
}

export function createExpressReactApp(): Express {
  const app = express();
  const handler: RequestHandler = (req, res) => {
    const stream = renderExpressReactPage(req);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    stream.pipe(res);
  };

  app.get('/', handler);
  app.get('/testPage', handler);

  return app;
}

export type ExpressReactServer = {
  host: string;
  port: number;
  close: () => Promise<void>;
};

export async function createExpressReactServer(
  host = '127.0.0.1',
  port = 0
): Promise<ExpressReactServer> {
  const app = createExpressReactApp();
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
