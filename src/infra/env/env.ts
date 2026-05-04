import { z } from 'zod'

/**
 * Schema de validação para variáveis de ambiente.
 * Define todas as variáveis necessárias para a aplicação funcionar corretamente,
 * com seus tipos, valores padrão e validações específicas.
 */
export const envSchema = z.object({
  DATABASE_URL: z.url(),
  JWT_PRIVATE_KEY: z.base64(),
  JWT_PUBLIC_KEY: z.base64(),
  NODE_ENV: z.enum(['production', 'test', 'dev']).default('dev'),
  CLOUDFLARE_ACCOUNT_ID: z.string(),
  AWS_BUCKET_NAME: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  REDIS_HOST: z.string().optional().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().optional().default(6379),
  REDIS_DB: z.coerce.number().optional().default(0),
  PORT: z.coerce.number().optional().default(3333),
})

/**
 * Tipo inferido do schema de environment.
 * Fornece autocompletagem e verificação de tipos ao acessar variáveis de ambiente.
 */
export type Env = z.infer<typeof envSchema>
