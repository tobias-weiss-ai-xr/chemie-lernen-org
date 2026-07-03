#!/bin/sh
if [ -f /app/api/package.json ]; then
  cd /app/api && node server.js &
fi
nginx -g "daemon off;"