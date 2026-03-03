import React from 'react';
import { PageHeader } from './components/page-header.tsx';
import { ProductPage } from './pages/product-page.tsx';
import type { PageContext, ProductInfo } from './types.ts';

export type AppProps = {
  pageContext: PageContext;
  productInfo: ProductInfo;
  requestPath: string;
};

export function App(props: AppProps): React.ReactElement {
  return React.createElement(
    'section',
    { className: 'app-shell' },
    React.createElement(PageHeader, {
      requestPath: props.requestPath,
    }),
    React.createElement(ProductPage, { productInfo: props.productInfo })
  );
}
