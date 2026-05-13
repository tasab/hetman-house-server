const bcrypt = require('bcryptjs')

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string' },
    },
  },
}

async function adminAuthRoutes(fastify) {
  fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body

    const user = await fastify.prisma.user.findUnique({ where: { email } })

    if (!user || user.role !== 'ADMIN') {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })
    const { password: _, ...safeUser } = user

    return reply.send({ token, user: safeUser })
  })

  fastify.get('/me', { onRequest: [fastify.requireAdmin] }, async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, name: true, role: true },
    })
    return user
  })
}

module.exports = adminAuthRoutes
