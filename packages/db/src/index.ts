import type { PrismaClient } from "@prisma/client";

let client: PrismaClient | undefined;

function createClient(): PrismaClient {
  try {
    // Avoid blowing up when DATABASE_URL is missing in dev; fall back to stub.
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not set");
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("@prisma/client") as typeof import("@prisma/client");
    return new PrismaClient();
  } catch (err) {
    console.warn("Prisma client unavailable, returning stub. Generate client and set DATABASE_URL to enable DB access.", err);
    return new Proxy(
      {},
      {
        get() {
          // Return a model proxy whose methods resolve to empty arrays/objects.
          return new Proxy(
            {},
            {
              get() {
                return async () => [];
              }
            }
          );
        }
      }
    ) as unknown as PrismaClient;
  }
}

export function getPrismaClient(): PrismaClient {
  // @ts-ignore global cache for dev/hot-reload
  if (process.env.NODE_ENV !== "production" && globalThis.__illuvrsePrisma) {
    // @ts-ignore return cached client
    return globalThis.__illuvrsePrisma as PrismaClient;
  }
  if (!client) {
    client = createClient();
    // @ts-ignore cache on global in dev
    if (process.env.NODE_ENV !== "production") {
      // @ts-ignore assign for dev caching
      globalThis.__illuvrsePrisma = client;
    }
  }
  return client;
}

export const prisma = getPrismaClient();

export * from "@prisma/client";
