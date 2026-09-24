import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CircuitBreaker, CircuitOpenError, resilientExecute } from '../src/utils/resilienceEngine.mjs';

describe('ResilienceEngine Unit & Boundary Suite', () => {
  test('CircuitBreaker transitions from CLOSED to OPEN after failure threshold', () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, recoveryTimeoutMs: 100 });
    assert.equal(cb.state, 'CLOSED');
    assert.equal(cb.canExecute(), true);

    cb.recordFailure();
    cb.recordFailure();
    assert.equal(cb.state, 'CLOSED');

    cb.recordFailure();
    assert.equal(cb.state, 'OPEN');
    assert.equal(cb.canExecute(), false);
  });

  test('CircuitBreaker enters HALF_OPEN after timeout and closes on success', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 2, recoveryTimeoutMs: 50 });
    cb.recordFailure();
    cb.recordFailure();
    assert.equal(cb.state, 'OPEN');

    await new Promise((r) => setTimeout(r, 60));
    assert.equal(cb.canExecute(), true);
    assert.equal(cb.state, 'HALF_OPEN');

    cb.recordSuccess();
    assert.equal(cb.state, 'CLOSED');
    assert.equal(cb.failureCount, 0);
  });

  test('resilientExecute retries on transient errors and invokes fallback', async () => {
    let attempts = 0;
    const failingFn = async () => {
      attempts += 1;
      throw new Error('Transient simulation failure');
    };

    const fallbackResult = { status: 'DEGRADED_FALLBACK', confidence: 0.5 };
    const res = await resilientExecute(failingFn, {
      fallback: () => fallbackResult,
      maxRetries: 3,
      baseDelayMs: 5
    });

    assert.equal(attempts, 3);
    assert.deepEqual(res, fallbackResult);
  });

  test('resilientExecute completes successfully on first attempt', async () => {
    const successResult = { status: 'OPTIMAL', score: 0.98 };
    const res = await resilientExecute(async () => successResult);
    assert.deepEqual(res, successResult);
  });
});
