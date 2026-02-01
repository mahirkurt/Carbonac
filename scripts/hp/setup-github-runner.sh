#!/usr/bin/env bash
# HP Thin Client GitHub Actions Self-Hosted Runner Setup
# Usage: ./setup-github-runner.sh --token <runner-token>
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    # shellcheck source=/dev/null
    source "$PROJECT_ROOT/.env"
fi

RUNNER_TOKEN="${GITHUB_RUNNER_TOKEN:-}"
RUNNER_NAME="${HP_RUNNER_NAME:-hp-ai-node-runner}"
RUNNER_LABELS="${HP_RUNNER_LABELS:-self-hosted,Linux,x64,hp-ai-node}"
REPO_URL="${GITHUB_REPO_URL:-https://github.com/mahirkurt/Carbonac}"
RUNNER_DIR="${HP_RUNNER_DIR:-$HOME/actions-runner}"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --token)
            RUNNER_TOKEN="$2"
            shift 2
            ;;
        --name)
            RUNNER_NAME="$2"
            shift 2
            ;;
        --labels)
            RUNNER_LABELS="$2"
            shift 2
            ;;
        --repo)
            REPO_URL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

if [[ -z "$RUNNER_TOKEN" ]]; then
    echo "Error: Runner token required."
    echo "Get token from: $REPO_URL/settings/actions/runners/new"
    echo "Usage: $0 --token <runner-token>"
    exit 1
fi

echo "=== GitHub Actions Runner Setup ==="

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        RUNNER_ARCH="x64"
        ;;
    aarch64|arm64)
        RUNNER_ARCH="arm64"
        ;;
    armv7l)
        RUNNER_ARCH="arm"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

echo "Detected architecture: $ARCH -> $RUNNER_ARCH"

# Install dependencies
echo "Installing dependencies..."
sudo apt-get update
sudo apt-get install -y curl jq tar

# Create runner directory
mkdir -p "$RUNNER_DIR"
cd "$RUNNER_DIR"

# Get latest runner version
echo "Fetching latest runner version..."
RUNNER_VERSION=$(curl -s https://api.github.com/repos/actions/runner/releases/latest | jq -r '.tag_name' | sed 's/v//')
RUNNER_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"

echo "Downloading runner v${RUNNER_VERSION}..."
curl -o actions-runner.tar.gz -L "$RUNNER_URL"

echo "Extracting runner..."
tar xzf actions-runner.tar.gz
rm actions-runner.tar.gz

# Configure runner
echo "Configuring runner..."
./config.sh \
    --url "$REPO_URL" \
    --token "$RUNNER_TOKEN" \
    --name "$RUNNER_NAME" \
    --labels "$RUNNER_LABELS" \
    --unattended \
    --replace

# Install as service
echo "Installing runner as systemd service..."
sudo ./svc.sh install
sudo ./svc.sh start

# Verify service
echo ""
echo "=== Runner Status ==="
sudo ./svc.sh status

echo ""
echo "=== Setup Complete ==="
echo "Runner Name: $RUNNER_NAME"
echo "Labels: $RUNNER_LABELS"
echo "Directory: $RUNNER_DIR"
echo ""
echo "To check status: sudo $RUNNER_DIR/svc.sh status"
echo "To view logs: sudo journalctl -u actions.runner.*.service -f"
