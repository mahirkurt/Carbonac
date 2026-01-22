import { setTimeout as sleep } from 'node:timers/promises';

const apiBase = process.env.API_BASE_URL || 'http://localhost:3001';
const authToken = process.env.API_AUTH_TOKEN || '';

const headers = {
  'Content-Type': 'application/json',
  ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
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

  const status = await pollJob(jobId);
  const downloadPath = status.result?.signedUrl || status.result?.downloadUrl || `/api/jobs/${jobId}/download`;
  const downloadUrl = downloadPath.startsWith('http') ? downloadPath : `${apiBase}${downloadPath}`;

  const downloadResponse = await fetch(downloadUrl);
  if (!downloadResponse.ok) {
    throw new Error('Download failed.');
  }

  console.log('Smoke test passed:', jobId);
}

runSmoke().catch((error) => {
  console.error('Smoke test failed:', error.message);
  process.exit(1);
});
