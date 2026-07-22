"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { AuditEvent, Contradiction, EvidenceSource, Hypothesis, SearchResult, SimulationControls, SimulationResult } from "@/lib/contraria/types";

type View = "decision" | "evidence" | "simulation" | "ledger";
type DecisionInfo = {
  id: string;
  title: string;
  shortTitle: string;
  recommendation: string;
  confidence: number;
  owner: string;
  deadline: string;
  capitalAtRisk: string;
  reversibility: string;
};

const nav: Array<{ id: View; label: string; glyph: string; hint: string }> = [
  { id: "decision", label: "Decision", glyph: "◈", hint: "1" },
  { id: "evidence", label: "Evidence", glyph: "⌬", hint: "2" },
  { id: "simulation", label: "Worlds", glyph: "∿", hint: "3" },
  { id: "ledger", label: "Trace", glyph: "≡", hint: "4" },
];

const controlMeta: Array<{ key: keyof SimulationControls; label: string; min: number; max: number; step: number; suffix: string }> = [
  { key: "marketGrowth", label: "Market growth", min: 4, max: 42, step: 0.5, suffix: "%" },
  { key: "pricePremium", label: "Price premium", min: -5, max: 28, step: 1, suffix: "%" },
  { key: "manufacturingYield", label: "First-pass yield", min: 65, max: 94, step: 1, suffix: "%" },
  { key: "pilotConversion", label: "Pilot conversion", min: 25, max: 90, step: 1, suffix: "%" },
  { key: "regulatoryDelay", label: "Regulatory delay", min: 0, max: 18, step: 1, suffix: " mo" },
];

const formatMoney = (value: number) => `${value < 0 ? "−" : ""}$${Math.abs(value).toFixed(1)}M`;
const formatPercent = (value: number) => `${Math.round(value * 100)}%`;

function GraphCanvas({ hypotheses, evidence, selected, onSelect }: {
  hypotheses: Hypothesis[];
  evidence: EvidenceSource[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return;
    const paint = () => {
      const bounds = host.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = bounds.width * ratio;
      canvas.height = bounds.height * ratio;
      canvas.style.width = `${bounds.width}px`;
      canvas.style.height = `${bounds.height}px`;
      const context = canvas.getContext("2d");
      if (!context) return;
      context.scale(ratio, ratio);
      context.clearRect(0, 0, bounds.width, bounds.height);
      const centers = new Map(hypotheses.map((item) => [item.id, { x: bounds.width * item.position.x / 100, y: bounds.height * item.position.y / 100 }]));
      const linkedEvidence = evidence.slice(0, 16).map((item, index) => {
        const angle = -Math.PI / 2 + index * (Math.PI * 2 / 16);
        return { item, x: bounds.width / 2 + Math.cos(angle) * bounds.width * 0.42, y: bounds.height / 2 + Math.sin(angle) * bounds.height * 0.41 };
      });
      context.lineWidth = 1;
      hypotheses.forEach((hypothesis) => {
        const center = centers.get(hypothesis.id)!;
        [...hypothesis.evidenceIds, ...hypothesis.counterIds].forEach((evidenceId) => {
          const endpoint = linkedEvidence.find(({ item }) => item.id === evidenceId);
          if (!endpoint) return;
          const counter = hypothesis.counterIds.includes(evidenceId);
          context.beginPath();
          context.moveTo(center.x, center.y);
          context.lineTo(endpoint.x, endpoint.y);
          context.strokeStyle = counter ? "rgba(255, 92, 82, .3)" : "rgba(168, 255, 120, .22)";
          context.setLineDash(counter ? [4, 5] : []);
          context.stroke();
        });
      });
      context.setLineDash([]);
      linkedEvidence.forEach(({ item, x, y }) => {
        context.beginPath();
        context.arc(x, y, item.stance === "counter" ? 4 : 3, 0, Math.PI * 2);
        context.fillStyle = item.stance === "counter" ? "#ff625a" : item.stance === "support" ? "#a9ff78" : "#8e9b97";
        context.fill();
        context.font = "9px ui-monospace, monospace";
        context.fillStyle = "rgba(224,235,230,.55)";
        context.fillText(item.id, x + 7, y + 3);
      });
    };
    paint();
    const observer = new ResizeObserver(paint);
    observer.observe(host);
    return () => observer.disconnect();
  }, [evidence, hypotheses]);

  return (
    <div className="graph-host" ref={hostRef}>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="graph-core"><span>DECISION</span><strong>78</strong><small>confidence</small></div>
      {hypotheses.map((hypothesis) => (
        <button
          className={`hypothesis-node ${selected === hypothesis.id ? "selected" : ""}`}
          key={hypothesis.id}
          style={{ left: `${hypothesis.position.x}%`, top: `${hypothesis.position.y}%` }}
          onClick={() => onSelect(hypothesis.id)}
          aria-pressed={selected === hypothesis.id}
        >
          <span>{hypothesis.id}</span>
          <strong>{hypothesis.label}</strong>
          <em>{hypothesis.confidence}%</em>
        </button>
      ))}
    </div>
  );
}

