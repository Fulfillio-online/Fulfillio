export default () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',

  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://localhost:5432/fulfillio',
  },

  redis: {
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
    password: process.env.REDIS_PASSWORD ?? undefined,
  },

  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },

  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  },

  queues: {
    pdf: 'jobs.pdf',
    webhooks: 'jobs.webhooks',
    couriers: 'jobs.couriers',
  },
});
