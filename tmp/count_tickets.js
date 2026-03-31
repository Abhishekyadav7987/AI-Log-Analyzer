const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resolvedCount = await prisma.ticket.count({
    where: { status: 'RESOLVED' }
  });

  const openCount = await prisma.ticket.count({
    where: { status: 'OPEN' }
  });

  const latestResolved = await prisma.ticket.findFirst({
    where: { status: 'RESOLVED' },
    orderBy: { updatedAt: 'desc' },
    include: { resolution: true, executionHistory: true }
  });

  console.log(JSON.stringify({ resolvedCount, openCount, latestResolved }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
