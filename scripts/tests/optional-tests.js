import { spawn } from 'node:child_process';

const truthy = new Set(['1', 'true', 'yes', 'on']);
const runQa = truthy.has(String(process.env.RUN_QA || '').toLowerCase());
const runSmoke = truthy.has(String(process.env.RUN_SMOKE || '').toLowerCase());
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

async function runTask(label, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(npmCmd, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${label} failed with exit code ${code}`));
    });
  });
}

const tasks = [];
if (runQa) {
  tasks.push({ label: 'QA harness', args: ['run', 'test:qa'] });
}
if (runSmoke) {
  tasks.push({ label: 'API smoke test', args: ['run', 'test:smoke'] });
}

if (!tasks.length) {
  console.log('RUN_QA/RUN_SMOKE not enabled; skipping optional tests.');
  process.exit(0);
}

for (const task of tasks) {
  console.log(`Running ${task.label}...`);
  await runTask(task.label, task.args);
}
