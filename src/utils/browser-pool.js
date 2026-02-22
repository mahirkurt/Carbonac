import { chromium } from 'playwright';
import { fileExists } from './file-utils.js';

const POOL_SIZE = Math.max(1, Number(process.env.BROWSER_POOL_SIZE || 1));
const MAX_IDLE_MS = Number(process.env.BROWSER_POOL_IDLE_MS || 300_000); // 5 minutes

const pool = [];
let initialized = false;
let resolvedExecutablePath = null;

async function resolveExecutable() {
  if (resolvedExecutablePath !== null) return resolvedExecutablePath || undefined;
  const candidates = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (await fileExists(candidate)) {
      resolvedExecutablePath = candidate;
      return candidate;
    }
  }
  resolvedExecutablePath = '';
  return undefined;
}

async function launchBrowser() {
  const executablePath = await resolveExecutable();
  return chromium.launch({
    headless: true,
    ...(executablePath ? { executablePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

function isAlive(entry) {
  try {
    return entry.browser.isConnected();
  } catch {
    return false;
  }
}

export async function acquireBrowser() {
  // Try to find an available browser in the pool
  for (let i = 0; i < pool.length; i++) {
    const entry = pool[i];
    if (!entry.inUse && isAlive(entry)) {
      entry.inUse = true;
      entry.lastUsed = Date.now();
      clearTimeout(entry.idleTimer);
      entry.idleTimer = null;
      return entry.browser;
    }
  }

  // Remove dead entries
  for (let i = pool.length - 1; i >= 0; i--) {
    if (!isAlive(pool[i])) {
      pool.splice(i, 1);
    }
  }

  // Launch new browser if pool has room
  const browser = await launchBrowser();
  const entry = { browser, inUse: true, lastUsed: Date.now(), idleTimer: null };
  pool.push(entry);
  return browser;
}

export function releaseBrowser(browser) {
  const entry = pool.find((e) => e.browser === browser);
  if (!entry) return;
  entry.inUse = false;
  entry.lastUsed = Date.now();

  // If pool exceeds max size, close excess
  const idleEntries = pool.filter((e) => !e.inUse);
  if (idleEntries.length > POOL_SIZE) {
    const toClose = idleEntries.slice(POOL_SIZE);
    for (const e of toClose) {
      const idx = pool.indexOf(e);
      if (idx >= 0) pool.splice(idx, 1);
      e.browser.close().catch(() => {});
    }
  }

  // Set idle timer for remaining entries
  if (!entry.idleTimer && pool.includes(entry)) {
    entry.idleTimer = setTimeout(() => {
      const idx = pool.indexOf(entry);
      if (idx >= 0 && !entry.inUse) {
        pool.splice(idx, 1);
        entry.browser.close().catch(() => {});
      }
    }, MAX_IDLE_MS);
  }
}

export async function closePool() {
  const entries = pool.splice(0, pool.length);
  await Promise.all(
    entries.map((e) => {
      clearTimeout(e.idleTimer);
      return e.browser.close().catch(() => {});
    })
  );
}
