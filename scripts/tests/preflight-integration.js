import assert from 'node:assert/strict';

import { evaluatePreflight } from '../../backend/preflight.js';

const qaReportFail = {
  issues: [{ type: 'overflow', severity: 'high' }],
  accessibilityIssues: [],
};

const qaReportPass = {
  issues: [],
  accessibilityIssues: [],
};

const contentSchema = {
  requiredFields: ['docType'],
  aliases: { documentType: 'docType' },
};

const failResult = evaluatePreflight({
  qaReport: qaReportFail,
  contentSchema,
  metadata: { documentType: 'report' },
});

assert.equal(failResult.status, 'fail');
assert.equal(failResult.blockingIssues.length, 1);

const passResult = evaluatePreflight({
  qaReport: qaReportPass,
  contentSchema,
  metadata: { docType: 'report' },
});

assert.equal(passResult.status, 'pass');
assert.equal(passResult.blockingIssues.length, 0);

console.log('Integration tests passed.');
