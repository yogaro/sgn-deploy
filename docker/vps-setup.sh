#!/usr/bin/env bash
# Prepares a fresh Ubuntu 22.04/24.04 VPS for the SGN stack: Docker + Compose, Node 22 (seed scripts), firewall, swap.
# Run once as root: sudo bash docker/vps-setup.sh   (safe to repeat)
set -euo pipefail
[[ $EUID -eq 0 ]] || { echo "Run as root (sudo)." >&2; exit 1; }
. /etc/os-release
[[ "$ID" == "ubuntu" ]] || echo "Warning: written for Ubuntu, this is $PRETTY_NAME." >&2

apt-get update -q
apt-get install -yq ca-certificates curl git rsync python3 ufw openssl

if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

if ! command -v node >/dev/null || [[ $(node -p 'process.versions.node.split(".")[0]') -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -yq nodejs
fi

# Image builds (Go + Vite) need about 4 GB; small VPSes get a swap file so they don't run out of memory.
if ! swapon --show | grep -q . && [[ $(awk '/MemTotal/ {print int($2/1024/1024)}' /proc/meminfo) -lt 8 ]]; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Only SSH and the web are reachable from outside. Docker publishes 80/443 itself; the app ports are not published.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443
ufw --force enable

if [[ -n "${SUDO_USER:-}" && "$SUDO_USER" != root ]]; then
  usermod -aG docker "$SUDO_USER"
  echo "Added $SUDO_USER to the docker group: log out and back in before using docker without sudo."
fi
echo "Done: $(docker --version), $(docker compose version), node $(node -v)."
