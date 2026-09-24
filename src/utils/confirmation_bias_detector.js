/**
 * Adversarial Decision Confirmation Bias & Evidentiary Drift Detector.
 * Measures cognitive polarization and flags asymmetric omission of disconfirming evidence.
 */
export class ConfirmationBiasDetector {
  constructor({ maxAllowableImbalanceRatio = 3.0, minEvidenceThreshold = 4 } = {}) {
    this.maxRatio = maxAllowableImbalanceRatio;
    this.minThreshold = minEvidenceThreshold;
  }

  evaluateEvidencePortfolio(evidenceItems) {
    if (evidenceItems.length < this.minThreshold) {
      return {
        status: 'INSUFFICIENT_EVIDENCE',
        totalItems: evidenceItems.length,
        isBiased: false,
      };
    }

    const confirming = evidenceItems.filter(e => e.stance === 'CONFIRMING');
    const disconfirming = evidenceItems.filter(e => e.stance === 'DISCONFIRMING');

    const cWeight = confirming.reduce((sum, e) => sum + (e.weight || 1.0), 0);
    const dWeight = disconfirming.reduce((sum, e) => sum + (e.weight || 1.0), 0);

    const ratio = dWeight === 0 ? Infinity : Number((cWeight / dWeight).toFixed(2));
    const isBiased = ratio > this.maxRatio || dWeight === 0;

    return {
      status: isBiased ? 'CONFIRMATION_BIAS_DETECTED' : 'BALANCED_PORTFOLIO',
      confirmingWeight: cWeight,
      disconfirmingWeight: dWeight,
      imbalanceRatio: ratio,
      isBiased,
    };
  }
}
