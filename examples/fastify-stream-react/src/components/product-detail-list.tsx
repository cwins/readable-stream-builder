import React from 'react';

type ProductDetailListProps = {
  details: string[];
};

export function ProductDetailList(props: ProductDetailListProps): React.ReactElement {
  return (
    <ul>
      {props.details.map((detail) => (
        <li key={detail}>{detail}</li>
      ))}
    </ul>
  );
}
