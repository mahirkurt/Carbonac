#!/usr/bin/env bash
# HP Thin Client Tailscale Setup Script
# Usage: ./setup-tailscale.sh [--auth-key <key>]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    # shellcheck source=/dev/null
    source "$PROJECT_ROOT/.env"
fi

AUTH_KEY="${TAILSCALE_AUTH_KEY:-}"
HOSTNAME="${HP_TAILSCALE_HOSTNAME:-hp-tailscale}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --auth-key)
            AUTH_KEY="$2"
            shift 2
            ;;
        --hostname)
            HOSTNAME="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ -z "$AUTH_KEY" ]]; then
    echo "Error: TAILSCALE_AUTH_KEY not set. Provide via .env or --auth-key"
    exit 1
fi

echo "=== HP Thin Client Tailscale Setup ==="

# Check if Tailscale is installed
if ! command -v tailscale &> /dev/null; then
    echo "Installing Tailscale..."
    curl -fsSL https://tailscale.com/install.sh | sh
else
    echo "Tailscale already installed: $(tailscale version)"
fi

# Start Tailscale daemon if not running
if ! systemctl is-active --quiet tailscaled; then
    echo "Starting tailscaled service..."
    sudo systemctl enable --now tailscaled
fi

# Authenticate with Tailscale
echo "Authenticating with Tailscale..."
sudo tailscale up \
    --authkey="$AUTH_KEY" \
    --hostname="$HOSTNAME" \
    --accept-routes \
    --ssh

# Verify connection
echo ""
echo "=== Tailscale Status ==="
tailscale status

echo ""
echo "=== Connection Info ==="
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null || echo "N/A")
echo "Tailscale IP: $TAILSCALE_IP"
echo "Hostname: $HOSTNAME"
echo ""
echo "You can now connect via: ssh $USER@$HOSTNAME"
echo "Or via IP: ssh $USER@$TAILSCALE_IP"
