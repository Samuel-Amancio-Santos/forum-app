import { PaginationParams } from '@/core/repositories/pagination-params'
import { QuestionsRepository } from '@/domain/forum/application/repositories/questions-repository'
import { Question } from '@/domain/forum/enterprise/entities/question'
import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma.service'
import { QuestionAttachmentsRepository } from '@/domain/forum/application/repositories/question-attachments-repository'
import { QuestionDetails } from '@/domain/forum/enterprise/entities/value-objects/question-details'
import { PrismaQuestionDetailsMapper } from '../mappers/prisma-question-details-mapper'
import { DomainEvents } from '@/core/events/domain-events'
import { CacheRepository } from '@/infra/cache/cache-repository'
import { PrismaQuestionMapper } from '../mappers/prisma-question-mapper'
import {
  QuestionDetailsCacheMapper,
  type CachedQuestionDetails,
} from '@/infra/cache/mappers/question-details-cache-mapper'

@Injectable()
export class PrismaQuestionsRepository implements QuestionsRepository {
  constructor(
    private prisma: PrismaService,
    private cache: CacheRepository,
    private questionAttachmentsRepository: QuestionAttachmentsRepository,
  ) {}

  async findById(id: string): Promise<Question | null> {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
    })

    if (!question) {
      return null
    }

    return PrismaQuestionMapper.toDomain(question)
  }

  async findBySlug(slug: string): Promise<Question | null> {
    const question = await this.prisma.question.findUnique({
      where: {
        slug,
      },
    })

    if (!question) {
      return null
    }

    return PrismaQuestionMapper.toDomain(question)
  }

  async findDetailsBySlug(slug: string): Promise<QuestionDetails | null> {
    const cacheKey = this.getQuestionDetailsCacheKey(slug)
    const cacheHit = await this.cache.get(cacheKey)

    if (cacheHit) {
      // IMPORTANT:
      // `JSON.parse` retorna um objeto "plano" (sem métodos/getters).
      // Se retornarmos isso diretamente, o Presenter pode quebrar ao acessar
      // `questionId.toString()` / `slug.value`, causando 500 intermitente.
      const cacheData = JSON.parse(cacheHit) as CachedQuestionDetails
      return QuestionDetailsCacheMapper.toDomain(cacheData)
    }

    const question = await this.prisma.question.findUnique({
      where: {
        slug,
      },
      include: {
        author: true,
        attachments: true,
      },
    })

    if (!question) {
      return null
    }

    const questionDetails = PrismaQuestionDetailsMapper.toDomain(question)

    await this.cache.set(
      cacheKey,
      JSON.stringify(QuestionDetailsCacheMapper.toCache(questionDetails)),
    )

    return questionDetails
  }

  private getQuestionDetailsCacheKey(slug: string) {
    // IMPORTANT:
    // Nos testes E2E usamos `DATABASE_URL?schema=<uuid>` por worker.
    // Se a key não incluir o schema, diferentes execuções/workers podem
    // compartilhar a mesma key no Redis e gerar flakiness.
    const schema =
      process.env.DATABASE_URL &&
      (() => {
        try {
          return new URL(process.env.DATABASE_URL).searchParams.get('schema')
        } catch {
          return null
        }
      })()

    return `question:${schema ?? 'default'}:${slug}:details`
  }

  async findManyRecent({ page }: PaginationParams): Promise<Question[]> {
    const questions = await this.prisma.question.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      skip: (page - 1) * 20,
    })

    return questions.map(PrismaQuestionMapper.toDomain)
  }

  async create(question: Question): Promise<void> {
    const data = PrismaQuestionMapper.toPrisma(question)

    await this.prisma.question.create({
      data,
    })

    await this.questionAttachmentsRepository.createMany(
      question.attachments.getItems(),
    )

    DomainEvents.dispatchEventsForAggregate(question.id)
  }

  async save(question: Question): Promise<void> {
    const data = PrismaQuestionMapper.toPrisma(question)

    await Promise.all([
      this.prisma.question.update({
        where: {
          id: question.id.toString(),
        },
        data,
      }),
      this.questionAttachmentsRepository.createMany(
        question.attachments.getNewItems(),
      ),
      this.questionAttachmentsRepository.deleteMany(
        question.attachments.getRemovedItems(),
      ),
      // Mantém a invalidação alinhada com a key usada em `findDetailsBySlug`.
      this.cache.delete(this.getQuestionDetailsCacheKey(data.slug)),
    ])

    DomainEvents.dispatchEventsForAggregate(question.id)
  }

  async delete(question: Question): Promise<void> {
    const data = PrismaQuestionMapper.toPrisma(question)

    await this.prisma.question.delete({
      where: {
        id: data.id,
      },
    })
  }
}
