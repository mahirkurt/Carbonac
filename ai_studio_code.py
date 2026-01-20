"""
Gemini 3 Pro settings driver (AI Studio reference).

Env vars:
- GEMINI_API_KEY (required)
- GEMINI_MODEL (default: gemini-3-pro-preview)
- GEMINI_FALLBACK_MODEL (default: gemini-2.5-pro)
- GEMINI_THINKING_LEVEL (default: HIGH)
- GEMINI_INPUT / GEMINI_INPUT_FILE (optional prompt source)
- GEMINI_USE_URL_CONTEXT/GEMINI_USE_CODE_EXEC/GEMINI_USE_GOOGLE_SEARCH (optional tools)
"""

import os
import sys
from pathlib import Path
from google import genai
from google.genai import types


DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-pro-preview")
FALLBACK_MODEL = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-2.5-pro")


def load_input() -> str:
    file_path = os.getenv("GEMINI_INPUT_FILE")
    if file_path:
        return Path(file_path).read_text(encoding="utf-8")
    env_input = os.getenv("GEMINI_INPUT")
    if env_input:
        return env_input
    if not sys.stdin.isatty():
        return sys.stdin.read()
    return "INSERT_INPUT_HERE"


def build_tools():
    tools = []
    if os.getenv("GEMINI_USE_URL_CONTEXT", "1") in ("1", "true", "yes"):
        tools.append(types.Tool(url_context=types.UrlContext()))
    if os.getenv("GEMINI_USE_CODE_EXEC", "0") in ("1", "true", "yes"):
        tools.append(types.Tool(code_execution=types.ToolCodeExecution))
    if os.getenv("GEMINI_USE_GOOGLE_SEARCH", "0") in ("1", "true", "yes"):
        tools.append(types.Tool(googleSearch=types.GoogleSearch()))
    return tools


def stream_output(stream) -> str:
    output = []
    for chunk in stream:
        if (
            chunk.candidates is None
            or chunk.candidates[0].content is None
            or chunk.candidates[0].content.parts is None
        ):
            continue
        part = chunk.candidates[0].content.parts[0]
        if part.text:
            print(part.text, end="")
            output.append(part.text)
        if part.executable_code:
            print(part.executable_code)
            output.append(part.executable_code)
        if part.code_execution_result:
            print(part.code_execution_result)
            output.append(str(part.code_execution_result))
    return "".join(output)


def run_generation(client, model, contents, config) -> str:
    stream = client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=config,
    )
    return stream_output(stream)


def generate():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise SystemExit("GEMINI_API_KEY is required.")

    client = genai.Client(api_key=api_key)
    prompt = load_input()

    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=prompt)],
        ),
    ]

    thinking_level = os.getenv("GEMINI_THINKING_LEVEL", "HIGH")
    tools = build_tools()
    generate_content_config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(thinking_level=thinking_level),
        tools=tools or None,
    )

    output = run_generation(client, DEFAULT_MODEL, contents, generate_content_config)

    if not output.strip() and FALLBACK_MODEL and FALLBACK_MODEL != DEFAULT_MODEL:
        print(
            f"\n[info] primary model returned empty output, retrying {FALLBACK_MODEL}...\n",
            file=sys.stderr,
        )
        run_generation(client, FALLBACK_MODEL, contents, generate_content_config)

if __name__ == "__main__":
    generate()
