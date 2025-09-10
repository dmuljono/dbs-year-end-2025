const { PrismaClient } = require(@prisma/client);
const prisma = new PrismaClient();
(async () => {
  try {
    const n = await prisma.attendee.count();
    console.log(n);
  } catch (e) {
    console.log(0);
  } finally {
    await prisma.();
  }
})();
