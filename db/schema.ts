import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const decisions = sqliteTable("decisions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default("active"),
  confidence: real("confidence").notNull(),
  recommendation: text("recommendation").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const evidence = sqliteTable(
  "evidence",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id").notNull(),
    source: text("source").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    sourceType: text("source_type").notNull(),
    stance: text("stance").notNull(),
    reliability: real("reliability").notNull(),
    observedAt: text("observed_at").notNull(),
    tags: text("tags").notNull(),
  },
  (table) => [
    index("evidence_decision_idx").on(table.decisionId),
    index("evidence_stance_idx").on(table.stance),
  ],
);

export const scenarios = sqliteTable(
  "scenarios",
  {
    id: text("id").primaryKey(),
    decisionId: text("decision_id").notNull(),
    name: text("name").notNull(),
    assumptions: text("assumptions").notNull(),
    probability: real("probability").notNull(),
    expectedValue: real("expected_value").notNull(),
    survivalProbability: real("survival_probability").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("scenarios_decision_idx").on(table.decisionId)],
);

export const auditEvents = sqliteTable(
  "audit_events",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    decisionId: text("decision_id").notNull(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    detail: text("detail").notNull(),
    checksum: text("checksum").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("audit_decision_idx").on(table.decisionId),
    index("audit_created_idx").on(table.createdAt),
  ],
);
