import { hybridRetrieve } from "@/lib/contraria/retrieval";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as { query?: string; limit?: number };
  const query = payload.query?.trim() ?? "";
  if (query.length < 2) {
    return Response.json({ error: "Query must contain at least two characters." }, { status: 400 });
  }
  const results = hybridRetrieve(query, payload.limit ?? 6);
  return Response.json({
    query,
    results,
    retrieval: { strategy: "BM25 + feature-hash embeddings + reciprocal rank fusion", corpusSize: 16 },
  });
}
