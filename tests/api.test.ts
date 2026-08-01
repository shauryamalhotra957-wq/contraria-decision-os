import assert from "node:assert/strict";
import test from "node:test";
import { GET as getDecision } from "../app/api/decision/route";
import { GET as getLedger, POST as appendLedger } from "../app/api/ledger/route";
import { POST as search } from "../app/api/search/route";
import { POST as simulate } from "../app/api/simulate/route";

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function malformedRequest() {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
}

async function payload(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

test("decision endpoint returns the complete baseline contract", async () => {
  const response = await getDecision();
  const body = await payload(response);

  assert.equal(response.status, 200);
  assert.equal(typeof body.decision, "object");
  assert.ok(Array.isArray(body.evidence));
  assert.ok(Array.isArray(body.hypotheses));
  assert.equal(typeof body.simulation, "object");
  assert.equal(body.model, "contraria-sim/0.9.3");
});

test("search validates short queries and preserves provenance", async () => {
  const invalid = await search(jsonRequest({ query: " x " }));
  assert.equal(invalid.status, 400);

  const valid = await search(jsonRequest({ query: "production yield risk", limit: 4 }));
  const body = await payload(valid);
  const results = body.results as Array<Record<string, unknown>>;

  assert.equal(valid.status, 200);
  assert.equal(results.length, 4);
  assert.ok(results.every((result) => typeof result.id === "string"));
});

test("simulation is deterministic for an explicit seed", async () => {
  const request = () =>
    jsonRequest({
      controls: { marketGrowth: 20, manufacturingYield: 82 },
      iterations: 1_200,
      seed: 71422,
    });
  const first = await payload(await simulate(request()));
  const second = await payload(await simulate(request()));

  assert.equal(first.generatedAt !== undefined, true);
  assert.deepEqual(first.result, second.result);
});

test("simulation safely falls back to defaults for malformed JSON", async () => {
  const response = await simulate(malformedRequest());
  const body = await payload(response);

  assert.equal(response.status, 200);
  assert.equal(typeof body.result, "object");
});

test("ledger validates details before accessing D1", async () => {
  const response = await appendLedger(jsonRequest({ actor: "operator", detail: "  " }));

  assert.equal(response.status, 400);
  assert.deepEqual(await payload(response), { error: "detail is required" });
});

test("ledger returns JSON failures when D1 is unavailable", async () => {
  const readResponse = await getLedger();
  const malformedResponse = await appendLedger(malformedRequest());

  assert.equal(readResponse.status, 500);
  assert.equal(typeof (await payload(readResponse)).error, "string");
  assert.equal(malformedResponse.status, 500);
  assert.equal(typeof (await payload(malformedResponse)).error, "string");
});
