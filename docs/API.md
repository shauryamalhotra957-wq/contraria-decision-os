# API reference

All endpoints return JSON. No API key is required for the reference deployment.

## `GET /api/decision`

Returns the decision, baseline assumptions, 16 evidence records, four hypotheses, contradiction clusters, and the seeded baseline simulation.

## `POST /api/search`

```json
{ "query": "Why is production yield a launch risk?", "limit": 5 }
```

`query` must contain at least two non-whitespace characters. `limit` is capped at 12. Results include the complete provenance record plus fused, lexical, and semantic scores and a query-centered snippet.

## `POST /api/simulate`

```json
{
  "controls": {
    "marketGrowth": 22.4,
    "pricePremium": 14,
    "manufacturingYield": 81,
    "pilotConversion": 62,
    "regulatoryDelay": 4
  },
  "iterations": 10000,
  "seed": 71422
}
```

Missing values use the baseline. Values are clamped to the domains in the model card. Iterations are clamped to 1,000–50,000. An omitted seed uses the current time modulo one million and is returned with the result.

## `GET /api/ledger`

Returns up to 40 audit events in reverse chronological order. The database is created and seeded idempotently on first access.

## `POST /api/ledger`

```json
{
  "actor": "OPERATOR",
  "action": "CHECKPOINT",
  "detail": "Human checkpoint · confidence 78%"
}
```

Actor, action, and detail are trimmed and capped at 40, 32, and 320 characters. `detail` is required. The server creates the timestamp and checksum.

## Errors

Errors use `{ "error": "message" }` and an appropriate 4xx or 5xx status. The search and simulation surfaces never require the database, so a D1 incident does not block core analysis.
