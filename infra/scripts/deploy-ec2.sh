#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/promptshield}"

cd "$APP_DIR/infra/aws"
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo "PromptShield services deployed."

