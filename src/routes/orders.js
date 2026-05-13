async function routes(fastify) {
  fastify.post('/quick', async (req, reply) => {
    const { phone, comment, items } = req.body ?? {}

    if (!phone || !Array.isArray(items) || items.length === 0) {
      return reply.status(400).send({ error: 'phone and items are required' })
    }

    const order = await fastify.prisma.quickOrder.create({
      data: { phone, comment: comment ?? null, items },
    })

    return reply.status(201).send({ id: order.id })
  })
}

module.exports = routes
