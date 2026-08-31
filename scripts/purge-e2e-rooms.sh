#!/usr/bin/env bash
# Purge e2e-test rooms created by the automated test suites from the live
# Hubs reticulum DB (hubs-db container). Test suites create rooms via
# POST /api/v1/hubs but cannot delete them anonymously (403/401), so junk
# accumulates and pollutes teacher/student room listings.
#
# Covered prefixes (all created by tests/hubs-stack.test.mjs + e2e/*.spec.ts):
#   'E2E '          playwright WS/auth tests (hubs-compose/e2e)
#   'e2e-'          jest API-contract tests
#   '[e2e-test]'    jest room-creation tests
#
# Safe: only touches names starting with those prefixes. Real content rooms
# (e.g. Wasserstoff-Raum) never match. Idempotent.
#
# Usage: scripts/purge-e2e-rooms.sh [--dry-run]
set -euo pipefail

DRY_RUN=0
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=1

PSQL=(docker exec -i hubs-db psql -U postgres -d ret_dev)

echo "== e2e room purge ($(date -Is)) dry_run=$DRY_RUN =="

if (( DRY_RUN )); then
  "${PSQL[@]}" -c "SELECT hub_sid, name, inserted_at FROM hubs WHERE name ~ '^(E2E |e2e-|\[e2e-test\])' ORDER BY inserted_at;"
  exit 0
fi

# Transaction: entities reference hubs (NO ACTION) -> delete entity rows of
# target hubs first; hub children (bindings/invites/objects/favorites) cascade.
"${PSQL[@]}" <<'SQL'
BEGIN;
CREATE TEMP TABLE dh AS SELECT hub_id FROM hubs WHERE name ~ '^(E2E |e2e-|\[e2e-test\])';
CREATE TEMP TABLE de AS SELECT entity_id FROM entities WHERE hub_id IN (SELECT hub_id FROM dh);
SELECT count(*) AS deleted_hubs FROM dh \gset
DELETE FROM entities WHERE entity_id IN (SELECT entity_id FROM de);
DELETE FROM hubs WHERE hub_id IN (SELECT hub_id FROM dh);
SELECT :'deleted_hubs'::bigint AS hubs_deleted,
       (SELECT count(*) FROM hubs WHERE name ~ '^(E2E |e2e-|\[e2e-test\])') AS junk_remaining;
COMMIT;
SQL
echo "== done =="
