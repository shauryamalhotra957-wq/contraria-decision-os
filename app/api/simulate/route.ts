import { runSimulation } from "@/lib/contraria/simulation";
import type { SimulationControls } from "@/lib/contraria/types";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    controls?: Partial<SimulationControls>;
    iterations?: number;
    seed?: number;
  };
  const seed = Number.isFinite(payload.seed) ? Number(payload.seed) : Math.floor(Date.now() % 1_000_000);
  const result = runSimulation(payload.controls, payload.iterations ?? 10_000, seed);
  return Response.json({ result, model: "contraria-sim/0.9.3", generatedAt: new Date().toISOString() });
}
