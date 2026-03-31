async function test() {
  const payload = { source: "simulator", serviceName: "payment-api", level: "CRITICAL", message: "DB_CONN_TIMEOUT: Pool exhausted", timestamp: new Date().toISOString() };
  await fetch('http://localhost:3001/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  console.log("Crash simulated. Waiting 10s for AI to resolve...");
  setTimeout(async () => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const ticket = await prisma.ticket.findFirst({ orderBy: { createdAt: 'desc' }, include: { resolution: true } });
    if(ticket && ticket.resolution) {
      console.log("Approval for ticket: " + ticket.id);
      await fetch(`http://localhost:3005/auto-fix/${ticket.id}`, { method: 'POST' });
      console.log("Approval sent. Waiting 5s for action service...");
      setTimeout(async () => {
        const finalTicket = await prisma.ticket.findUnique({ where: { id: ticket.id } });
        console.log("Final ticket status: " + finalTicket.status);
        await prisma.$disconnect();
        process.exit(0);
      }, 5000);
    } else {
      console.log("Ticket or resolution not found");
      await prisma.$disconnect();
      process.exit(1);
    }
  }, 10000);
}
test();
