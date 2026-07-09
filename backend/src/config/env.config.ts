import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ override: true });

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  OPENAI_API_KEY: z.string().default(''),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  DEFAULT_BATCH_SIZE: z.coerce.number().default(20),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
