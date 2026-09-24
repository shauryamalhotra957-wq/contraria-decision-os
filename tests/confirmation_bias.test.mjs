import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ConfirmationBiasDetector } from '../src/utils/confirmation_bias_detector.js';

describe('ConfirmationBiasDetector Test Suite', () => {
  const detector = new ConfirmationBiasDetector({ maxAllowableImbalanceRatio: 2.5, minEvidenceThreshold: 4 });

  test('balanced evidence is recognized as unbiased', () => {
    const items = [
      { id: 'e1', stance: 'CONFIRMING', weight: 1.0 },
      { id: 'e2', stance: 'CONFIRMING', weight: 1.0 },
      { id: 'e3', stance: 'DISCONFIRMING', weight: 1.0 },
      { id: 'e4', stance: 'DISCONFIRMING', weight: 1.0 },
    ];
    const res = detector.evaluateEvidencePortfolio(items);
    assert.strictEqual(res.isBiased, false);
    assert.strictEqual(res.status, 'BALANCED_PORTFOLIO');
  });

  test('heavily lopsided evidence triggers bias warning', () => {
    const items = [
      { id: 'e1', stance: 'CONFIRMING', weight: 4.0 },
      { id: 'e2', stance: 'CONFIRMING', weight: 3.0 },
      { id: 'e3', stance: 'CONFIRMING', weight: 2.0 },
      { id: 'e4', stance: 'DISCONFIRMING', weight: 1.0 },
    ];
    const res = detector.evaluateEvidencePortfolio(items);
    assert.strictEqual(res.isBiased, true);
    assert.strictEqual(res.status, 'CONFIRMATION_BIAS_DETECTED');
  });
});
