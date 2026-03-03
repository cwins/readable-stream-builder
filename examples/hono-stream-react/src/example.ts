import { Hono } from 'hono';
import type { Context } from 'hono';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
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

export function renderHonoReactPage(requestUrl: string, requestPath: string): Readable {
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
        requestPath,
        responseStream: appStream,
      });

      return appStream;
    },
    '</main><footer>powered by readable-stream-builder</footer></body></html>'
  );

  return builder.build();
}

export function createHonoReactApp(): Hono {
  const app = new Hono();
  const handler = (c: Context) => {
    const requestUrl = c.req.url;
    const requestPath = new URL(requestUrl).pathname;
    const stream = renderHonoReactPage(requestUrl, requestPath);

    return new Response(stream, {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    });
  };

  app.get('/', handler);
  app.get('/testPage', handler);

  return app;
}

export type HonoReactServer = {
  host: string;
  port: number;
  close: () => Promise<void>;
};

export async function createHonoReactServer(
  host = '127.0.0.1',
  port = 0
): Promise<HonoReactServer> {
  const app = createHonoReactApp();
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
