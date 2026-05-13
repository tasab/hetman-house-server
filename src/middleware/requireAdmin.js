const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  fastify.decorate('requireAdmin', async (request, reply) => {
    try {
      await request.jwtVerify()
      if (request.user.role !== 'ADMIN') {
        return reply.status(403).send({ error: 'Forbidden' })
      }
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })
})
