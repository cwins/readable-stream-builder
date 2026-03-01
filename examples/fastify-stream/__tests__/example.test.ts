import assert from 'node:assert/strict';
import { createFastifyServer } from '../src/example.ts';

async function runTests() {
  const server = await createFastifyServer();

  try {
    const response = await fetch(`http://${server.host}:${server.port}/testPage`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'text/html; charset=utf-8');
    assert.equal(response.headers.get('x-example'), 'fastify');
    assert.ok(html.includes('<!doctype html>'));
    assert.ok(html.includes('<title>Readable Stream Builder Example</title>'));
    assert.ok(html.includes('<h1>Readable Stream Builder Example</h1>'));
    assert.ok(html.includes('<section><p>Mix plain strings, async factories, and nested streams.</p></section>'));
    assert.ok(html.includes('<footer>powered by readable-stream-builder</footer>'));
  } finally {
    await server.close();
  }
}

try {
  await runTests();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
  throw error;
}
