import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: (process.env.DATABASE_URL ?? "file:./prisma/dev.db") as ":memory:" | (string & {}),
});

export const prisma = new PrismaClient({ adapter });

