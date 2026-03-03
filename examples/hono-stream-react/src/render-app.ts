import { PassThrough } from 'node:stream';
import React from 'react';
import { renderToPipeableStream } from 'react-dom/server';
import { App } from './app.tsx';
import type { PageContext, ProductInfo } from './types.ts';

export type RenderAppArgs = {
  pageContext: PageContext;
  productInfo: ProductInfo;
  requestPath: string;
  responseStream: PassThrough;
};

export async function renderApp(args: RenderAppArgs): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let settled = false;

    const resolveOnce = () => {
      if (settled) {
        return;
      }

      settled = true;
      resolve();
    };

    const rejectOnce = (error: unknown) => {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    };

    const app = React.createElement(App, {
      pageContext: args.pageContext,
      productInfo: args.productInfo,
      requestPath: args.requestPath,
    });

    const { pipe } = renderToPipeableStream(app, {
      onShellReady() {
        // Shell is ready; we still wait for onAllReady to ensure complete markup.
      },
      onAllReady() {
        pipe(args.responseStream);
        resolveOnce();
      },
      onShellError(error) {
        rejectOnce(error);
      },
      onError(error) {
        rejectOnce(error);
      },
    });
  });
}
