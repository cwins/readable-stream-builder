import { createExpressReactServer } from './example';

const server = await createExpressReactServer('localhost', 4000);
console.log(`[express-stream-react] Server listening at http://${server.host}:${server.port}`);
console.log(`[express-stream-react] Test page: http://${server.host}:${server.port}/testPage`);