function Histogram({ result }: { result: SimulationResult }) {
  const maximum = Math.max(...result.histogram.map((bucket) => bucket.count), 1);
  return (
    <div className="histogram" aria-label="Net present value probability distribution">
      <div className="zero-axis" />
      {result.histogram.map((bucket, index) => (
        <div className="hist-bar-wrap" key={`${bucket.floor}-${index}`} title={`${formatMoney(bucket.floor)} to ${formatMoney(bucket.ceil)} · ${bucket.count} worlds`}>
          <div className={`hist-bar ${bucket.ceil < 0 ? "negative" : ""}`} style={{ height: `${Math.max(4, bucket.count / maximum * 100)}%` }} />
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value, sub, tone = "default" }: { label: string; value: string; sub: string; tone?: "default" | "good" | "risk" }) {
  return <article className={`metric-card ${tone}`}><span>{label}</span><strong>{value}</strong><small>{sub}</small></article>;
}

export function Contraria({ decision, evidence, hypotheses, contradictions, baselineControls, initialSimulation }: {
  decision: DecisionInfo;
  evidence: EvidenceSource[];
  hypotheses: Hypothesis[];
  contradictions: Contradiction[];
  baselineControls: SimulationControls;
  initialSimulation: SimulationResult;
}) {
  const [view, setView] = useState<View>("decision");
  const [controls, setControls] = useState(baselineControls);
  const [simulation, setSimulation] = useState(initialSimulation);
  const [running, setRunning] = useState(false);
  const [selectedHypothesis, setSelectedHypothesis] = useState(hypotheses[0].id);
  const [selectedEvidence, setSelectedEvidence] = useState(evidence[0].id);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [ledger, setLedger] = useState<AuditEvent[]>([]);
  const [toast, setToast] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const writeLedger = useCallback(async (action: string, detail: string) => {
    try {
      const response = await fetch("/api/ledger", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ actor: "OPERATOR", action, detail }) });
      if (!response.ok) return;
      const payload = await response.json() as { event: AuditEvent };
      setLedger((current) => [payload.event, ...current]);
    } catch { /* Non-blocking audit sync. */ }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/ledger")
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Ledger unavailable")))
      .then((payload: { events: AuditEvent[] }) => { if (active) setLedger(payload.events); })
      .catch(() => { /* The core product remains useful while persistence reconnects. */ });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      const target = nav[Number(event.key) - 1];
      if (target) setView(target.id);
      if (event.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeHypothesis = hypotheses.find((item) => item.id === selectedHypothesis) ?? hypotheses[0];
  const activeEvidence = evidence.find((item) => item.id === selectedEvidence) ?? evidence[0];
  const supportCount = evidence.filter((item) => item.stance === "support").length;
  const challengeCount = evidence.filter((item) => item.stance === "counter").length;

  const runWorlds = useCallback(async (nextControls = controls) => {
    setRunning(true);
    try {
      const response = await fetch("/api/simulate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ controls: nextControls, iterations: 10_000 }) });
      if (!response.ok) throw new Error("Simulation failed");
      const payload = await response.json() as { result: SimulationResult };
      setSimulation(payload.result);
      void writeLedger("SIMULATION", `10,000 worlds · P(NPV>0) ${formatPercent(payload.result.positiveNpvProbability)} · seed ${payload.result.seed}`);
      notify("10,000 possible worlds resolved");
    } catch {
      notify("The simulation engine did not respond");
    } finally {
      setRunning(false);
    }
  }, [controls, notify, writeLedger]);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setSearching(true);
    setSearchOpen(true);
    try {
      const response = await fetch("/api/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ query, limit: 6 }) });
      const payload = await response.json() as { results: SearchResult[] };
      setSearchResults(payload.results ?? []);
    } finally { setSearching(false); }
  };

  const setPreset = (name: "upside" | "base" | "downside") => {
    const next = name === "upside"
      ? { marketGrowth: 29, pricePremium: 18, manufacturingYield: 88, pilotConversion: 75, regulatoryDelay: 2 }
      : name === "downside"
        ? { marketGrowth: 12, pricePremium: 7, manufacturingYield: 74, pilotConversion: 39, regulatoryDelay: 11 }
        : baselineControls;
    setControls(next);
    void runWorlds(next);
  };

  const exportMemo = () => {
    const memo = `# CONTRARIA Decision Memo\n\n## ${decision.title}\n\n**Recommendation:** ${decision.recommendation} (${Math.round(simulation.recommendationConfidence * 100)}% confidence)\n\nProceed only if: (1) pack endurance clears 360 cycles, (2) a 10-year warranty wrap is secured, and (3) first-pass yield exceeds 83% before tooling release.\n\n## Probabilistic case\n- P(NPV > 0): ${formatPercent(simulation.positiveNpvProbability)}\n- Survival probability: ${formatPercent(simulation.survivalProbability)}\n- Median NPV: ${formatMoney(simulation.npv.p50)}\n- NPV 80% interval: ${formatMoney(simulation.npv.p10)} — ${formatMoney(simulation.npv.p90)}\n\n## Material contradictions\n${contradictions.map((item) => `- ${item.title}: ${item.detail} (${item.delta})`).join("\n")}\n\nGenerated from ${evidence.length} sources by CONTRARIA model v0.9.3.`;
    const url = URL.createObjectURL(new Blob([memo], { type: "text/markdown" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "contraria-novacell-decision-memo.md";
    anchor.click();
    URL.revokeObjectURL(url);
    void writeLedger("EXPORT", "Decision memo exported as Markdown");
    notify("Decision memo exported");
  };

  const copyBrief = async () => {
    await navigator.clipboard?.writeText(`${decision.recommendation}: ${decision.shortTitle}. ${formatPercent(simulation.positiveNpvProbability)} probability of positive NPV; gates: pack life ≥360 cycles, yield ≥83%, 10-year warranty.`);
    notify("Review brief copied");
  };

  return (
    <div className="app-shell">
      <aside className="rail">
        <button className="brand" aria-label="CONTRARIA home" onClick={() => setView("decision")}><span>C</span><i /></button>
        <nav aria-label="Decision workspace">
          {nav.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => setView(item.id)} title={`${item.label} · ${item.hint}`}><b>{item.glyph}</b><span>{item.label}</span><kbd>{item.hint}</kbd></button>)}
        </nav>
        <div className="rail-status"><i /><span>LIVE</span></div>
        <button className="avatar" title="Workspace operator">SM</button>
      </aside>

      <div className="workbench">
        <header className="topbar">
          <div className="wordmark">CONTRARIA<span>/</span><small>DECISION OS</small></div>
          <form className="command" onSubmit={search} role="search">
            <span>⌕</span><input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Interrogate all evidence…" aria-label="Search decision evidence" /><kbd>⌘ K</kbd>
          </form>
          <div className="system-state"><span><i /> EVIDENCE SYNCED</span><button onClick={copyBrief}>COPY REVIEW</button><button className="primary-small" onClick={exportMemo}>EXPORT MEMO</button></div>
        </header>

        <main>
          <div className="decision-header">
            <div><div className="eyebrow"><span>ACTIVE DECISION</span><i /> MODEL v0.9.3 <i /> UPDATED 18 JUL</div><h1>{decision.title}</h1></div>
            <div className="decision-meta"><span>OWNER<strong>{decision.owner}</strong></span><span>DECISION DATE<strong>{decision.deadline}</strong></span><span>CAPITAL AT RISK<strong>{decision.capitalAtRisk}</strong></span></div>
          </div>

          {view === "decision" && <section className="view decision-view">
            <div className="hero-grid">
              <article className="verdict-card panel">
                <div className="panel-label"><span>CONTRARIA VERDICT</span><em>04 GATES ACTIVE</em></div>
                <div className="verdict-body">
                  <div className="verdict-signal"><i /><div><small>RECOMMENDATION</small><strong>{decision.recommendation}</strong></div></div>
                  <p>Authorize the German launch path, but release production tooling only after pack endurance, warranty, and yield gates clear.</p>
                  <div className="gate-list">
                    <div><span>01</span><p><strong>Pack life ≥ 360 cycles</strong><small>Production-intent enclosure · due 19 Aug</small></p><em className="risk">OPEN</em></div>
                    <div><span>02</span><p><strong>First-pass yield ≥ 83%</strong><small>Consecutive 5,000-unit run</small></p><em className="watch">78.2%</em></div>
                    <div><span>03</span><p><strong>10-year warranty wrap</strong><small>Investment-grade counterparty</small></p><em className="watch">7 YR</em></div>
                    <div><span>04</span><p><strong>Grant decision before tooling</strong><small>Cap downside at $4.0M</small></p><em className="good">TRACK</em></div>
                  </div>
                </div>
              </article>

              <article className="confidence-card panel">
                <div className="panel-label"><span>EPISTEMIC CONFIDENCE</span><em>CALIBRATED</em></div>
                <div className="confidence-body">
                  <div className="confidence-ring" style={{ "--score": `${simulation.recommendationConfidence * 360}deg` } as React.CSSProperties}><div><strong>{Math.round(simulation.recommendationConfidence * 100)}</strong><span>/ 100</span></div></div>
                  <div className="confidence-copy"><strong>Decision-grade</strong><p>Survives in {formatPercent(simulation.survivalProbability)} of modeled worlds. One material unknown can still flip the verdict.</p></div>
                </div>
                <div className="confidence-factors"><span>SOURCE QUALITY <b>88</b></span><span>CONTRADICTION LOAD <b>64</b></span><span>MODEL STABILITY <b>81</b></span><span>REVERSIBILITY <b>57</b></span></div>
              </article>

              <article className="red-team-card panel">
                <div className="panel-label"><span>WHAT WOULD PROVE US WRONG?</span><button onClick={() => { setView("evidence"); setSelectedHypothesis("H-03"); }}>OPEN RED TEAM ↗</button></div>
                <blockquote>“The validated cell may not be the product. If pack-level cooling remains uneven, the warranty model fails before market risk matters.”</blockquote>
                <div className="red-team-footer"><span>FLIP CONDITION</span><strong>Pack projection &lt; 340 cycles</strong><em>18% probability</em></div>
              </article>
            </div>

            <div className="metrics-row">
              <Metric label="P(NPV > 0)" value={formatPercent(simulation.positiveNpvProbability)} sub="+6 pts vs. prior model" tone="good" />
              <Metric label="Median NPV" value={formatMoney(simulation.npv.p50)} sub={`${formatMoney(simulation.npv.p10)} — ${formatMoney(simulation.npv.p90)} · 80% interval`} />
              <Metric label="Survival probability" value={formatPercent(simulation.survivalProbability)} sub="Cash floor never breached" tone="good" />
              <Metric label="Contradictions" value={`${contradictions.length}`} sub={`${contradictions.filter((item) => item.severity === "material").length} material · 1 watch`} tone="risk" />
            </div>

            <div className="lower-grid">
              <article className="scenario-panel panel">
                <div className="panel-label"><span>SCENARIO FRONTIER</span><button onClick={() => setView("simulation")}>RUN WORLDS ↗</button></div>
                <div className="scenario-head"><span>SCENARIO</span><span>WEIGHT</span><span>NPV RANGE</span><span>SURVIVAL</span></div>
                {[
                  ["Controlled ascent", "38%", "$34M — $91M", "92%", "positive"],
                  ["Base trajectory", "43%", "$4M — $47M", "78%", "base"],
                  ["Execution drag", "14%", "−$21M — $12M", "49%", "warning"],
                  ["Compound failure", "5%", "−$58M — −$24M", "11%", "danger"],
                ].map((row) => <div className="scenario-row" key={row[0]}><strong><i className={row[4]} />{row[0]}</strong><span>{row[1]}</span><span><b>{row[2]}</b><i className={`range ${row[4]}`} /></span><em>{row[3]}</em></div>)}
              </article>
              <article className="pulse-panel panel">
                <div className="panel-label"><span>EVIDENCE PULSE</span><b>{evidence.length} SOURCES</b></div>
                <div className="pulse-summary"><div><strong>{supportCount}</strong><span>support</span></div><div><strong>{challengeCount}</strong><span>challenge</span></div><div><strong>88%</strong><span>fresh</span></div></div>
                <div className="pulse-line" />
                <div className="evidence-events">
                  <button onClick={() => { setSelectedEvidence("E-09"); setView("evidence"); }}><i className="risk-dot"/><span><b>Yield gate weakened</b><small>E-09 · Run 6B closed at 78.2%</small></span><time>3H</time></button>
                  <button onClick={() => { setSelectedEvidence("E-16"); setView("evidence"); }}><i className="good-dot"/><span><b>Certification risk reduced</b><small>E-16 · 31/34 items closed</small></span><time>1D</time></button>
                  <button onClick={() => { setSelectedEvidence("E-07"); setView("evidence"); }}><i className="watch-dot"/><span><b>Conversion evidence challenged</b><small>E-07 · Paid behavior diverges</small></span><time>2D</time></button>
                </div>
              </article>
            </div>
          </section>}

          {view === "evidence" && <section className="view evidence-view">
            <div className="view-title"><div><span>PROVENANCE GRAPH</span><h2>See exactly what the verdict knows.</h2></div><div className="legend"><span><i className="good-dot"/> SUPPORT</span><span><i className="risk-dot"/> COUNTER</span><span>— DIRECT</span><span>┄ CONTRADICTION</span></div></div>
            <div className="evidence-layout">
              <article className="graph-panel panel"><GraphCanvas hypotheses={hypotheses} evidence={evidence} selected={selectedHypothesis} onSelect={setSelectedHypothesis} /></article>
              <aside className="hypothesis-panel panel">
                <div className="panel-label"><span>{activeHypothesis.id} · HYPOTHESIS</span><em>{activeHypothesis.confidence}% CONF.</em></div>
                <h3>{activeHypothesis.label}</h3><p>{activeHypothesis.thesis}</p>
                <div className="source-groups"><span>SUPPORTING SIGNALS</span>{activeHypothesis.evidenceIds.map((id) => { const item = evidence.find((entry) => entry.id === id)!; return <button key={id} onClick={() => setSelectedEvidence(id)} className={selectedEvidence === id ? "selected" : ""}><b>{id}</b><span>{item.title}</span><em>{Math.round(item.reliability * 100)}</em></button>; })}</div>
                <div className="source-groups counter"><span>COUNTEREVIDENCE</span>{activeHypothesis.counterIds.map((id) => { const item = evidence.find((entry) => entry.id === id)!; return <button key={id} onClick={() => setSelectedEvidence(id)} className={selectedEvidence === id ? "selected" : ""}><b>{id}</b><span>{item.title}</span><em>{Math.round(item.reliability * 100)}</em></button>; })}</div>
              </aside>
            </div>
            <div className="evidence-detail-grid">
              <article className="source-detail panel"><div className="source-top"><span>{activeEvidence.id} · {activeEvidence.sourceType}</span><em className={activeEvidence.stance}>{activeEvidence.stance}</em></div><h3>{activeEvidence.title}</h3><p>{activeEvidence.body}</p><footer><span>SOURCE <b>{activeEvidence.source}</b></span><span>OBSERVED <b>{activeEvidence.observedAt}</b></span><span>RELIABILITY <b>{Math.round(activeEvidence.reliability * 100)} / 100</b></span></footer></article>
              <article className="contradictions-panel panel"><div className="panel-label"><span>CONTRADICTION RADAR</span><em>{contradictions.length} DETECTED</em></div>{contradictions.map((item) => <button key={item.id} onClick={() => setSelectedEvidence(item.evidenceIds[0])}><b>{item.id}</b><span><strong>{item.title}</strong><small>{item.evidenceIds.join(" ↔ ")} · {item.detail}</small></span><em>{item.delta}</em></button>)}</article>
            </div>
          </section>}

          {view === "simulation" && <section className="view simulation-view">
            <div className="view-title"><div><span>COUNTERFACTUAL ENGINE</span><h2>Stress the strategy across possible worlds.</h2></div><div className="scenario-actions"><button onClick={() => setPreset("downside")}>DOWNSIDE</button><button onClick={() => setPreset("base")}>BASE</button><button onClick={() => setPreset("upside")}>UPSIDE</button></div></div>
            <div className="simulation-layout">
              <aside className="controls-panel panel">
                <div className="panel-label"><span>ASSUMPTION DECK</span><em>LIVE</em></div>
                {controlMeta.map((control) => <label className="control" key={control.key}><span>{control.label}<output>{controls[control.key]}{control.suffix}</output></span><input type="range" min={control.min} max={control.max} step={control.step} value={controls[control.key]} onChange={(event) => setControls((current) => ({ ...current, [control.key]: Number(event.target.value) }))} style={{ "--range": `${(controls[control.key] - control.min) / (control.max - control.min) * 100}%` } as React.CSSProperties}/><small>{control.min}{control.suffix}<b>BASE {baselineControls[control.key]}{control.suffix}</b>{control.max}{control.suffix}</small></label>)}
                <button className="run-button" onClick={() => void runWorlds()} disabled={running}><span>{running ? "RESOLVING WORLDS…" : "RUN 10,000 WORLDS"}</span><b>{running ? "◌" : "▶"}</b></button>
                <p className="model-note">Correlated shocks · grant lapse · thermal miss · competitor response · epistemic uncertainty</p>
              </aside>
              <div className="simulation-results">
                <div className="sim-metrics"><Metric label="P(NPV > 0)" value={formatPercent(simulation.positiveNpvProbability)} sub={`seed ${simulation.seed}`} tone="good"/><Metric label="P10 / P50 / P90" value={formatMoney(simulation.npv.p50)} sub={`${formatMoney(simulation.npv.p10)} · ${formatMoney(simulation.npv.p90)}`}/><Metric label="Break-even" value={`${Math.round(simulation.breakEvenMonth.p50)} MO`} sub={`${Math.round(simulation.breakEvenMonth.p10)} — ${Math.round(simulation.breakEvenMonth.p90)} month interval`}/></div>
                <article className="distribution-panel panel"><div className="panel-label"><span>NPV DISTRIBUTION · $M</span><em>{simulation.iterations.toLocaleString()} WORLDS</em></div><Histogram result={simulation}/><div className="distribution-axis"><span>{formatMoney(simulation.histogram[0].floor)}</span><span>0</span><span>{formatMoney(simulation.histogram.at(-1)?.ceil ?? 0)}</span></div><div className="percentile-markers"><span style={{ left: "18%" }}><i/>P10 {formatMoney(simulation.npv.p10)}</span><span style={{ left: "52%" }}><i/>P50 {formatMoney(simulation.npv.p50)}</span><span style={{ left: "82%" }}><i/>P90 {formatMoney(simulation.npv.p90)}</span></div></article>
                <div className="analysis-grid">
                  <article className="sensitivity-panel panel"><div className="panel-label"><span>GLOBAL SENSITIVITY</span><em>PEARSON r</em></div>{simulation.sensitivity.map((item) => <div className="sensitivity-row" key={item.variable}><span>{controlMeta.find((control) => control.key === item.variable)?.label}</span><div><i className={item.impact < 0 ? "negative" : ""} style={{ width: `${Math.abs(item.impact) * 100}%` }}/></div><b>{item.impact > 0 ? "+" : ""}{item.impact.toFixed(2)}</b></div>)}</article>
                  <article className="failure-panel panel"><div className="panel-label"><span>FAILURE MODE MASS</span><em>RANKED</em></div>{simulation.failureModes.map((item, index) => <div key={item.label}><b>0{index + 1}</b><span>{item.label}<i><em style={{ width: `${item.probability * 100}%` }}/></i></span><strong>{formatPercent(item.probability)}</strong></div>)}</article>
                </div>
              </div>
            </div>
          </section>}

          {view === "ledger" && <section className="view ledger-view">
            <div className="view-title"><div><span>DECISION PROVENANCE</span><h2>Every inference leaves a trace.</h2></div><button className="checkpoint" onClick={() => { void writeLedger("CHECKPOINT", `Human checkpoint · confidence ${Math.round(simulation.recommendationConfidence * 100)}%`); notify("Checkpoint sealed to the ledger"); }}>+ SEAL CHECKPOINT</button></div>
            <div className="ledger-stats"><Metric label="Ledger state" value="VERIFIED" sub="SHA-256 hash chain" tone="good"/><Metric label="Recorded events" value={String(ledger.length || 5)} sub="append-only log"/><Metric label="Source lineage" value="100%" sub="all claims attributable"/><Metric label="Human checkpoints" value="03" sub="2 approvers · 1 challenger"/></div>
            <div className="ledger-layout">
              <article className="ledger-panel panel"><div className="panel-label"><span>IMMUTABLE EVENT STREAM</span><em>D1 · CONSISTENT</em></div><div className="ledger-head"><span>TIME</span><span>ACTOR / ACTION</span><span>EVENT</span><span>CHECKSUM</span></div>{(ledger.length ? ledger : []).map((event) => <div className="ledger-row" key={event.id}><time>{new Date(event.createdAt).toISOString().slice(11, 19)}<small>{new Date(event.createdAt).toISOString().slice(0, 10)}</small></time><span><b>{event.actor}</b><em>{event.action}</em></span><p>{event.detail}</p><code>{event.checksum}</code></div>)}{!ledger.length && <div className="ledger-loading">Synchronizing the decision ledger…</div>}</article>
              <aside className="lineage-panel panel"><div className="panel-label"><span>INFERENCE LINEAGE</span><em>ACTIVE PATH</em></div><div className="lineage-flow"><div><b>01</b><span>SOURCE LAYER<small>16 documents · 5 modalities</small></span></div><i/><div><b>02</b><span>CLAIM LAYER<small>47 normalized assertions</small></span></div><i/><div><b>03</b><span>CONFLICT LAYER<small>4 contradiction clusters</small></span></div><i/><div><b>04</b><span>WORLD MODEL<small>10,000 counterfactuals</small></span></div><i/><div className="active"><b>05</b><span>HUMAN GATE<small>Conditional authorization</small></span></div></div><footer><span>MODEL CARD</span><strong>contraria-sim/0.9.3</strong><small>Deterministic · inspectable · no hidden LLM calls</small></footer></aside>
            </div>
          </section>}
        </main>
        <footer className="statusbar"><span><i/> SYSTEM NOMINAL</span><span>HYBRID RETRIEVAL · 16 SOURCES</span><span>MONTE CARLO · {simulation.iterations.toLocaleString()} WORLDS</span><span>LAST COMPUTE {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><strong>⌁ CONTRARIA LABS</strong></footer>
      </div>

      {searchOpen && <div className="search-overlay" role="dialog" aria-modal="true" aria-label="Evidence answer"><button className="scrim" onClick={() => setSearchOpen(false)} aria-label="Close search"/><div className="search-drawer"><header><div><span>EVIDENCE INTERROGATION</span><strong>{query}</strong></div><button onClick={() => setSearchOpen(false)}>ESC</button></header>{searching ? <div className="searching"><i/><span>Fusing lexical and semantic retrieval…</span></div> : <><article className="synthesis"><span>GROUNDED SYNTHESIS</span><p>{searchResults.length ? <>The strongest available signal is <b>{searchResults[0].title.toLowerCase()}</b>. {searchResults.find((item) => item.stance === "counter") ? <>However, {searchResults.find((item) => item.stance === "counter")!.title.toLowerCase()} remains material counterevidence.</> : "No directly opposing evidence ranked in the top results."} The current verdict should be treated as conditional, not categorical.</> : "No evidence matched this interrogation."}</p><footer>{searchResults.slice(0, 4).map((item) => <button key={item.id} onClick={() => { setSelectedEvidence(item.id); setSelectedHypothesis(hypotheses.find((hypothesis) => [...hypothesis.evidenceIds, ...hypothesis.counterIds].includes(item.id))?.id ?? hypotheses[0].id); setView("evidence"); setSearchOpen(false); }}>{item.id}</button>)}</footer></article><div className="retrieval-label"><span>RETRIEVED EVIDENCE</span><em>BM25 + HASH EMBEDDINGS + RRF</em></div><div className="search-results">{searchResults.map((item, index) => <button key={item.id} onClick={() => { setSelectedEvidence(item.id); setView("evidence"); setSearchOpen(false); }}><b>0{index + 1}</b><div><span>{item.id} · {item.source}</span><strong>{item.title}</strong><p>{item.snippet}</p><footer><em className={item.stance}>{item.stance}</em><small>RELIABILITY {Math.round(item.reliability * 100)}</small><small>SEM {item.semanticScore.toFixed(2)}</small></footer></div></button>)}</div></>}</div></div>}
      {toast && <div className="toast" role="status"><i/> {toast}</div>}
    </div>
  );
}
