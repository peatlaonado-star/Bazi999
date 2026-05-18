import http from 'node:http';

import { createPremiumRequestHandler, loadPremiumConfig } from './premium-service.mjs';

const port = Number(process.env.PORT || process.env.STARVIA_API_PORT || 8787);
const host = process.env.HOST || '0.0.0.0';

const config = loadPremiumConfig(process.env);
const server = http.createServer(createPremiumRequestHandler(config));

server.listen(port, host, () => {
  console.log(`STARVIA Premium API listening on http://${host}:${port}`);
});
