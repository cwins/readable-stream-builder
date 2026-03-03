import React from 'react';
import { ProductDetailList } from '../components/product-detail-list.tsx';
import type { ProductInfo } from '../types.ts';

type ProductPageProps = {
  productInfo: ProductInfo;
};

export function ProductPage(props: ProductPageProps): React.ReactElement {
  return (
    <article className="product-page">
      <h2>{props.productInfo.name}</h2>
      <p>{`Price: ${props.productInfo.price}`}</p>
      <p>{`Availability: ${props.productInfo.inventoryStatus}`}</p>
      <ProductDetailList details={props.productInfo.details} />
    </article>
  );
}
