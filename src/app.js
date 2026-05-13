require('dotenv').config()
const Fastify = require('fastify')

const app = Fastify({ logger: true })

app.register(require('@fastify/cors'), {
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3002',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204,
})

app.register(require('@fastify/jwt'), {
  secret: process.env.JWT_SECRET,
  sign: { expiresIn: process.env.JWT_EXPIRES_IN },
})

app.register(require('@fastify/multipart'))
app.register(require('./plugins/prisma'))
app.register(require('./plugins/s3'))
app.register(require('./middleware/authenticate'))
app.register(require('./middleware/requireAdmin'))

app.register(require('./routes/auth'), { prefix: '/api/auth' })
app.register(require('./routes/admin/auth'), { prefix: '/api/admin/auth' })
app.register(require('./routes/categories'))
app.register(require('./routes/products'))
app.register(require('./routes/admin/products'))
app.register(require('./routes/admin/upload'))
app.register(require('./routes/admin/orders'))
app.register(require('./routes/orders'), { prefix: '/api/orders' })

app.get('/health', async () => ({
  status: 'ok',
  uptime: process.uptime(),
  timestamp: new Date().toISOString(),
}))

app.get('/health/db', async (request, reply) => {
  try {
    await app.prisma.$queryRaw`SELECT 1`
    return { status: 'ok', timestamp: new Date().toISOString() }
  } catch (err) {
    reply.status(503)
    return { status: 'error', message: err.message, timestamp: new Date().toISOString() }
  }
})

module.exports = app
