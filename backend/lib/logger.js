/**
 * Structured JSON logger
 */

export function logEvent(level, payload) {
  const entry = {
    level,
    time: new Date().toISOString(),
    ...payload,
  };
  const output = JSON.stringify(entry);
  if (level === 'error') {
    console.error(output);
  } else {
    console.log(output);
  }
}
