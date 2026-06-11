import type { D1Database } from "@cloudflare/workers-types";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";
import { getCloudflareContext } from "@opennextjs/cloudflare";

// O binding D1 só existe dentro do escopo de uma request (workerd em produção,
// miniflare no `next dev`). O Proxy adia a criação do client até o primeiro
// acesso, que sempre acontece dentro de uma request.
let client: PrismaClient | undefined;

function getClient(): PrismaClient {
  if (!client) {
    const { env } = getCloudflareContext();
    const adapter = new PrismaD1((env as { DB: D1Database }).DB);
    client = new PrismaClient({ adapter });
  }
  return client;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
