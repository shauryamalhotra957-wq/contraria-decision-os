# contraria-decision-os: Production Operations Runbook & Incident Playbook

Operational guidelines, SLO definitions, and incident playbooks for **Adversarial Decision Intelligence & 10,000-World Simulation**.

## Service Level Objectives (SLOs)
- **Engine Availability**: >= 99.95% uptime for decision simulation APIs.
- **Latency Budget (P95)**: Under 250ms for standard 10,000-world simulation batches.
- **Ledger Verification**: Zero unverifiable cryptographic signatures in audit trail.

## Incident Triage Playbooks

### Sev-1: Decision Ledger Consensus / Cryptographic Failure
1. **Detection**: Cryptographic hash chain validation error in internal ledger.
2. **Immediate Action**: Freeze write operations to ledger; switch to read-only replica.
3. **Recovery**: Verify last known valid Merkle root against backup snapshot and re-index.

### Sev-2: Simulation Resource Saturation / Memory Leak
1. **Detection**: Node process heap usage exceeding 85% of allocated container limit.
2. **Remediation**: Force garbage collection sweep, prune temporary simulation branch caches, and spin up additional worker instances.
