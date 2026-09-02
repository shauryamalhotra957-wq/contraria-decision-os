import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { StressTestEngine } from "../lib/contraria/stressTest.ts";

describe("StressTestEngine", () => {
  it("evaluates preset parametric shocks", () => {
    const results = StressTestEngine.evaluateShocks({}, 500);

    assert.equal(results.length, 3);
    for (const res of results) {
      assert.ok(res.scenarioName);
      assert.ok(res.survivalProbability >= 0 && res.survivalProbability <= 1);
      assert.ok(res.positiveNpvProbability >= 0 && res.positiveNpvProbability <= 1);
      assert.ok(["ROBUST", "VULNERABLE", "CRITICAL"].includes(res.resilienceRating));
      assert.ok(typeof res.p50NPV === "number");
    }
  });

  it("handles regulatory shock scenario", () => {
    const results = StressTestEngine.evaluateShocks({ marketGrowth: 6 }, 500);
    const regShock = results.find((r) => r.scenarioName === "Regulatory & Compliance Delay Shock");
    assert.ok(regShock);
    assert.ok(regShock.survivalProbability >= 0);
  });
});
