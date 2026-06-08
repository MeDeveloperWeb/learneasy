import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

// Exam dates by paper code (Applied Statistics takes the slot vacated by Data Science).
const EXAM_DATES: Record<string, string> = {
  STAT1IER601: "2026-06-16",
  MSCTCC201: "2026-06-18",
  MSCTCC202: "2026-06-20",
  MSCTCC203: "2026-06-22",
  MSCTCC204: "2026-06-24",
  MSCTCC205: "2026-06-27",
};

async function main() {
  for (const [code, date] of Object.entries(EXAM_DATES)) {
    const result = await prisma.paper.updateMany({
      where: { code },
      data: { examDate: new Date(date) },
    });
    console.log(`${code} -> ${date} (${result.count} updated)`);
  }
  console.log("Exam dates set.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
