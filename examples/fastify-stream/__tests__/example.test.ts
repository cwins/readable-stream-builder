import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { renderFastifyDocument } from '../src/example.ts';

async function streamToString(stream: Readable): Promise<string> {
  const parts: string[] = [];

  for await (const chunk of stream) {
    parts.push(typeof chunk === 'string' ? chunk : chunk.toString());
  }

  return parts.join('');
}

async function runTests() {
  const html = await streamToString(renderFastifyDocument('Lina'));
  assert.ok(html.includes('Fastify stream for Lina'));
  assert.ok(html.includes('Highlights: fast, safe, streaming'));
}

try {
  await runTests();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
  throw error;
}
