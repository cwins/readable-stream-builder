import { describe, expect, it } from 'vitest';
import { createFastifyServer } from '../src/example.ts';

describe('fastify-stream-basic example', () => {
  it('serves the expected HTML tags on /testPage', async (ctx) => {
    const server = await createFastifyServer();

    try {
      const response = await fetch(`http://${server.host}:${server.port}/testPage`);
      const html = await response.text();

      // non-html checks
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
      expect(response.headers.get('x-example')).toBe('fastify');

      // minimal guardrail checks
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<html>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
      expect(html).toContain('</html>');

      // full html for regression testing and easy viewing
      expect(html).toMatchSnapshot();
    } finally {
      await server.close();
    }
  });
});
