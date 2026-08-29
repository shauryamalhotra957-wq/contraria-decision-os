import assert from "node:assert/strict";
import test from "node:test";
import { normalizeControls } from "../lib/contraria/simulation";

test("non-finite controls fall back to baseline values", () => {
  const normalized = normalizeControls({
    marketGrowth: Number.NaN,
    pricePremium: Infinity,
    manufacturingYield: Number.NEGATIVE_INFINITY,
  });
  assert.equal(normalized.marketGrowth, 22.4);
  assert.equal(normalized.pricePremium, 12);
  assert.equal(normalized.manufacturingYield, 81);
});
