const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  fastify.get('/api/categories', async () => {
    return fastify.prisma.category.findMany({ orderBy: { id: 'asc' } })
  })
})
