#!/usr/bin/env python3
"""
AI-Hub Ollama MCP Server
Provides Claude Code access to distributed Ollama models across Tailscale network.
"""

import json
import httpx
from mcp.server.fastmcp import FastMCP

# AnythingLLM RAG Configuration
import os
ANYTHINGLLM_URL = "http://100.125.78.2:3001"
ANYTHINGLLM_API_KEY = os.environ.get("ANYTHINGLLM_API_KEY", "")
ANYTHINGLLM_WORKSPACES = {
    "cf": "cystic-fibrosis",
    "kf": "cystic-fibrosis",
    "polarities": "polarities",
    "sample": "polarities-sample"
}

# Tailscale AI-Hub Endpoints
OLLAMA_ENDPOINTS = {
    "hp": {
        "url": "http://100.107.62.43:11434",
        "name": "HP AI Node",
        "models": ["qwen2.5:14b"]
    },
    "pi": {
        "url": "http://100.125.78.2:11434",
        "name": "AI Pi",
        "models": ["llama3.1:8b", "cniongolo/biomistral:latest", "nomic-embed-text:latest"]
    }
}

# Model routing table
MODEL_ROUTES = {
    # Fast/Light tasks -> Pi
    "fast": ("pi", "llama3.1:8b"),
    "llama": ("pi", "llama3.1:8b"),
    "llama3": ("pi", "llama3.1:8b"),

    # Medical tasks -> Pi (BioMistral)
    "medical": ("pi", "cniongolo/biomistral:latest"),
    "bio": ("pi", "cniongolo/biomistral:latest"),
    "biomistral": ("pi", "cniongolo/biomistral:latest"),

    # Embedding -> Pi
    "embed": ("pi", "nomic-embed-text:latest"),
    "embedding": ("pi", "nomic-embed-text:latest"),

    # Smart/Balanced/Heavy -> HP 14B
    "smart": ("hp", "qwen2.5:14b"),
    "qwen14": ("hp", "qwen2.5:14b"),
    "balanced": ("hp", "qwen2.5:14b"),
    "genius": ("hp", "qwen2.5:14b"),
    "heavy": ("hp", "qwen2.5:14b"),
    "complex": ("hp", "qwen2.5:14b"),
}

mcp = FastMCP("AI-Hub Ollama Gateway")


