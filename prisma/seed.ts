import 'dotenv/config';

import { faker } from '@faker-js/faker/locale/uk';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});
const per_batch = 1000;

async function batch() {
  console.log('Starts posts gen');
  const postsData = Array.from({ length: per_batch }).map(() => ({
    content: faker.lorem.paragraphs(3),
    views: faker.number.int({ min: 0, max: 10000 }),
    authorId: 1,
    createdAt: faker.date.past(),
  }));

  const created = await prisma.post.createMany({
    data: postsData,
  });

  return created.count;
}

async function main() {
  let total = 0;
  for (let i = 0; i < 100; i++) {
    total += await batch();
    console.log('Created ', total, ' / ', per_batch * 100);
  }
  console.log('Finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
