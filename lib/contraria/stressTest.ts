import { normalizeControls, runSimulation } from "./simulation.ts";
import type { SimulationControls, SimulationResult } from "./types.ts";

export interface ShockScenario {
  name: string;
  description: string;
  controlsDelta: Partial<SimulationControls>;
}

export interface StressTestResult {
  scenarioName: string;
  survivalProbability: number;
  positiveNpvProbability: number;
  p10NPV: number;
  p50NPV: number;
  p90NPV: number;
  resilienceRating: "ROBUST" | "VULNERABLE" | "CRITICAL";
}

export class StressTestEngine {
  static PRESET_SHOCKS: ShockScenario[] = [
    {
      name: "Severe Supply Disruption",
      description: "Severe drop in manufacturing yield and market growth contraction",
      controlsDelta: { manufacturingYield: 65, marketGrowth: 5 },
    },
    {
      name: "Aggressive Competitor Price War",
      description: "Severe negative price premium with reduced conversion",
      controlsDelta: { pricePremium: -5, pilotConversion: 30 },
    },
    {
      name: "Regulatory & Compliance Delay Shock",
      description: "Severe regulatory delay combined with minimum market growth",
      controlsDelta: { regulatoryDelay: 24, marketGrowth: 4 },
    },
  ];

  static evaluateShocks(baseControls: Partial<SimulationControls> = {}, runs = 1000): StressTestResult[] {
    const baseline = normalizeControls(baseControls);

    return this.PRESET_SHOCKS.map((shock) => {
      const shockedControls: SimulationControls = {
        ...baseline,
        ...shock.controlsDelta,
      };

      const result: SimulationResult = runSimulation(shockedControls, runs);
      const survival = result.survivalProbability;
      const resilience: "ROBUST" | "VULNERABLE" | "CRITICAL" =
        survival >= 0.85 ? "ROBUST" : survival >= 0.55 ? "VULNERABLE" : "CRITICAL";

      return {
        scenarioName: shock.name,
        survivalProbability: Number(survival.toFixed(3)),
        positiveNpvProbability: Number(result.positiveNpvProbability.toFixed(3)),
        p10NPV: result.npv.p10,
        p50NPV: result.npv.p50,
        p90NPV: result.npv.p90,
        resilienceRating: resilience,
      };
    });
  }
}
