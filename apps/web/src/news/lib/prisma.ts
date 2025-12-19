import { getPrismaClient } from "@illuvrse/db";

function createStubModel() {
  return new Proxy(
    () => Promise.resolve([]),
    {
      apply: async () => [],
      get: () => async () => []
    }
  );
}

function createStubClient() {
  return new Proxy(
    {},
    {
      get: () => createStubModel()
    }
  );
}

const prisma = process.env.DATABASE_URL ? getPrismaClient() : createStubClient();

export default prisma;
