const bcrypt = require('bcryptjs')

const registerSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 6 },
      name: { type: 'string' },
    },
  },
}

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

async function authRoutes(fastify) {
  fastify.post('/register', { schema: registerSchema }, async (request, reply) => {
    const { email, password, name } = request.body

    const existing = await fastify.prisma.user.findUnique({ where: { email } })
    if (existing) {
      return reply.status(409).send({ error: 'Email already in use' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await fastify.prisma.user.create({
      data: { email, password: hashed, name },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })

    const token = fastify.jwt.sign({ id: user.id, email: user.email, role: user.role })

    return reply.status(201).send({ token, user })
  })

  fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
    const { email, password } = request.body

    const user = await fastify.prisma.user.findUnique({ where: { email } })
    if (!user) {
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

  fastify.get('/me', { onRequest: [fastify.authenticate] }, async (request) => {
    const user = await fastify.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    return user
  })
}

module.exports = authRoutes
