import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Attachment } from '@/domain/forum/enterprise/entities/attachment'
import { QuestionDetails } from '@/domain/forum/enterprise/entities/value-objects/question-details'
import { Slug } from '@/domain/forum/enterprise/entities/value-objects/slug'

type CachedAttachment = {
  id: string
  title: string
  url: string
}

export type CachedQuestionDetails = {
  questionId: string
  authorId: string
  author: string
  title: string
  content: string
  slug: string
  bestAnswerId: string | null
  attachments: CachedAttachment[]
  createdAt: string
  updatedAt: string | null
}

export class QuestionDetailsCacheMapper {
  static toCache(details: QuestionDetails): CachedQuestionDetails {
    // NOTE:
    // ValueObjects/Entities (como `QuestionDetails`, `UniqueEntityID`, `Slug`, `Attachment`)
    // não sobrevivem a um `JSON.stringify`/`JSON.parse` mantendo getters/métodos.
    // Por isso o cache precisa guardar um DTO "plano" (strings/ISO dates),
    // e nós reidratamos para o domínio no cache hit.
    return {
      questionId: details.questionId.toString(),
      authorId: details.authorId.toString(),
      author: details.author,
      title: details.title,
      content: details.content,
      slug: details.slug.value,
      bestAnswerId: details.bestAnswerId
        ? details.bestAnswerId.toString()
        : null,
      attachments: details.attachments.map((attachment) => ({
        id: attachment.id.toString(),
        title: attachment.title,
        url: attachment.url,
      })),
      createdAt: details.createdAt.toISOString(),
      updatedAt: details.updatedAt ? details.updatedAt.toISOString() : null,
    }
  }

  static toDomain(raw: CachedQuestionDetails): QuestionDetails {
    // Reidrata o DTO do cache para o objeto de domínio esperado pelo Presenter/UseCase.
    return QuestionDetails.create({
      questionId: new UniqueEntityID(raw.questionId),
      authorId: new UniqueEntityID(raw.authorId),
      author: raw.author,
      title: raw.title,
      content: raw.content,
      slug: Slug.create(raw.slug),
      bestAnswerId: raw.bestAnswerId
        ? new UniqueEntityID(raw.bestAnswerId)
        : null,
      attachments: raw.attachments.map((attachment) =>
        Attachment.create(
          { title: attachment.title, url: attachment.url },
          new UniqueEntityID(attachment.id),
        ),
      ),
      createdAt: new Date(raw.createdAt),
      updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : null,
    })
  }
}
