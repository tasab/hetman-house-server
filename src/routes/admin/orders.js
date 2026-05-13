const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  fastify.get('/api/admin/orders/quick', { preHandler: fastify.requireAdmin }, async (req, reply) => {
    const orders = await fastify.prisma.quickOrder.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return orders
  })

  fastify.patch('/api/admin/orders/quick/:id', { preHandler: fastify.requireAdmin }, async (req, reply) => {
    const id = Number(req.params.id)
    const { status } = req.body ?? {}

    const valid = ['NEW', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
    if (!valid.includes(status)) {
      return reply.status(400).send({ error: 'Invalid status' })
    }

    const order = await fastify.prisma.quickOrder.update({
      where: { id },
      data: { status },
    })
    return order
  })
})
