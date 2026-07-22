import assert from "node:assert/strict";
import test from "node:test";
import { evidence } from "../lib/contraria/data";
import { cosine, embed, hybridRetrieve, tokenize } from "../lib/contraria/retrieval";
import { normalizeControls, runSimulation } from "../lib/contraria/simulation";

test("tokenizer normalizes prose and removes stop words", () => {
  assert.deepEqual(tokenize("What is the German market-growth outlook?"), ["german", "market-growth", "outlook"]);
});

test("feature-hash embeddings are normalized and semantically stable", () => {
  const vector = embed("manufacturing yield and unit economics");
  const norm = Math.sqrt(vector.reduce((sum, value) => sum + value ** 2, 0));
  assert.ok(Math.abs(norm - 1) < 1e-10);
  assert.ok(cosine(embed("pack cycle life reliability"), embed("cycle life of the battery pack")) > cosine(embed("pack cycle life reliability"), embed("German market subsidy timing")));
});

test("hybrid retrieval finds evidence by concept and preserves provenance", () => {
  const results = hybridRetrieve("Why is production yield a launch risk?", 5);
  assert.equal(results.length, 5);
  assert.ok(results.slice(0, 3).some((result) => result.id === "E-09"));
  assert.ok(results.every((result) => evidence.some((source) => source.id === result.id)));
  assert.ok(results[0].score >= results[1].score);
});

test("simulation is deterministic for a fixed seed", () => {
  const first = runSimulation(undefined, 2_500, 42);
  const second = runSimulation(undefined, 2_500, 42);
  assert.deepEqual(first, second);
  assert.equal(first.iterations, 2_500);
  assert.ok(first.positiveNpvProbability > 0 && first.positiveNpvProbability < 1);
  assert.ok(first.npv.p10 < first.npv.p50 && first.npv.p50 < first.npv.p90);
});

test("upside assumptions improve the modeled outcome", () => {
  const downside = runSimulation({ marketGrowth: 10, pricePremium: 4, manufacturingYield: 70, pilotConversion: 30, regulatoryDelay: 14 }, 4_000, 711);
  const upside = runSimulation({ marketGrowth: 32, pricePremium: 21, manufacturingYield: 91, pilotConversion: 82, regulatoryDelay: 1 }, 4_000, 711);
  assert.ok(upside.npv.p50 > downside.npv.p50);
  assert.ok(upside.positiveNpvProbability > downside.positiveNpvProbability);
  assert.ok(upside.survivalProbability > downside.survivalProbability);
});

test("hostile controls are clamped into the model domain", () => {
  assert.deepEqual(normalizeControls({ marketGrowth: -200, pricePremium: 900, manufacturingYield: 2, pilotConversion: 400, regulatoryDelay: -4 }), {
    marketGrowth: 4,
    pricePremium: 28,
    manufacturingYield: 65,
    pilotConversion: 90,
    regulatoryDelay: 0,
  });
});
