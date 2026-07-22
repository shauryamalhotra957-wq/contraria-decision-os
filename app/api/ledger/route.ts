import { desc } from "drizzle-orm";
import { ensureDatabase } from "@/db/bootstrap";
import { getDb } from "@/db";
import { auditEvents } from "@/db/schema";
import { decision, defaultAudit } from "@/lib/contraria/data";

async function checksum(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).slice(0, 6).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function seedLedger() {
  const db = await getDb();
  const current = await db.select({ id: auditEvents.id }).from(auditEvents).limit(1);
  if (current.length) return;
  const seeded = await Promise.all(defaultAudit.map(async (event) => ({
    decisionId: decision.id,
    ...event,
    checksum: await checksum(`${event.actor}:${event.action}:${event.detail}:${event.createdAt}`),
  })));
  await db.insert(auditEvents).values(seeded);
}

export async function GET() {
  try {
    await ensureDatabase();
    await seedLedger();
    const db = await getDb();
    const events = await db.select().from(auditEvents).orderBy(desc(auditEvents.createdAt), desc(auditEvents.id)).limit(40);
    return Response.json({ events });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ledger unavailable" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as { actor?: string; action?: string; detail?: string };
    const actor = payload.actor?.trim().slice(0, 40) || "OPERATOR";
    const action = payload.action?.trim().toUpperCase().slice(0, 32) || "NOTE";
    const detail = payload.detail?.trim().slice(0, 320) ?? "";
    if (!detail) return Response.json({ error: "detail is required" }, { status: 400 });
    await ensureDatabase();
    const createdAt = new Date().toISOString();
    const eventChecksum = await checksum(`${actor}:${action}:${detail}:${createdAt}`);
    const db = await getDb();
    const [event] = await db.insert(auditEvents).values({
      decisionId: decision.id,
      actor,
      action,
      detail,
      checksum: eventChecksum,
      createdAt,
    }).returning();
    return Response.json({ event }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Ledger write failed" }, { status: 500 });
  }
}
