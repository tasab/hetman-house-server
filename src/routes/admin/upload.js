const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  fastify.post('/api/admin/upload', { preHandler: fastify.requireAdmin }, async (request, reply) => {
    const data = await request.file()

    if (!data) {
      return reply.status(400).send({ error: 'Файл не знайдено' })
    }

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowed.includes(data.mimetype)) {
      return reply.status(400).send({ error: 'Дозволені тільки jpeg, png, webp' })
    }

    const buffer = await data.toBuffer()
    const urls = await fastify.uploadToS3(buffer, data.filename)

    return reply.status(201).send(urls)
  })
})
