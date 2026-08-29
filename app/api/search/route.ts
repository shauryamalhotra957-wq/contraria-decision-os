import { hybridRetrieve } from "@/lib/contraria/retrieval";

export function normalizeSearchLimit(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? Math.max(1, Math.min(12, value))
    : 6;
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { query?: string; limit?: unknown };
  const query = payload.query?.trim().slice(0, 240) ?? "";
  if (query.length < 2) {
    return Response.json({ error: "Query must contain at least two characters." }, { status: 400 });
  }
  const results = hybridRetrieve(query, normalizeSearchLimit(payload.limit));
  return Response.json({
    query,
    results,
    retrieval: { strategy: "BM25 + feature-hash embeddings + reciprocal rank fusion", corpusSize: 16 },
  });
}
