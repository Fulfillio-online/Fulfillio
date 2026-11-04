import * as dotenv from 'dotenv';
dotenv.config();

export const workerConfig = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  couriers: {
    steadfast: {
      baseUrl: process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1',
      apiKey: process.env.STEADFAST_API_KEY || 'test_steadfast_api_key',
      secretKey: process.env.STEADFAST_SECRET_KEY || 'test_steadfast_secret',
    },
    pathao: {
      baseUrl: process.env.PATHAO_BASE_URL || 'https://api-hermes.pathao.com',
      clientId: process.env.PATHAO_CLIENT_ID || 'test_pathao_client_id',
      clientSecret: process.env.PATHAO_CLIENT_SECRET || 'test_pathao_client_secret',
      username: process.env.PATHAO_USERNAME || '',
      password: process.env.PATHAO_PASSWORD || '',
    },
    redx: {
      baseUrl: process.env.REDX_BASE_URL || 'https://openapi.redx.com.bd/v1.0.0-beta',
      token: process.env.REDX_API_TOKEN || 'test_redx_token',
    },
  },
  storage: {
    invoicesDir: process.env.INVOICES_DIR || './uploads/invoices',
  },
};
