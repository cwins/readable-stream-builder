import { describe, expect, it } from 'vitest';
import { createExpressReactServer } from '../src/example.ts';

describe('express-stream-react example', () => {
  it('streams react content on /testPage', async () => {
    const server = await createExpressReactServer();

    try {
      const response = await fetch(`http://${server.host}:${server.port}/testPage`);
      const html = await response.text();

      // non-html checks
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');

      // minimal guardrail checks
      expect(html).toContain('<!doctype html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<main id="root">');
      expect(html).toContain('<section class="app-shell">');
      expect(html).toContain('</html>');

      // full html for regression testing and easy viewing
      expect(html).toMatchSnapshot();
    } finally {
      await server.close();
    }
  });
});
