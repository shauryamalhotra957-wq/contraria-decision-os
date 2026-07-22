# Security policy

Please report vulnerabilities privately through GitHub Security Advisories for this repository. Do not open a public issue containing exploit details, credentials, confidential evidence, or personal data.

The reference product has no secrets or external model keys. D1 queries use Drizzle or prepared statements, request strings are length-limited, simulation inputs are bounded, and rendered evidence is escaped by React. Operators must still treat uploaded enterprise evidence, identity, tenant isolation, retention, and model-provider contracts as security-critical when adapting this reference to production data.
