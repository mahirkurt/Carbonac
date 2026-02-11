#!/bin/bash
# AI-Hub Setup Script
# Installs LiteLLM Proxy and MCP Ollama Gateway

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== AI-Hub Setup ==="
echo ""

# Check uv installation
if ! command -v uv &> /dev/null; then
    echo "[1/4] Installing uv package manager..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source "$HOME/.local/bin/env" 2>/dev/null || source "$HOME/.cargo/env" 2>/dev/null || true
else
    echo "[1/4] uv already installed"
fi

# Setup MCP Ollama server
echo "[2/4] Setting up MCP Ollama server..."
cd "$SCRIPT_DIR/mcp-ollama"
uv sync

# Setup LiteLLM (optional)
echo "[3/4] Installing LiteLLM..."
uv tool install litellm[proxy] 2>/dev/null || pip install "litellm[proxy]" --quiet

# Test connectivity
echo "[4/4] Testing AI-Hub connectivity..."
echo ""

HP_STATUS=$(curl -s --connect-timeout 3 http://100.107.62.43:11434/api/tags 2>/dev/null && echo "ONLINE" || echo "OFFLINE")
PI_STATUS=$(curl -s --connect-timeout 3 http://100.125.78.2:11434/api/tags 2>/dev/null && echo "ONLINE" || echo "OFFLINE")

echo "  HP AI Node (100.107.62.43): $HP_STATUS"
echo "  AI Pi (100.125.78.2): $PI_STATUS"

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Usage:"
echo ""
echo "  1. Start LiteLLM Proxy (OpenAI-compatible API):"
echo "     litellm --config $SCRIPT_DIR/litellm/config.yaml --port 4000"
echo ""
echo "  2. MCP Server is auto-configured in .vscode/mcp.json"
echo "     Restart Claude Code to activate"
echo ""
echo "  3. Test LiteLLM API:"
echo "     curl http://localhost:4000/v1/models"
echo ""
echo "Model Aliases:"
echo "  - fast    : Llama 3.1 8B (Pi) - Quick responses"
echo "  - smart   : Qwen 14B (HP) - Balanced"
echo "  - genius  : Qwen 32B (HP) - Complex reasoning"
echo "  - medical : BioMistral (Pi) - Medical queries"
echo "  - embed   : Nomic Embed (Pi) - Embeddings"
