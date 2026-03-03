import { createHonoReactServer } from './example';

const server = await createHonoReactServer('localhost', 4002);
console.log(`[hono-stream-react] Server listening at http://${server.host}:${server.port}`);
console.log(`[hono-stream-react] Test page: http://${server.host}:${server.port}/testPage`);
