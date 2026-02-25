import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { renderHonoPage } from '../src/example.ts';

async function streamToString(stream: Readable): Promise<string> {
  const parts: string[] = [];

  for await (const chunk of stream) {
    parts.push(typeof chunk === 'string' ? chunk : chunk.toString());
  }

  return parts.join('');
}

async function runTests() {
  const html = await streamToString(renderHonoPage('edge-savvy'));
  assert.ok(html.includes('<title>edge-savvy with Hono</title>'));
  assert.ok(html.includes('Streaming keeps latency low.'));
}

try {
  await runTests();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
  throw error;
}
