import {
  UploadParams,
  Uploader,
} from '@/domain/forum/application/storage/uploader'
import { randomUUID } from 'crypto'

interface Upload {
  fileName: string
  url: string
  body: Buffer
}

export class FakeUploader implements Uploader {
  public uploads: Upload[] = []

  async upload({ fileName, body }: UploadParams): Promise<{ url: string }> {
    const url = randomUUID()

    this.uploads.push({
      fileName,
      url,
      body,
    })

    return { url }
  }
}
