import { QuestionsRepository } from '@/domain/forum/application/repositories/questions-repository'
import { AppModule } from '@/infra/app.module'
import { CacheRepository } from '@/infra/cache/cache-repository'
import { CacheModule } from '@/infra/cache/cache.module'
import { DatabaseModule } from '@/infra/database/database.module'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AttachmentFactory } from '@test/factories/make-attachment'
import { QuestionFactory } from '@test/factories/make-question'
import { QuestionAttachmentFactory } from '@test/factories/make-question-attachments'
import { StudentFactory } from '@test/factories/make-student'
import { randomUUID } from 'node:crypto'
import { QuestionDetailsCacheMapper } from '@/infra/cache/mappers/question-details-cache-mapper'

describe('Prisma Questions Repository (E2E)', () => {
  let app: INestApplication
  let studentFactory: StudentFactory
  let questionFactory: QuestionFactory
  let attachmentFactory: AttachmentFactory
  let questionAttachmentFactory: QuestionAttachmentFactory
  let cacheRepository: CacheRepository
  let questionsRepository: QuestionsRepository

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule, DatabaseModule, CacheModule],
      providers: [
        StudentFactory,
        QuestionFactory,
        AttachmentFactory,
        QuestionAttachmentFactory,
      ],
    }).compile()

    app = moduleRef.createNestApplication()

    studentFactory = moduleRef.get(StudentFactory)
    questionFactory = moduleRef.get(QuestionFactory)
    attachmentFactory = moduleRef.get(AttachmentFactory)
    questionAttachmentFactory = moduleRef.get(QuestionAttachmentFactory)
    cacheRepository = moduleRef.get(CacheRepository)
    questionsRepository = moduleRef.get(QuestionsRepository)

    await app.init()
  })

  function getCacheKey(slug: string) {
    // O repositório agora inclui o `schema` (DATABASE_URL?schema=...) na key
    // para evitar colisões no Redis entre execuções/workers.
    const schema = process.env.DATABASE_URL
      ? new URL(process.env.DATABASE_URL).searchParams.get('schema')
      : null

    return `question:${schema ?? 'default'}:${slug}:details`
  }

  it('should cache question details', async () => {
    const user = await studentFactory.makePrismaStudent()

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    const attachment = await attachmentFactory.makePrismaAttachment()

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      attachmentId: attachment.id,
      questionId: question.id,
    })

    const slug = question.slug.value

    const questionDetails = await questionsRepository.findDetailsBySlug(slug)

    const cached = await cacheRepository.get(getCacheKey(slug))

    expect(cached).toEqual(
      JSON.stringify(QuestionDetailsCacheMapper.toCache(questionDetails!)),
    )
  })

  it('should return cached question details on subsequent calls', async () => {
    const user = await studentFactory.makePrismaStudent()

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    const attachment = await attachmentFactory.makePrismaAttachment()

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      attachmentId: attachment.id,
      questionId: question.id,
    })

    const slug = question.slug.value

    await cacheRepository.set(
      getCacheKey(slug),
      JSON.stringify({
        questionId: randomUUID(),
        authorId: randomUUID(),
        author: 'Cached Author',
        title: 'Cached Title',
        content: 'Cached Content',
        slug,
        bestAnswerId: null,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: null,
      }),
    )

    const questionDetails = await questionsRepository.findDetailsBySlug(slug)

    expect(questionDetails?.title).toEqual('Cached Title')
    expect(questionDetails?.author).toEqual('Cached Author')
  })

  it('should reset question details cache when saving the question', async () => {
    const user = await studentFactory.makePrismaStudent()

    const question = await questionFactory.makePrismaQuestion({
      authorId: user.id,
    })

    const attachment = await attachmentFactory.makePrismaAttachment()

    await questionAttachmentFactory.makePrismaQuestionAttachment({
      attachmentId: attachment.id,
      questionId: question.id,
    })

    const slug = question.slug.value

    await cacheRepository.set(
      getCacheKey(slug),
      JSON.stringify({
        questionId: randomUUID(),
        authorId: randomUUID(),
        author: 'Cached Author',
        title: 'Cached Title',
        content: 'Cached Content',
        slug,
        bestAnswerId: null,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: null,
      }),
    )

    await questionsRepository.save(question)

    const cached = await cacheRepository.get(getCacheKey(slug))

    expect(cached).toBeNull()
  })
})
