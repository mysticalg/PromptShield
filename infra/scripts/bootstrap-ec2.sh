#!/usr/bin/env bash
set -euo pipefail

sudo apt-get update
sudo apt-get install -y ca-certificates curl git nginx docker.io docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker

sudo mkdir -p /opt/promptshield
sudo chown "$USER":"$USER" /opt/promptshield

echo "Base host dependencies installed. Copy the repo to /opt/promptshield and place infra/aws/.env.prod before deployment."

