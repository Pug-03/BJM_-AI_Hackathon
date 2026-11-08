// Exits 0 when the sample talent already exist (used by scripts/vercel-build.sh).
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
db.user
  .count({ where: { email: { endsWith: "@sample.able.example" }, role: "TALENT" } })
  .then((n) => process.exit(n >= 12 ? 0 : 1))
  .catch(() => process.exit(1));
