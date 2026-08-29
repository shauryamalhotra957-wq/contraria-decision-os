import { runSimulation } from "@/lib/contraria/simulation";
import type { SimulationControls } from "@/lib/contraria/types";

export function normalizeIterations(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? Math.max(1_000, Math.min(50_000, value))
    : 10_000;
}

export function normalizeSeed(value: unknown): number {
  return typeof value === "number" && Number.isSafeInteger(value)
    ? value
    : Math.floor(Date.now() % 1_000_000);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    controls?: Partial<SimulationControls>;
    iterations?: unknown;
    seed?: unknown;
  };
  const seed = normalizeSeed(payload.seed);
  const iterations = normalizeIterations(payload.iterations);
  const result = runSimulation(payload.controls, iterations, seed);
  return Response.json({ result, model: "contraria-sim/0.9.3", generatedAt: new Date().toISOString() });
}
