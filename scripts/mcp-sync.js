import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const projectsRoot = path.resolve(repoRoot, "..");

const defaultSharedPath = path.join(repoRoot, "mcp", "mcp-shared.json");
const legacySharedPath = path.join(os.homedir(), ".config", "ai-hub", "mcp-shared.json");
const sharedPath = process.env.MCP_SHARED_PATH || (fs.existsSync(defaultSharedPath) ? defaultSharedPath : legacySharedPath);

function readJson(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function tomlKey(value) {
  return /^[A-Za-z0-9_-]+$/.test(value) ? value : JSON.stringify(value);
}

function tomlValue(value) {
  if (value === null || value === undefined) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return `[${value.map(tomlValue).join(", ")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value);
    return `{ ${entries.map(([k, v]) => `${tomlKey(k)} = ${tomlValue(v)}`).join(", ")} }`;
  }
  return JSON.stringify(String(value));
}

function buildCodexMcpBlock(servers) {
  const lines = [];
  for (const [name, config] of Object.entries(servers)) {
    const sectionKey = tomlKey(name);
    lines.push(`[mcp_servers.${sectionKey}]`);
    if (config.command) lines.push(`command = ${tomlValue(config.command)}`);
    if (Array.isArray(config.args)) lines.push(`args = ${tomlValue(config.args)}`);
    if (config.url) lines.push(`url = ${tomlValue(config.url)}`);
    if (config.cwd) lines.push(`cwd = ${tomlValue(config.cwd)}`);
    if (config.startup_timeout_sec !== undefined) lines.push(`startup_timeout_sec = ${tomlValue(config.startup_timeout_sec)}`);
    if (config.tool_timeout_sec !== undefined) lines.push(`tool_timeout_sec = ${tomlValue(config.tool_timeout_sec)}`);
    if (config.disabled === true) lines.push("enabled = false");
    if (config.enabled === true) lines.push("enabled = true");
    if (config.env && typeof config.env === "object" && Object.keys(config.env).length) {
      lines.push(`[mcp_servers.${sectionKey}.env]`);
      for (const [envKey, envValue] of Object.entries(config.env)) {
        lines.push(`${tomlKey(envKey)} = ${tomlValue(envValue)}`);
      }
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}

function writeCodexConfig(filePath, servers) {
  const beginMarker = "# BEGIN MCP SERVERS (managed by mcp-sync.js)";
  const endMarker = "# END MCP SERVERS (managed by mcp-sync.js)";
  const block = `${beginMarker}\n${buildCodexMcpBlock(servers)}\n${endMarker}\n`;
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "";
  const pattern = new RegExp(`${escapeRegex(beginMarker)}[\\s\\S]*?${escapeRegex(endMarker)}`, "m");
  let next = existing;
  if (pattern.test(existing)) {
    next = existing.replace(pattern, block.trimEnd());
  } else {
    next = existing.trimEnd();
    if (next.length) next += "\n\n";
    next += block;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, next, "utf-8");
}

function normalizeSharedConfig(shared) {
  if (!shared || typeof shared !== "object") {
    throw new Error("Shared MCP config is missing or invalid.");
  }
  if (shared.servers && typeof shared.servers === "object") {
    return shared.servers;
  }
  if (shared.mcpServers && typeof shared.mcpServers === "object") {
    return shared.mcpServers;
  }
  throw new Error("Shared MCP config must contain 'servers' or 'mcpServers'.");
}

const shared = readJson(sharedPath);
const servers = normalizeSharedConfig(shared);

const targets = [];

const workspacePaths = new Set();
workspacePaths.add(path.join(repoRoot, ".vscode", "mcp.json"));
workspacePaths.add(path.join(projectsRoot, ".vscode", "mcp.json"));

if (fs.existsSync(projectsRoot)) {
  const entries = fs.readdirSync(projectsRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;
    const candidate = path.join(projectsRoot, entry.name, ".vscode", "mcp.json");
    const vscodeDir = path.dirname(candidate);
    if (fs.existsSync(vscodeDir)) {
      workspacePaths.add(candidate);
    }
  }
}

for (const workspaceMcpPath of workspacePaths) {
  targets.push({
    name: "workspace-mcp",
    path: workspaceMcpPath,
    data: { mcpServers: servers }
  });
}

// Claude Code project MCP
targets.push({
  name: "claude-code-project",
  path: path.join(repoRoot, ".mcp.json"),
  data: { mcpServers: servers }
});

// Legacy shared MCP export
targets.push({
  name: "shared-legacy",
  path: legacySharedPath,
  data: { servers }
});

// Copilot global MCP (VS Code Server & Desktop)
const copilotGlobalPaths = [
  path.join(os.homedir(), ".vscode-server", "data", "User", "globalStorage", "github.copilot-chat", "mcp", "mcp.json"),
  path.join(os.homedir(), ".config", "Code", "User", "globalStorage", "github.copilot-chat", "mcp", "mcp.json")
];
for (const p of copilotGlobalPaths) {
  targets.push({ name: "copilot-global", path: p, data: { servers } });
}

// Cline MCP settings (VS Code Server & Desktop)
const clinePaths = [
  path.join(os.homedir(), ".vscode-server", "data", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json"),
  path.join(os.homedir(), ".config", "Code", "User", "globalStorage", "saoudrizwan.claude-dev", "settings", "cline_mcp_settings.json")
];
for (const p of clinePaths) {
  const existing = readJson(p) || {};
  targets.push({
    name: "cline",
    path: p,
    data: { ...existing, mcpServers: servers }
  });
}

// Roo Code (Roo Cline) MCP settings (VS Code Server & Desktop)
const rooPaths = [
  path.join(os.homedir(), ".vscode-server", "data", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "mcp_settings.json"),
  path.join(os.homedir(), ".config", "Code", "User", "globalStorage", "rooveterinaryinc.roo-cline", "settings", "mcp_settings.json")
];
for (const p of rooPaths) {
  const existing = readJson(p) || {};
  targets.push({
    name: "roo",
    path: p,
    data: { ...existing, mcpServers: servers }
  });
}

// Codex CLI config (managed block)
const codexConfigPath = path.join(os.homedir(), ".codex", "config.toml");

let updated = 0;
for (const target of targets) {
  try {
    writeJson(target.path, target.data);
    updated += 1;
  } catch (error) {
    console.warn(`[skip] ${target.name}: ${target.path} (${error.message})`);
  }
}

try {
  writeCodexConfig(codexConfigPath, servers);
  updated += 1;
} catch (error) {
  console.warn(`[skip] codex-config: ${codexConfigPath} (${error.message})`);
}

console.log(`MCP sync complete. Updated: ${updated} file(s).`);
