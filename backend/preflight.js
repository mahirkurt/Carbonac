function summarizeIssues(issues = []) {
  const summary = {
    total: 0,
    bySeverity: { low: 0, medium: 0, high: 0 },
    byType: {},
  };

  issues.forEach((issue) => {
    summary.total += 1;
    const severity = issue.severity || 'medium';
    if (summary.bySeverity[severity] !== undefined) {
      summary.bySeverity[severity] += 1;
    }
    const type = issue.type || 'unknown';
    summary.byType[type] = (summary.byType[type] || 0) + 1;
  });

  return summary;
}

function buildQaRuleIndex(qaRules = []) {
  const rulesByType = new Map();
  qaRules.forEach((rule) => {
    if (rule?.type) {
      rulesByType.set(rule.type, rule);
    }
  });
  return rulesByType;
}

function resolveBlockingIssues(issues = [], qaRules = []) {
  const ruleIndex = buildQaRuleIndex(qaRules);
  return issues.filter((issue) => {
    if (issue.severity === 'high') return true;
    const rule = ruleIndex.get(issue.type);
    return Boolean(rule?.blocking);
  });
}

function validateContentSchema(metadata = {}, contentSchema = null) {
  if (!contentSchema) {
    return { missing: [], resolved: {} };
  }
  const resolved = { ...metadata };
  const aliases = contentSchema.aliases || {};
  Object.entries(aliases).forEach(([alias, canonical]) => {
    if (resolved[canonical] === undefined && resolved[alias] !== undefined) {
      resolved[canonical] = resolved[alias];
    }
  });
  const requiredFields = contentSchema.requiredFields || [];
  const missing = requiredFields.filter((field) => resolved[field] === undefined);
  return { missing, resolved };
}

function evaluatePreflight({
  qaReport = null,
  qaRules = [],
  contentSchema = null,
  metadata = {},
  blockCatalogViolations = [],
}) {
  const issues = qaReport?.issues || [];
  const accessibilityIssues = qaReport?.accessibilityIssues || [];
  const blockingIssues = resolveBlockingIssues(issues, qaRules);
  const contentValidation = validateContentSchema(metadata, contentSchema);
  const contentMissing = contentValidation.missing || [];
  const blockViolations = Array.isArray(blockCatalogViolations) ? blockCatalogViolations : [];

  const status =
    blockingIssues.length || contentMissing.length || blockViolations.length
      ? 'fail'
      : 'pass';

  return {
    status,
    blockingIssues,
    contentMissing,
    blockCatalogViolations: blockViolations,
    qaSummary: summarizeIssues(issues),
    accessibilitySummary: summarizeIssues(accessibilityIssues),
  };
}

export { evaluatePreflight, summarizeIssues, validateContentSchema };
