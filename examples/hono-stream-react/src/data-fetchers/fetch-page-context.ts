import type { PageContext } from '../types.ts';

const wait = async (ms: number): Promise<void> =>
  await new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchPageContext(requestUrl: string): Promise<PageContext> {
  await wait(100);

  const parsedUrl = new URL(requestUrl, 'http://localhost');
  const product = parsedUrl.searchParams.get('product') ?? 'stream-builder';

  return {
    title: `Product: ${product} - readable-stream-builder`,
    description: `Streaming product details for ${product}.`,
    robots: 'index,follow',
    canonicalPath: parsedUrl.pathname,
  };
}
