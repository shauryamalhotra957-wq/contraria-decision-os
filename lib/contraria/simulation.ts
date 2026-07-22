import { baselineControls } from "./data";
import type { SimulationControls, SimulationResult } from "./types";

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value));
}

function rng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(random: () => number, mean: number, standardDeviation: number) {
  const first = Math.max(random(), Number.EPSILON);
  const second = random();
  return mean + Math.sqrt(-2 * Math.log(first)) * Math.cos(2 * Math.PI * second) * standardDeviation;
}

function percentile(sorted: number[], position: number) {
  if (!sorted.length) return 0;
  const index = clamp(position, 0, 1) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

function correlation(left: number[], right: number[]) {
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let numerator = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    numerator += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }
  return numerator / Math.sqrt(Math.max(Number.EPSILON, leftVariance * rightVariance));
}

export function normalizeControls(input: Partial<SimulationControls>): SimulationControls {
  return {
    marketGrowth: clamp(Number(input.marketGrowth ?? baselineControls.marketGrowth), 4, 42),
    pricePremium: clamp(Number(input.pricePremium ?? baselineControls.pricePremium), -5, 28),
    manufacturingYield: clamp(Number(input.manufacturingYield ?? baselineControls.manufacturingYield), 65, 94),
    pilotConversion: clamp(Number(input.pilotConversion ?? baselineControls.pilotConversion), 25, 90),
    regulatoryDelay: clamp(Number(input.regulatoryDelay ?? baselineControls.regulatoryDelay), 0, 18),
  };
}

export function runSimulation(
  rawControls: Partial<SimulationControls> = baselineControls,
  iterations = 10_000,
  seed = 71_422,
): SimulationResult {
  const controls = normalizeControls(rawControls);
  const count = Math.max(1_000, Math.min(50_000, Math.floor(iterations)));
  const random = rng(seed);
  const outcomes: number[] = [];
  const breakEvenMonths: number[] = [];
  const sampled: Record<keyof SimulationControls, number[]> = {
    marketGrowth: [],
    pricePremium: [],
    manufacturingYield: [],
    pilotConversion: [],
    regulatoryDelay: [],
  };
  let survived = 0;
  let certificationFailures = 0;
  let yieldFailures = 0;
  let demandFailures = 0;
  let liquidityFailures = 0;

  for (let index = 0; index < count; index += 1) {
    const marketGrowth = clamp(normal(random, controls.marketGrowth, 4.2), -5, 55);
    const pricePremium = clamp(normal(random, controls.pricePremium, 4.8), -12, 36);
    const manufacturingYield = clamp(normal(random, controls.manufacturingYield, 4.1), 55, 98);
    const pilotConversion = clamp(normal(random, controls.pilotConversion, 9.5), 8, 98);
    const regulatoryDelay = clamp(normal(random, controls.regulatoryDelay, 2.6), 0, 24);

    const materialSpike = random() < 0.18 ? 0.075 + random() * 0.065 : 0;
    const competitorBreakthrough = random() < 0.12;
    const subsidyLapse = random() < 0.09 + regulatoryDelay / 220;
    const thermalFixMiss = random() < clamp(0.31 - (manufacturingYield - 72) / 120, 0.08, 0.36);

    const marketSize = 720 * (1 + marketGrowth / 100) ** 2;
    const share = clamp(0.018 + pilotConversion / 1000 - regulatoryDelay / 1500 - (competitorBreakthrough ? 0.014 : 0), 0.008, 0.12);
    const grossMargin = 0.13 + pricePremium * 0.009 + (manufacturingYield - 74) * 0.006 - materialSpike;
    const grant = subsidyLapse ? 0 : 7.2;
    const annualRevenue = marketSize * share;
    const certificationCost = regulatoryDelay * 1.15 + (thermalFixMiss ? 7.8 : 0);
    const npv = annualRevenue * grossMargin * 4.2 - 64 + grant - certificationCost;
    const breakEven = clamp(44 - npv * 0.39 + regulatoryDelay * 0.8 + (thermalFixMiss ? 4 : 0), 12, 72);
    const survival = npv > -12 && grossMargin > 0.095 && breakEven < 49 && !(subsidyLapse && regulatoryDelay > 12);

    outcomes.push(npv);
    breakEvenMonths.push(breakEven);
    sampled.marketGrowth.push(marketGrowth);
    sampled.pricePremium.push(pricePremium);
    sampled.manufacturingYield.push(manufacturingYield);
    sampled.pilotConversion.push(pilotConversion);
    sampled.regulatoryDelay.push(regulatoryDelay);
    if (survival) survived += 1;
    if (thermalFixMiss || regulatoryDelay > 11) certificationFailures += 1;
    if (manufacturingYield < 76) yieldFailures += 1;
    if (pilotConversion < 43 || competitorBreakthrough) demandFailures += 1;
    if (!survival && (npv < -12 || breakEven >= 49)) liquidityFailures += 1;
  }

  const sorted = [...outcomes].sort((left, right) => left - right);
  const breakEvenSorted = [...breakEvenMonths].sort((left, right) => left - right);
  const positive = outcomes.filter((value) => value > 0).length / count;
  const survivalProbability = survived / count;
  const minimum = Math.floor(percentile(sorted, 0.01) / 10) * 10;
  const maximum = Math.ceil(percentile(sorted, 0.99) / 10) * 10;
  const bucketCount = 14;
  const bucketWidth = Math.max(5, (maximum - minimum) / bucketCount);
  const histogram = Array.from({ length: bucketCount }, (_, bucket) => ({
    floor: minimum + bucket * bucketWidth,
    ceil: minimum + (bucket + 1) * bucketWidth,
    count: 0,
  }));
  outcomes.forEach((outcome) => {
    const bucket = clamp(Math.floor((outcome - minimum) / bucketWidth), 0, bucketCount - 1);
    histogram[bucket].count += 1;
  });

  const sensitivity = (Object.keys(sampled) as Array<keyof SimulationControls>)
    .map((variable) => ({ variable, impact: correlation(sampled[variable], outcomes) }))
    .sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact));

  const failureModes = [
    { label: "Certification / thermal remediation", probability: certificationFailures / count, contribution: 0.34 },
    { label: "Yield below commercial threshold", probability: yieldFailures / count, contribution: 0.27 },
    { label: "Demand conversion shortfall", probability: demandFailures / count, contribution: 0.23 },
    { label: "Liquidity floor breach", probability: liquidityFailures / count, contribution: 0.16 },
  ].sort((left, right) => right.probability * right.contribution - left.probability * left.contribution);

  const confidence = clamp(0.405 + positive * 0.22 + survivalProbability * 0.18 + (1 - Math.abs(0.5 - positive)) * 0.04, 0, 0.91);

  return {
    iterations: count,
    seed,
    positiveNpvProbability: positive,
    survivalProbability,
    recommendationConfidence: confidence,
    npv: {
      p10: percentile(sorted, 0.1),
      p50: percentile(sorted, 0.5),
      p90: percentile(sorted, 0.9),
      mean: outcomes.reduce((sum, value) => sum + value, 0) / count,
    },
    breakEvenMonth: {
      p10: percentile(breakEvenSorted, 0.1),
      p50: percentile(breakEvenSorted, 0.5),
      p90: percentile(breakEvenSorted, 0.9),
    },
    histogram,
    sensitivity,
    failureModes,
  };
}
