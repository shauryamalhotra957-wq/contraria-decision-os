import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSearchLimit } from "../app/api/search/route";

test("search limits are finite and bounded", () => {
  assert.equal(normalizeSearchLimit(4), 4);
  assert.equal(normalizeSearchLimit(0), 1);
  assert.equal(normalizeSearchLimit(99), 12);
  assert.equal(normalizeSearchLimit(Number.NaN), 6);
  assert.equal(normalizeSearchLimit("4"), 6);
});
