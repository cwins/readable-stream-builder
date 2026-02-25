import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { renderExpressHomePage } from '../src/example.ts';

async function streamToString(stream: Readable): Promise<string> {
  const chunks: string[] = [];

  for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf8'));
  }

  return chunks.join('');
}

async function runTests() {
  const html = await streamToString(renderExpressHomePage('Avery'));
  assert.ok(html.includes('<title>Welcome Avery</title>'));
  assert.ok(html.includes('powered by readable-stream-builder'));
}

try {
  await runTests();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
  throw error;
}