@mcp.tool()
async def list_models() -> str:
    """
    Lists all available models across the AI-Hub network.
    Shows which models are running on HP and Pi devices.
    """
    result = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        for device_key, device in OLLAMA_ENDPOINTS.items():
            try:
                response = await client.get(f"{device['url']}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    models = data.get("models", [])
                    result.append(f"\n## {device['name']} ({device_key})")
                    for m in models:
                        size_gb = m.get("size", 0) / (1024**3)
                        params = m.get("details", {}).get("parameter_size", "?")
                        result.append(f"  - {m['name']} ({params}, {size_gb:.1f} GB)")
            except Exception as e:
                result.append(f"\n## {device['name']} ({device_key})")
                result.append(f"  - Connection error: {str(e)}")

    return "\n".join(result) if result else "No models found"


@mcp.tool()
async def chat(
    prompt: str,
    model: str = "smart",
    system_prompt: str = "",
    temperature: float = 0.7
) -> str:
    """
    Send a chat request to an Ollama model in the AI-Hub network.

    Args:
        prompt: The user message/question to send
        model: Model alias or name. Options:
               - "fast" or "llama": Llama 3.1 8B on Pi (quick responses)
               - "medical" or "bio": BioMistral on Pi (medical queries)
               - "smart" or "balanced": Qwen 14B on HP (default, balanced)
               - "genius" or "heavy": Qwen 32B on HP (complex reasoning)
        system_prompt: Optional system instructions
        temperature: Creativity level (0.0-1.0, default 0.7)

    Returns:
        The model's response text
    """
    # Resolve model route
    model_lower = model.lower()

    if model_lower in MODEL_ROUTES:
        device_key, model_name = MODEL_ROUTES[model_lower]
    else:
        # Try to find direct model match
        for dk, device in OLLAMA_ENDPOINTS.items():
            if model_lower in [m.lower() for m in device["models"]]:
                device_key = dk
                model_name = model
                break
        else:
            # Default to smart
            device_key, model_name = MODEL_ROUTES["smart"]

    endpoint = OLLAMA_ENDPOINTS[device_key]

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": model_name,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature
        }
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            response = await client.post(
                f"{endpoint['url']}/api/chat",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            content = data.get("message", {}).get("content", "")
            device_name = endpoint["name"]

            return f"[{device_name} / {model_name}]\n\n{content}"

        except httpx.TimeoutException:
            return f"Error: Request timed out for {model_name} on {endpoint['name']}"
        except Exception as e:
            return f"Error: {str(e)}"


@mcp.tool()
async def generate(
    prompt: str,
    model: str = "smart",
    temperature: float = 0.7
) -> str:
    """
    Generate text completion (non-chat format) from an Ollama model.

    Args:
        prompt: The prompt text for completion
        model: Model alias (fast, smart, genius, medical) or model name
        temperature: Creativity level (0.0-1.0)

    Returns:
        Generated text completion
    """
    model_lower = model.lower()

    if model_lower in MODEL_ROUTES:
        device_key, model_name = MODEL_ROUTES[model_lower]
    else:
        device_key, model_name = MODEL_ROUTES["smart"]

    endpoint = OLLAMA_ENDPOINTS[device_key]

    payload = {
        "model": model_name,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": temperature
        }
    }

    async with httpx.AsyncClient(timeout=300.0) as client:
        try:
            response = await client.post(
                f"{endpoint['url']}/api/generate",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            return data.get("response", "")

        except Exception as e:
            return f"Error: {str(e)}"


@mcp.tool()
async def embed(text: str) -> str:
    """
    Generate embeddings for text using nomic-embed-text model on Pi.

    Args:
        text: The text to embed

    Returns:
        JSON string of embedding vector (for use in vector databases)
    """
    endpoint = OLLAMA_ENDPOINTS["pi"]

    payload = {
        "model": "nomic-embed-text:latest",
        "input": text
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        try:
            response = await client.post(
                f"{endpoint['url']}/api/embed",
                json=payload
            )
            response.raise_for_status()
            data = response.json()

            embeddings = data.get("embeddings", [[]])[0]
            return json.dumps({
                "model": "nomic-embed-text",
                "dimensions": len(embeddings),
                "embedding": embeddings[:10],  # Show first 10 for preview
                "full_length": len(embeddings)
            })

        except Exception as e:
            return f"Error: {str(e)}"


@mcp.tool()
async def compare_models(prompt: str, models: str = "fast,smart") -> str:
    """
    Compare responses from multiple models for the same prompt.
    Useful for evaluating which model works best for a specific task.

    Args:
        prompt: The question/prompt to send to all models
        models: Comma-separated list of model aliases (e.g., "fast,smart,genius")

    Returns:
        Side-by-side comparison of responses
    """
    model_list = [m.strip().lower() for m in models.split(",")]
    results = []

    for model_alias in model_list:
        if model_alias in MODEL_ROUTES:
            response = await chat(prompt=prompt, model=model_alias)
            results.append(f"### {model_alias.upper()}\n{response}\n")
        else:
            results.append(f"### {model_alias.upper()}\nUnknown model alias\n")

    return "\n---\n".join(results)


@mcp.tool()
async def health_check() -> str:
    """
    Check the health and connectivity of all AI-Hub devices.
    Shows which devices are online and their available models.
    """
    results = []

    async with httpx.AsyncClient(timeout=5.0) as client:
        for device_key, device in OLLAMA_ENDPOINTS.items():
            try:
                response = await client.get(f"{device['url']}/api/tags")
                if response.status_code == 200:
                    data = response.json()
                    model_count = len(data.get("models", []))
                    results.append(f"- {device['name']}: ONLINE ({model_count} models)")
                else:
                    results.append(f"- {device['name']}: ERROR (HTTP {response.status_code})")
            except httpx.ConnectError:
                results.append(f"- {device['name']}: OFFLINE (connection refused)")
            except httpx.TimeoutException:
                results.append(f"- {device['name']}: TIMEOUT")
            except Exception as e:
                results.append(f"- {device['name']}: ERROR ({str(e)})")

    return "## AI-Hub Health Status\n" + "\n".join(results)


@mcp.tool()
async def rag_workspaces() -> str:
    """
    List available RAG workspaces in AnythingLLM.
    Shows all document collections available for querying.
    """
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{ANYTHINGLLM_URL}/api/workspaces")
            if response.status_code == 200:
                data = response.json()
                workspaces = data.get("workspaces", [])
                result = ["## AnythingLLM Workspaces\n"]
                for ws in workspaces:
                    name = ws.get("name", "Unknown")
                    slug = ws.get("slug", "")
                    mode = ws.get("chatMode", "query")
                    result.append(f"- **{name}** (slug: {slug}, mode: {mode})")
                return "\n".join(result)
            else:
                return f"Error: HTTP {response.status_code}"
        except Exception as e:
            return f"Error connecting to AnythingLLM: {str(e)}"


@mcp.tool()
async def rag_query(
    query: str,
    workspace: str = "cf",
    mode: str = "query"
) -> str:
    """
    Query the RAG system (AnythingLLM) for medical documents.
    Searches through embedded documents and returns relevant information.

    Args:
        query: The question or search query
        workspace: Workspace alias - "cf" or "kf" for Cystic Fibrosis,
                   "polarities" for Polarities research
        mode: "query" for document search, "chat" for conversational

    Returns:
        Retrieved context and AI-generated answer from documents
    """
    # Resolve workspace slug
    ws_slug = ANYTHINGLLM_WORKSPACES.get(workspace.lower(), workspace)

    payload = {
        "message": query,
        "mode": mode
    }

    headers = {}
    if ANYTHINGLLM_API_KEY:
        headers["Authorization"] = f"Bearer {ANYTHINGLLM_API_KEY}"

    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            response = await client.post(
                f"{ANYTHINGLLM_URL}/api/v1/workspace/{ws_slug}/chat",
                json=payload,
                headers=headers
            )
            if response.status_code == 200:
                data = response.json()
                text_response = data.get("textResponse", "No response")
                sources = data.get("sources", [])

                result = f"## RAG Response ({ws_slug})\n\n{text_response}"

                if sources:
                    result += "\n\n### Sources:\n"
                    for src in sources[:5]:  # Limit to 5 sources
                        title = src.get("title", "Unknown")
                        result += f"- {title}\n"

                return result
            else:
                return f"Error: HTTP {response.status_code} - {response.text}"
        except Exception as e:
            return f"Error querying RAG: {str(e)}"


@mcp.tool()
async def rag_search(
    query: str,
    workspace: str = "cf",
    top_k: int = 5
) -> str:
    """
    Search for similar documents in RAG without generating a response.
    Returns raw document chunks that match the query.

    Args:
        query: The search query
        workspace: Workspace alias ("cf", "polarities", etc.)
        top_k: Number of results to return (default: 5)

    Returns:
        List of matching document chunks with similarity scores
    """
    ws_slug = ANYTHINGLLM_WORKSPACES.get(workspace.lower(), workspace)

    headers = {}
    if ANYTHINGLLM_API_KEY:
        headers["Authorization"] = f"Bearer {ANYTHINGLLM_API_KEY}"

    # Search documents via chat API in query mode
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            # Use similarity search endpoint
            response = await client.post(
                f"{ANYTHINGLLM_URL}/api/v1/workspace/{ws_slug}/chat",
                json={"message": query, "mode": "query"},
                headers=headers
            )

            if response.status_code == 200:
                data = response.json()
                sources = data.get("sources", [])

                if not sources:
                    return "No matching documents found."

                result = [f"## Document Search Results ({ws_slug})\n"]
                for i, src in enumerate(sources[:top_k], 1):
                    title = src.get("title", "Unknown")
                    text = src.get("text", "")[:500]  # Truncate
                    result.append(f"### {i}. {title}\n{text}...\n")

                return "\n".join(result)
            else:
                return f"Error: HTTP {response.status_code}"
        except Exception as e:
            return f"Error: {str(e)}"


if __name__ == "__main__":
    mcp.run()
