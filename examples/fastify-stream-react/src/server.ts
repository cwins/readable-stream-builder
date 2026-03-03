import { createFastifyReactServer } from './example';

const server = await createFastifyReactServer('localhost', 4001);
console.log(`[fastify-stream-react] Server listening at http://${server.host}:${server.port}`);
console.log(`[fastify-stream-react] Test page: http://${server.host}:${server.port}/testPage`);
