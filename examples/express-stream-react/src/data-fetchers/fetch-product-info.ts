import type { ProductInfo } from '../types.ts';

const wait = async (ms: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchProductInfo(requestUrl: string): Promise<ProductInfo> {
  await wait(2000);

  const parsedUrl = new URL(requestUrl, 'http://localhost');
  const product = parsedUrl.searchParams.get('product') ?? 'stream-builder';

  return {
    name: product,
    price: '$39.00',
    inventoryStatus: 'In stock',
    details: [
      'Built for progressive streaming',
      'Composable async data flow',
      'Framework-agnostic response pipeline',
    ],
  };
}
