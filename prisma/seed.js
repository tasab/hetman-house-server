require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const coins = await prisma.category.upsert({
    where: { slug: 'coins' },
    update: {},
    create: { name: 'Монети', slug: 'coins' },
  })

  await prisma.category.upsert({
    where: { slug: 'banknotes' },
    update: {},
    create: { name: 'Купюри', slug: 'banknotes' },
  })

  await prisma.category.upsert({
    where: { slug: 'ingots' },
    update: {},
    create: { name: 'Злитки', slug: 'ingots' },
  })

  const heroCoins = [
    { city: 'Київщина', slug: 'mista-heroi-kyivshchyna' },
    { city: 'Маріуполь', slug: 'mista-heroi-mariupol' },
    { city: 'Харків', slug: 'mista-heroi-kharkiv' },
    { city: 'Херсон', slug: 'mista-heroi-kherson' },
    { city: 'Волноваха', slug: 'mista-heroi-volnovakha' },
    { city: 'Миколаїв', slug: 'mista-heroi-mykolaiv' },
    { city: 'Охтирка', slug: 'mista-heroi-okhtyrka' },
    { city: 'Чернігів', slug: 'mista-heroi-chernihiv' },
  ]

  for (const coin of heroCoins) {
    await prisma.product.upsert({
      where: { slug: coin.slug },
      update: {},
      create: {
        name: coin.city,
        slug: coin.slug,
        description: `Пам'ятна монета серії «Міста-герої» — ${coin.city}`,
        price: 350,
        collection: 'Міста-герої',
        imageUrl: null,
        categoryId: coins.id,
      },
    })
  }

  console.log('Seed completed')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); await pool.end() })
