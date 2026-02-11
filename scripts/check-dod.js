import fs from 'fs/promises';
import path from 'path';

const ROOT = path.resolve(process.cwd());
const DOD_PATH = path.join(ROOT, 'docs', 'DEFINITION-OF-DONE.md');
const PR_TEMPLATE_PATH = path.join(ROOT, '.github', 'pull_request_template.md');

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const dodExists = await fileExists(DOD_PATH);
  if (!dodExists) {
    throw new Error('Missing docs/DEFINITION-OF-DONE.md');
  }

  const prTemplateExists = await fileExists(PR_TEMPLATE_PATH);
  if (!prTemplateExists) {
    throw new Error('Missing .github/pull_request_template.md');
  }

  const prTemplate = await fs.readFile(PR_TEMPLATE_PATH, 'utf-8');
  if (!prTemplate.includes('DoD Checklist')) {
    throw new Error('PR template is missing the DoD Checklist section.');
  }
  if (!prTemplate.includes('docs/DEFINITION-OF-DONE.md')) {
    throw new Error('PR template must reference docs/DEFINITION-OF-DONE.md');
  }

  console.log('DoD checks passed.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
