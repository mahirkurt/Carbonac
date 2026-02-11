import { setTimeout as sleep } from 'node:timers/promises';

const apiBase = process.env.API_BASE_URL || 'http://localhost:3001';
const authToken = process.env.API_AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
};

const requestTimeoutMs = Number(process.env.API_SMOKE_REQUEST_TIMEOUT_MS || 20000);
const downloadTimeoutMs = Number(process.env.API_SMOKE_DOWNLOAD_TIMEOUT_MS || 60000);

async function fetchWithTimeout(url, options = {}, timeoutMs = requestTimeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}, timeoutMs = requestTimeoutMs) {
  const response = await fetchWithTimeout(url, options, timeoutMs);
  const payload = await response.json().catch(() => ({}));
  return { response, payload };
}

async function pollJob(jobId, { maxAttempts = 60, intervalMs = 1500 } = {}) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const { response, payload } = await fetchJson(`${apiBase}/api/jobs/${jobId}`);
    if (!response.ok) {
      throw new Error(payload?.error?.message || 'Job status request failed.');
    }
    if (payload.status === 'completed') {
      return payload;
    }
    if (payload.status === 'failed' || payload.status === 'cancelled') {
      throw new Error(payload?.error?.message || 'Job failed.');
    }
    await sleep(intervalMs);
  }
  throw new Error('Job polling timed out.');
}

async function runSmoke() {
  const maxAttempts = Number(process.env.API_SMOKE_MAX_ATTEMPTS || 60);
  const intervalMs = Number(process.env.API_SMOKE_INTERVAL_MS || 1500);
  console.log('Smoke test started.');
  const payload = {
    markdown: '# Smoke Test\n\nAPI smoke test running.',
    settings: {
      layoutProfile: 'symmetric',
      printProfile: 'pagedjs-a4',
      theme: 'white',
      template: 'carbon-advanced',
    },
  };

  const { response, payload: createPayload } = await fetchJson(`${apiBase}/api/convert/to-pdf`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(createPayload?.error?.message || 'Failed to create PDF job.');
  }

  const jobId = createPayload.jobId;
  if (!jobId) {
    throw new Error('Job id missing in response.');
  }

  console.log('Smoke test job created:', jobId);
  const status = await pollJob(jobId, { maxAttempts, intervalMs });
  const downloadPath = status.result?.signedUrl || status.result?.downloadUrl || `/api/jobs/${jobId}/download`;
  const downloadUrl = downloadPath.startsWith('http') ? downloadPath : `${apiBase}${downloadPath}`;

  const safeDownloadUrl = downloadUrl.replace(/\?.*$/, '?<redacted>');
  console.log('Smoke test downloading:', safeDownloadUrl);
  const downloadResponse = await fetchWithTimeout(downloadUrl, {}, downloadTimeoutMs);
  if (!downloadResponse.ok) {
    throw new Error('Download failed.');
  }

  console.log('Smoke test passed:', jobId);
}

runSmoke().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
