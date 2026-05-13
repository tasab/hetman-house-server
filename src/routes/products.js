const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  fastify.get('/api/products', async (request, reply) => {
    const { category } = request.query

    if (!category) {
      return reply.status(400).send({ error: 'category param required' })
    }

    const products = await fastify.prisma.product.findMany({
      where: {
        category: { slug: category },
        inStock: true,
      },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: { createdAt: 'asc' },
    })

    return products
  })

  fastify.get('/api/products/:slug', async (request, reply) => {
    const product = await fastify.prisma.product.findUnique({
      where: { slug: request.params.slug },
      include: {
        category: true,
        images: { orderBy: { order: 'asc' } },
      },
    })

    if (!product) {
      return reply.status(404).send({ error: 'Товар не знайдено' })
    }

    return product
  })
})
