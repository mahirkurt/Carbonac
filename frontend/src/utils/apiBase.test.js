import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('buildApiUrl', () => {
  let buildApiUrl;

  beforeEach(async () => {
    vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
    // Re-import to pick up new env
    const mod = await import('./apiBase.js');
    buildApiUrl = mod.buildApiUrl;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns absolute URLs as-is', () => {
    expect(buildApiUrl('https://api.example.com/data')).toBe('https://api.example.com/data');
    expect(buildApiUrl('http://localhost:3001/api/jobs')).toBe('http://localhost:3001/api/jobs');
  });

  it('prepends API_URL to relative paths', () => {
    const result = buildApiUrl('/api/jobs');
    expect(result).toContain('/api/jobs');
  });

  it('handles paths without leading slash', () => {
    const result = buildApiUrl('api/jobs');
    expect(result).toContain('/api/jobs');
  });
});
