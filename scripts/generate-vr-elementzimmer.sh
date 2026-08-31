#!/usr/bin/env bash
# Regenerates /vr-elementzimmer/ (student entry into element rooms).
# Reads live room DB, writes the static grid page served via the
# docker-compose.yml mount (hugo-chemie-lernen-org service).
set -euo pipefail
OUT=/opt/containers/hubs-compose/files/vr-elementzimmer/index.html
docker exec hubs-db psql -U postgres -d ret_dev -t -A -F'|' -c "
SELECT DISTINCT ON (lower(user_data->'chemistry'->>'symbol'))
  lower(user_data->'chemistry'->>'symbol'),
  user_data->'chemistry'->>'name',
  user_data->'chemistry'->>'z'::text,
  hub_sid
FROM hubs
WHERE user_data ? 'chemistry' AND entry_mode='allow'
ORDER BY lower(user_data->'chemistry'->>'symbol'), inserted_at;" > /tmp/elements.txt
python3 /opt/git/hubs-compose/scripts/build-vr-elementzimmer.py /tmp/elements.txt "$OUT"
echo "regenerated: $OUT"
