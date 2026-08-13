import Fastify from 'fastify';
import staticPlugin from '@fastify/static';
import replyFrom from '@fastify/reply-from';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fastify = Fastify({ logger: true });

fastify.register(staticPlugin, {
  root: path.join(__dirname, 'ui'),
  prefix: '/',
});

// Register @fastify/reply-from for reverse proxy
fastify.register(replyFrom, {
  undici: {
    rejectUnauthorized: false,  // Allow self-signed certs for local services
  },
});

fastify.register(import('./src/routes/system.js'));
fastify.register(import('./src/routes/data.js'));
fastify.register(import('./src/routes/display.js'));

fastify.get('/api/health', async () => ({ status: 'ok', timestamp: Date.now() }));

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
