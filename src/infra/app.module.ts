import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env/env'
import { AuthModule } from './auth/auth.module'
import { HttpModule } from './http/http.module'
import { EnvModule } from './env/env.module'
import { EventsModule } from './events/events.module'

/**
 * Módulo raiz da aplicação NestJS.
 * Responsável por configurar e inicializar todos os módulos da aplicação,
 * incluindo validação de variáveis de ambiente e registro dos módulos de funcionalidade.
 */
@Module({
  // Configura o módulo de configuração global do NestJS
  imports: [
    // ConfigModule.forRoot() inicializa o sistema de configuração
    ConfigModule.forRoot({
      // Valida as variáveis de ambiente contra o schema Zod definido em env.ts
      // Se a validação falhar, a aplicação não iniciará
      validate: (env) => envSchema.parse(env),
      // Torna o ConfigModule disponível globalmente,
      // permitindo que qualquer serviço injete ConfigService diretamente
      isGlobal: true,
    }),
    // Módulo de autenticação (JWT, estratégias, etc.)
    AuthModule,
    // Módulo HTTP (controladores, rotas, DTOs)
    HttpModule,
    // Módulo de variáveis de ambiente (fornece EnvService para acesso tipado)
    EnvModule,
    // Módulo de eventos (manipulação de eventos domínio)
    EventsModule,
  ],
})
// Exporta o módulo raiz para ser usado como ponto de entrada da aplicação
export class AppModule {}
