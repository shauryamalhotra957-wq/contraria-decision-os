# Model card: `contraria-sim/0.9.3`

## Intended use

`contraria-sim/0.9.3` is a transparent probabilistic decision-support model for the synthetic NovaCell German market-entry decision. It demonstrates how a product can expose uncertainty, sensitivity, failure modes, and falsifiable gates.

It is not a generally trained machine-learning model, a causal oracle, or a substitute for finance, regulatory, engineering, or safety review.

## Inputs

| Variable | Domain | Baseline | Interpretation |
| --- | ---: | ---: | --- |
| Market growth | 4–42% | 22.4% | Two-year German addressable-market growth |
| Price premium | −5–28% | 14% | NovaCell premium to reference system |
| Manufacturing yield | 65–94% | 81% | Production first-pass yield |
| Pilot conversion | 25–90% | 62% | Qualified pilot-to-procurement conversion |
| Regulatory delay | 0–18 months | 4 months | Certification and grant timing drag |

## Endogenous uncertainty

The engine samples normally distributed uncertainty around operator assumptions and includes Bernoulli shock processes for a material-cost spike, competitor breakthrough, subsidy lapse, and thermal-fix miss. Some shock probabilities are conditional on operator assumptions, creating meaningful correlated downside.

## Outputs

- probability of NPV above zero;
- probability of remaining above the cash and break-even policy floor;
- NPV and break-even percentiles;
- probability histogram;
- Pearson correlation between sampled drivers and NPV;
- ranked failure-mode probabilities;
- calibrated recommendation-confidence heuristic.

## Calibration behavior

The baseline seed `71422` produces a median NPV close to the synthetic finance-model record ($31.6M) while preserving a negative P10 tail. This is scenario calibration, not empirical backtesting.

## Limitations

- Distribution shapes and shock rates are domain assumptions, not learned estimates.
- Pearson sensitivity can understate nonlinear and interaction effects.
- NPV equations omit tax, financing, currency, and portfolio interactions.
- The survival policy is a product heuristic, not a solvency opinion.
- A deterministic seed makes a run reproducible, not correct.

## Human control

The recommendation is conditional. Production tooling is not authorized until four human-owned gates clear. Operators can change assumptions, compare presets, inspect counterevidence, export a memo, and seal checkpoints. Every simulation event records the seed and headline probability.
