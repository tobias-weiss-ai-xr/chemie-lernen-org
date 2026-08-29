#!/usr/bin/env bash

# Weekly Blog Generation Script for chemie-lernen.org
# Runs every Monday at 09:00 via systemd timer

set -euo pipefail

cd "$(dirname "$0")/../.."

# 1. Fetch new entities from last 7 days
NEW_ENTITIES=$(node scripts/marketing/fetch-new-entities.mjs 7 days ago)

if [[ -z "$NEW_ENTITIES" ]]; then
  echo "No new entities found. Exiting."
  exit 0
fi

echo "Found $(echo "$NEW_ENTITIES" | jq '. | length') new entities"

# 2. Generate blog posts for top 2 entities
echo "$NEW_ENTITIES" | jq -r '.[0:2] | .[].name' | while read -r entity_name; do
  echo "Generating blog post for: $entity_name"

  # Make API call to marketing endpoint
  curl -s -X POST \
    "http://localhost:3002/api/marketing/generate-blog/$entity_name" \
    -H "Content-Type: application/json" \
    -d '{"format": "hugo-markdown"}' \
    > "myhugoapp/content/posts/$(date +%Y-%m-%d)-$entity_name.md"

  echo "Saved: myhugoapp/content/posts/$(date +%Y-%m-%d)-$entity_name.md"
done

# 3. Generate social media posts
echo "$NEW_ENTITIES" | jq -r '.[0:2] | .[].name' | while read -r entity_name; do
  echo "Generating social posts for: $entity_name"

  # Twitter/X
  curl -s -X GET \
    "http://localhost:3002/api/marketing/generate-social/$entity_name?platform=twitter" \
    > "/tmp/$entity_name-twitter.txt"

  # LinkedIn
  curl -s -X GET \
    "http://localhost:3002/api/marketing/generate-social/$entity_name?platform=linkedin" \
    > "/tmp/$entity_name-linkedin.txt"

  echo "Saved: /tmp/$entity_name-twitter.txt, /tmp/$entity_name-linkedin.txt"
done

# 4. Build & deploy hugo site
cd myhugoapp
hugo

# 5. Trigger git commit & push
git add myhugoapp/content/posts/
git commit -m "feat(marketing): auto-generated weekly blog posts"
git push

echo "✅ Weekly blog generation complete!"
