# contraria-decision-os: STRIDE Threat Model & Information Security

Security analysis for **Adversarial Decision Intelligence & 10,000-World Simulation**.

| STRIDE Category | Threat Description | Severity | Mitigation Architecture |
|---|---|---|---|
| **Spoofing** | Adversarial injection of fraudulent evidence sources | High | Cryptographic signing (Ed25519) of evidence inputs with source trust rating |
| **Tampering** | Silent mutation of simulation weights or decision ledger entries | Critical | Append-only hash-chained ledger verifying Merkel root continuity |
| **Repudiation** | Decision stakeholders repudiating authorization of high-risk actions | Medium | Multi-signature stakeholder approval logged with UTC timestamps |
| **Information Disclosure** | Exposure of proprietary decision rationale or sensitive corporative RAG data | High | Role-based data redaction and zero-knowledge evidence verification |
| **Denial of Service** | Complexity exhaustion via recursive causal DAG cycles | High | Cycle detection (Tarjan's algorithm) with recursion depth cutoff (max depth 32) |
| **Elevation of Privilege** | Code injection through untrusted formula or query strings | Critical | Sandboxed AST formula parser with zero eval/Function execution |
