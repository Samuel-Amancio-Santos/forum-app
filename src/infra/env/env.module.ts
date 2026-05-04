import { Module } from '@nestjs/common'
import { EnvService } from './env.service'

/**
 * Módulo responsável por fornecer acesso tipado às variáveis de ambiente.
 * Encapsula o EnvService e o torna disponível para outros módulos da aplicação.
 */
@Module({
  // Registra o EnvService como provider para injeção de dependência
  providers: [EnvService],
  // Exporta o EnvService para que outros módulos possam utilizá-lo
  exports: [EnvService],
})
export class EnvModule {}
