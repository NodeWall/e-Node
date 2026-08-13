export default async function dataRoutes(fastify, opts) {
  fastify.get('/api/data/weather', async () => ({
    location: 'shchastlive',
    tempC: 22,
    humidity: 60,
    windKmh: 14
  }));
  fastify.get('/api/data/network', async () => ({
    interfaces: ['eth0'],
    wan: '192.168.1.1',
    uptime: '4d 12h 33m'
  }));
}
