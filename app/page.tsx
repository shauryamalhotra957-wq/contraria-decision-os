import { Contraria } from "./contraria";
import { baselineControls, contradictions, decision, evidence, hypotheses } from "@/lib/contraria/data";
import { runSimulation } from "@/lib/contraria/simulation";

export default function Home() {
  return (
    <Contraria
      decision={decision}
      evidence={evidence}
      hypotheses={hypotheses}
      contradictions={contradictions}
      baselineControls={baselineControls}
      initialSimulation={runSimulation(baselineControls)}
    />
  );
}
