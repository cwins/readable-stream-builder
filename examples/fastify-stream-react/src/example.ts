import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
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

export function renderFastifyReactPage(request: FastifyRequest): Readable {
  const requestUrl = request.raw.url || request.url || '/';
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
        requestPath: request.url,
        responseStream: appStream,
      });

      return appStream;
    },
    '</main><footer>powered by readable-stream-builder</footer></body></html>'
  );

  return builder.build();
}

export function createFastifyReactApp(): FastifyInstance {
  const app = Fastify();
  const handler = (request: FastifyRequest, reply: FastifyReply) => {
    const stream = renderFastifyReactPage(request);
    reply.headers({
      'Content-Type': 'text/html; charset=utf-8',
      'X-Example': 'fastify-react',
    });
    reply.send(stream);
  };

  app.get('/', handler);
  app.get('/testPage', handler);

  return app;
}

export type FastifyReactServer = {
  host: string;
  port: number;
  close: () => Promise<void>;
};

export async function createFastifyReactServer(
  host = '127.0.0.1',
  port = 0
): Promise<FastifyReactServer> {
  const app = createFastifyReactApp();
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
