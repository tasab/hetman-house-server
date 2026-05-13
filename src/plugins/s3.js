const fp = require('fastify-plugin')
const { S3Client, PutObjectCommand, DeleteObjectsCommand } = require('@aws-sdk/client-s3')
const { randomUUID } = require('crypto')

module.exports = fp(async (fastify) => {
  const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  })

  fastify.decorate('uploadToS3', async (buffer, originalName) => {
    const ext = originalName.split('.').pop().toLowerCase()
    const filename = `${randomUUID()}.${ext}`
    const key = `originals/${filename}`

    await s3.send(new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: ext === 'png' ? 'image/png' : 'image/jpeg',
    }))

    const baseUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`

    return {
      original: `${baseUrl}/${key}`,
      thumb: `${baseUrl}/products/${filename.replace(`.${ext}`, '')}-thumb.${ext}`,
      medium: `${baseUrl}/products/${filename.replace(`.${ext}`, '')}-medium.${ext}`,
      large: `${baseUrl}/products/${filename.replace(`.${ext}`, '')}-large.${ext}`,
    }
  })

  fastify.decorate('deleteImagesFromS3', async (images) => {
    if (!images.length) return

    const keys = images.flatMap((img) => {
      const match = img.medium.match(/products\/(.+)-medium\.(\w+)$/)
      if (!match) return []
      const [, uuid, ext] = match
      return [
        `originals/${uuid}.${ext}`,
        `products/${uuid}-thumb.${ext}`,
        `products/${uuid}-medium.${ext}`,
        `products/${uuid}-large.${ext}`,
      ]
    })

    await s3.send(new DeleteObjectsCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Delete: { Objects: keys.map((Key) => ({ Key })) },
    }))
  })
})
