import { baselineControls, contradictions, decision, evidence, hypotheses } from "@/lib/contraria/data";
import { runSimulation } from "@/lib/contraria/simulation";

export async function GET() {
  return Response.json({
    decision,
    baselineControls,
    evidence,
    hypotheses,
    contradictions,
    simulation: runSimulation(baselineControls),
    generatedAt: new Date().toISOString(),
    model: "contraria-sim/0.9.3",
  });
}
