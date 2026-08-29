import assert from "node:assert/strict";
import test from "node:test";
import { normalizeIterations, normalizeSeed } from "../app/api/simulate/route";

test("simulation iteration counts stay finite and within execution bounds", () => {
  assert.equal(normalizeIterations(2500), 2500);
  assert.equal(normalizeIterations(10), 1000);
  assert.equal(normalizeIterations(100000), 50000);
  assert.equal(normalizeIterations(Number.NaN), 10000);
  assert.equal(normalizeIterations("2500"), 10000);
});

test("simulation seeds reject unsafe and non-numeric values", () => {
  assert.equal(normalizeSeed(42), 42);
  assert.notEqual(normalizeSeed(Number.MAX_SAFE_INTEGER + 1), Number.MAX_SAFE_INTEGER + 1);
  assert.notEqual(normalizeSeed("42"), 42);
});
