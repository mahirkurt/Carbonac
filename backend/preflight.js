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

function normalizeStringList(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function summarizeChecklist(items = []) {
  return items.reduce(
    (acc, item) => {
      acc.total += 1;
      const status = item.status || 'na';
      if (acc[status] !== undefined) {
        acc[status] += 1;
      }
      return acc;
    },
    {
      total: 0,
      pass: 0,
      warn: 0,
      fail: 0,
      na: 0,
    }
  );
}

function buildQualityChecklist({
  qaReport = null,
  metadata = {},
  storytelling = null,
  patternTags = [],
  printProfile = null,
}) {
  const tags = new Set(normalizeStringList(patternTags || metadata?.patternTags));
  const story = storytelling || metadata?.storytelling || {};
  const keyInsights = Array.isArray(story?.keyInsights) ? story.keyInsights : [];
  const sources = Array.isArray(story?.sources) ? story.sources : [];
  const hasMethodology = Boolean(story?.methodologyNotes);
  const checklist = [];

  const addItem = (id, label, status, severity = 'medium', notes = null) => {
    checklist.push({ id, label, status, severity, notes });
  };

  const profile = printProfile || metadata?.printProfile || null;
  const printStatus = profile && typeof profile === 'string' && profile.startsWith('pagedjs-')
    ? 'pass'
    : 'warn';
  addItem(
    'print-geometry',
    'A4/bleed/marks + binding',
    printStatus,
    'high',
    profile ? `printProfile=${profile}` : 'printProfile missing'
  );

  const hasFooterNav = tags.has('persistent-section-nav-footer');
  addItem(
    'footer-nav',
    'Footer page numbers + mini-TOC',
    hasFooterNav ? 'pass' : 'warn',
    'medium',
    hasFooterNav ? null : 'pattern:persistent-section-nav-footer not detected'
  );

  const hasKeyFindings = tags.has('key-findings-list') || keyInsights.length > 0;
  addItem(
    'key-findings',
    'Key Findings block',
    hasKeyFindings ? 'pass' : 'warn',
    'high',
    hasKeyFindings ? null : 'keyInsights/pattern missing'
  );

  const hasActionBox = tags.has('action-box');
  addItem(
    'what-to-do',
    'What to do / Action box',
    hasActionBox ? 'pass' : 'warn',
    'high',
    hasActionBox ? null : 'pattern:action-box not detected'
  );

  const hasCaptionSource =
    tags.has('figure-with-caption') ||
    tags.has('survey-chart-page') ||
    sources.length > 0 ||
    hasMethodology;
  addItem(
    'caption-source',
    'Caption + source + sample size standard',
    hasCaptionSource ? 'pass' : 'warn',
    'high',
    hasCaptionSource ? null : 'caption/source/sample size evidence missing'
  );

  const typography = qaReport?.typography || null;
  if (!typography) {
    addItem('typography-guardrail', 'Typography guardrails', 'warn', 'medium', 'no typography stats');
  } else {
    const totalNodes = typography.totalNodes || 0;
    const violations = (typography.tooShort || 0) + (typography.tooLong || 0);
    const ratio = totalNodes ? violations / totalNodes : 0;
    const status = ratio <= 0.1 ? 'pass' : ratio <= 0.2 ? 'warn' : 'fail';
    addItem(
      'typography-guardrail',
      'Typography guardrails',
      status,
      'medium',
      `violations=${violations}/${totalNodes}, avgCharsPerLine=${Math.round(typography.avgCharsPerLine || 0)}`
    );
  }

  const fonts = qaReport?.fonts || null;
  if (!fonts || !Array.isArray(fonts) || !fonts.length) {
    addItem('font-embedding', 'Font embedding + min pt', 'warn', 'high', 'font report missing');
  } else {
    const missingFonts = fonts.filter((font) => !font.loaded).map((font) => font.family);
    addItem(
      'font-embedding',
      'Font embedding + min pt',
      missingFonts.length ? 'fail' : 'pass',
      'high',
      missingFonts.length ? `missing: ${missingFonts.join(', ')}` : null
    );
  }

  if (!qaReport) {
    addItem('self-healing', 'Visual self-healing iteration', 'na', 'low', 'qaReport missing');
  } else {
    const iterations = qaReport.iterations || 0;
    addItem(
      'self-healing',
      'Visual self-healing iteration',
      iterations >= 1 ? 'pass' : 'warn',
      'medium',
      `iterations=${iterations}`
    );
  }

  const accessibilityIssues = qaReport?.accessibilityIssues || [];
  const hasHeadingOrder = accessibilityIssues.some((issue) => issue.type === 'heading-order');
  const auditViolations = qaReport?.accessibilityAudit?.violations || [];
  addItem(
    'accessibility-structure',
    'Heading order + reading order + bookmarks',
    hasHeadingOrder || auditViolations.length ? 'warn' : 'pass',
    'medium',
    hasHeadingOrder || auditViolations.length
      ? `headingOrder=${hasHeadingOrder}, axeViolations=${auditViolations.length}`
      : null
  );

  const hasLinkIssue = accessibilityIssues.some((issue) => issue.type === 'link-missing');
  const hasContrastIssue = auditViolations.some((violation) => String(violation.id || '').includes('contrast'));
  const hasTableIssue = auditViolations.some((violation) => String(violation.id || '').includes('table'));
  addItem(
    'link-contrast-tables',
    'Links/contrast/tables consistency',
    hasLinkIssue || hasContrastIssue || hasTableIssue ? 'warn' : 'pass',
    'medium',
    hasLinkIssue || hasContrastIssue || hasTableIssue
      ? `link=${hasLinkIssue}, contrast=${hasContrastIssue}, table=${hasTableIssue}`
      : null
  );

  return {
    items: checklist,
    summary: summarizeChecklist(checklist),
  };
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
  storytelling = null,
  patternTags = [],
  printProfile = null,
  enforceQualityChecklist = false,
}) {
  const issues = qaReport?.issues || [];
  const accessibilityIssues = qaReport?.accessibilityIssues || [];
  const blockingIssues = resolveBlockingIssues(issues, qaRules);
  const contentValidation = validateContentSchema(metadata, contentSchema);
  const contentMissing = contentValidation.missing || [];
  const blockViolations = Array.isArray(blockCatalogViolations) ? blockCatalogViolations : [];
  const qualityChecklist = buildQualityChecklist({
    qaReport,
    metadata,
    storytelling,
    patternTags,
    printProfile,
  });
  const qualityFailures = qualityChecklist.items.filter((item) => item.status === 'fail');

  const status =
    blockingIssues.length ||
    contentMissing.length ||
    blockViolations.length ||
    (enforceQualityChecklist && qualityFailures.length)
      ? 'fail'
      : 'pass';

  return {
    status,
    blockingIssues,
    contentMissing,
    blockCatalogViolations: blockViolations,
    qaSummary: summarizeIssues(issues),
    accessibilitySummary: summarizeIssues(accessibilityIssues),
    qualityChecklist,
  };
}

export { evaluatePreflight, summarizeIssues, validateContentSchema };
