export type EvidenceStance = "support" | "counter" | "neutral";

export type EvidenceSource = {
  id: string;
  source: string;
  title: string;
  body: string;
  sourceType: "internal" | "market" | "technical" | "regulatory" | "customer";
  stance: EvidenceStance;
  reliability: number;
  observedAt: string;
  tags: string[];
};

export type Hypothesis = {
  id: string;
  label: string;
  thesis: string;
  confidence: number;
  evidenceIds: string[];
  counterIds: string[];
  position: { x: number; y: number };
};

export type Contradiction = {
  id: string;
  title: string;
  detail: string;
  severity: "material" | "watch";
  evidenceIds: [string, string];
  delta: string;
};

export type SearchResult = EvidenceSource & {
  score: number;
  lexicalScore: number;
  semanticScore: number;
  snippet: string;
};

export type SimulationControls = {
  marketGrowth: number;
  pricePremium: number;
  manufacturingYield: number;
  pilotConversion: number;
  regulatoryDelay: number;
};

export type SimulationResult = {
  iterations: number;
  seed: number;
  positiveNpvProbability: number;
  survivalProbability: number;
  recommendationConfidence: number;
  npv: { p10: number; p50: number; p90: number; mean: number };
  breakEvenMonth: { p10: number; p50: number; p90: number };
  histogram: Array<{ floor: number; ceil: number; count: number }>;
  sensitivity: Array<{ variable: keyof SimulationControls; impact: number }>;
  failureModes: Array<{ label: string; probability: number; contribution: number }>;
};

export type AuditEvent = {
  id: number | string;
  actor: string;
  action: string;
  detail: string;
  checksum: string;
  createdAt: string;
};
