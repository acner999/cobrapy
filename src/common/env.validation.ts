import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),

  DATABASE_URL: z.string().url(),

  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 chars'),
  ADMIN_TOKEN: z.string().min(8, 'ADMIN_TOKEN must be at least 8 chars'),

  // SIP real (BCP) — opcionales en dev, obligatorios en prod con SIP_REAL=true
  SIP_REAL: z.string().optional(),
  SIP_BASE_URL: z.string().url().optional(),
  SIP_CLIENT_ID: z.string().optional(),
  SIP_CLIENT_SECRET: z.string().optional(),
  SIP_WEBHOOK_SECRET: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment variables:\n${issues}`);
  }
  return result.data;
}
