import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Env } from './env'

/**
 * Serviço que fornece acesso tipado e seguro às variáveis de ambiente.
 * Wraps o ConfigService do NestJS para garantir que os valores retornados
 * estejam de acordo com o schema definido em env.ts, fornecendo autocompletagem
 * e verificação de tipos em tempo de compilação.
 */
@Injectable()
export class EnvService {
  /**
   * Injeta o ConfigService com tipagem explícita do nosso schema Env.
   * O segundo parâmetro <true> habilita a inferência de tipos.
   */
  constructor(private configService: ConfigService<Env, true>) {}

  /**
   * Obtém o valor de uma variável de ambiente com verificação de tipo.
   *
   * @param key - Nome da variável de ambiente (deve ser uma chave válida do schema Env)
   * @returns O valor da variável com o tipo correto conforme definido no schema
   *
   * Exemplo de uso:
   *   const port = envService.get('PORT') // retorna number
   *   const env = envService.get('NODE_ENV') // retorna 'production' | 'test' | 'dev'
   */
  get<T extends keyof Env>(key: T) {
    return this.configService.get(key, { infer: true })
  }
}
