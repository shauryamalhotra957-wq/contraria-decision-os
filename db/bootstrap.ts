let ready: Promise<void> | undefined;

const statements = [
  `CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    confidence REAL NOT NULL,
    recommendation TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS evidence (
    id TEXT PRIMARY KEY NOT NULL,
    decision_id TEXT NOT NULL,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    source_type TEXT NOT NULL,
    stance TEXT NOT NULL,
    reliability REAL NOT NULL,
    observed_at TEXT NOT NULL,
    tags TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS scenarios (
    id TEXT PRIMARY KEY NOT NULL,
    decision_id TEXT NOT NULL,
    name TEXT NOT NULL,
    assumptions TEXT NOT NULL,
    probability REAL NOT NULL,
    expected_value REAL NOT NULL,
    survival_probability REAL NOT NULL,
    created_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    decision_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    action TEXT NOT NULL,
    detail TEXT NOT NULL,
    checksum TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,
  "CREATE INDEX IF NOT EXISTS evidence_decision_idx ON evidence (decision_id)",
  "CREATE INDEX IF NOT EXISTS evidence_stance_idx ON evidence (stance)",
  "CREATE INDEX IF NOT EXISTS scenarios_decision_idx ON scenarios (decision_id)",
  "CREATE INDEX IF NOT EXISTS audit_decision_idx ON audit_events (decision_id)",
  "CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_events (created_at)",
];

export function ensureDatabase() {
  if (!ready) {
    ready = import("cloudflare:workers").then(({ env }) =>
      env.DB.batch(statements.map((statement) => env.DB.prepare(statement))).then(() => undefined),
    );
  }
  return ready;
}
