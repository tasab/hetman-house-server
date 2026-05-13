const fp = require('fastify-plugin')

module.exports = fp(async (fastify) => {
  fastify.get('/api/admin/products', { preHandler: fastify.requireAdmin }, async (request, reply) => {
    const products = await fastify.prisma.product.findMany({
      include: { category: true, images: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })
    return products
  })

  fastify.post('/api/admin/products', { preHandler: fastify.requireAdmin }, async (request, reply) => {
    const { name, description, price, collection, inStock, stock, categoryId, images = [] } = request.body

    if (!name || price === undefined || !categoryId) {
      return reply.status(400).send({ error: "name, price, categoryId обов'язкові" })
    }

    const slug = name
      .toLowerCase()
      .replace(/[^a-zа-яёіїєґ0-9\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      + '-' + Date.now()

    const product = await fastify.prisma.product.create({
      data: {
        name,
        slug,
        description: description ?? null,
        price,
        imageUrl: images[0]?.medium ?? null,
        collection: collection ?? null,
        inStock: inStock ?? true,
        stock: stock ?? 0,
        categoryId,
        images: {
          create: images.map((img, i) => ({
            original: img.original,
            thumb: img.thumb,
            medium: img.medium,
            large: img.large,
            order: i,
          })),
        },
      },
      include: { category: true, images: { orderBy: { order: 'asc' } } },
    })

    return reply.status(201).send(product)
  })

  fastify.put('/api/admin/products/:id', { preHandler: fastify.requireAdmin }, async (request, reply) => {
    const id = Number(request.params.id)
    const { name, description, price, collection, inStock, stock, categoryId, images } = request.body

    const data = {
      name,
      description: description ?? null,
      price,
      collection: collection ?? null,
      inStock,
      stock: stock ?? 0,
      categoryId,
    }

    if (images !== undefined) {
      data.imageUrl = images[0]?.medium ?? null
      data.images = {
        deleteMany: {},
        create: images.map((img, i) => ({
          original: img.original,
          thumb: img.thumb,
          medium: img.medium,
          large: img.large,
          order: i,
        })),
      }
    }

    const product = await fastify.prisma.product.update({
      where: { id },
      data,
      include: { category: true, images: { orderBy: { order: 'asc' } } },
    })

    return reply.send(product)
  })

  fastify.delete('/api/admin/products/:id', { preHandler: fastify.requireAdmin }, async (request, reply) => {
    const id = Number(request.params.id)

    const images = await fastify.prisma.productImage.findMany({ where: { productId: id } })
    await fastify.deleteImagesFromS3(images)
    await fastify.prisma.product.delete({ where: { id } })

    return reply.status(204).send()
  })

  fastify.delete('/api/admin/products/:id/images/:imageId', { preHandler: fastify.requireAdmin }, async (request, reply) => {
    const imageId = Number(request.params.imageId)
    const productId = Number(request.params.id)

    const image = await fastify.prisma.productImage.findUnique({ where: { id: imageId } })
    if (!image || image.productId !== productId) {
      return reply.status(404).send({ error: 'Фото не знайдено' })
    }

    await fastify.deleteImagesFromS3([image])
    await fastify.prisma.productImage.delete({ where: { id: imageId } })

    const remaining = await fastify.prisma.productImage.findFirst({
      where: { productId },
      orderBy: { order: 'asc' },
    })
    await fastify.prisma.product.update({
      where: { id: productId },
      data: { imageUrl: remaining?.medium ?? null },
    })

    return reply.status(204).send()
  })
})
