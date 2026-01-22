import React, { useMemo } from 'react';
import {
  InlineNotification,
  Tag,
  Tile,
} from '@carbon/react';
import { CheckmarkFilled, WarningAltFilled } from '@carbon/icons-react';

import { useDocument } from '../../contexts';
import { focusEditorLocation } from '../../utils/editorFocus';

function formatMetric(value, suffix = '') {
  if (value == null || Number.isNaN(value)) return '-';
  if (typeof value === 'number') {
    return `${value.toFixed(2)}${suffix}`;
  }
  return `${value}${suffix}`;
}

function getQaReportFromJob(job) {
  if (!job) return null;
  return job.qaReport || job.result?.qaReport || job.result?.outputManifest?.qa?.report || null;
}

export default function QualityPanel({ compact = false }) {
  const { markdownContent, lastJob } = useDocument();
  const qaReport = getQaReportFromJob(lastJob);

  const summary = useMemo(() => ({
    issues: qaReport?.issues || [],
    appliedFixes: qaReport?.appliedFixes || [],
    accessibility: qaReport?.accessibilityIssues || [],
    typography: qaReport?.typography || null,
    visual: qaReport?.visualRegression || null,
  }), [qaReport]);

  if (!lastJob) {
    return (
      <Tile className="quality-panel quality-panel--empty">
        <h3>Quality</h3>
        <p>Henüz bir QA sonucu yok. PDF üretimi tamamlandığında burada görünür.</p>
      </Tile>
    );
  }

  if (!qaReport) {
    return (
      <Tile className="quality-panel quality-panel--empty">
        <h3>Quality</h3>
        <p>Bu job için QA raporu üretilmemiş.</p>
      </Tile>
    );
  }

  return (
    <div className={`quality-panel${compact ? ' quality-panel--compact' : ''}`}>
      <div className="quality-panel__header">
        <div>
          <h3>Quality Panel</h3>
          <p>QA bulguları ve uygulanan düzeltmeler</p>
        </div>
        <div className="quality-panel__summary-tags">
          <Tag type={summary.issues.length ? 'red' : 'green'}>
            {summary.issues.length} Bulgu
          </Tag>
          <Tag type={summary.appliedFixes.length ? 'blue' : 'gray'}>
            {summary.appliedFixes.length} Fix
          </Tag>
          <Tag type={summary.accessibility.length ? 'purple' : 'gray'}>
            {summary.accessibility.length} A11y
          </Tag>
        </div>
      </div>

      {qaReport.aiReview && (
        <InlineNotification
          kind="info"
          title="AI QA Notu"
          subtitle={qaReport.aiReview}
          lowContrast
        />
      )}

      <div className="quality-panel__section">
        <h4>QA Bulguları</h4>
        {summary.issues.length === 0 ? (
          <p>Bulgu yok.</p>
        ) : (
          <ul className="quality-panel__list">
            {summary.issues.map((issue, index) => (
              <li key={`${issue.type}-${issue.qaId || index}`}>
                <div className="quality-panel__issue-meta">
                  <Tag type={issue.severity === 'high' ? 'red' : 'yellow'}>
                    {issue.severity || 'medium'}
                  </Tag>
                  <span>{issue.type}</span>
                  <span>Sayfa {issue.page || '-'}</span>
                  {issue.recommendation && <span>Öneri: {issue.recommendation}</span>}
                </div>
                {issue.sourceLine ? (
                  <button
                    type="button"
                    className="quality-panel__jump"
                    onClick={() => focusEditorLocation({
                      line: issue.sourceLine,
                      column: issue.sourceColumn,
                      markdown: markdownContent,
                    })}
                  >
                    L{issue.sourceLine}:{issue.sourceColumn || 1} konumuna git
                  </button>
                ) : (
                  <span className="quality-panel__jump quality-panel__jump--disabled">
                    Kaynak konumu yok
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="quality-panel__section">
        <h4>Uygulanan Düzeltmeler</h4>
        {summary.appliedFixes.length === 0 ? (
          <p>Otomatik düzeltme uygulanmadı.</p>
        ) : (
          <ul className="quality-panel__list">
            {summary.appliedFixes.map((fix, index) => (
              <li key={`${fix.action}-${fix.qaId || index}`}>
                <span className="quality-panel__fix">
                  <CheckmarkFilled size={16} />
                  {fix.action} ({fix.qaId})
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="quality-panel__section">
        <h4>Erişilebilirlik</h4>
        {summary.accessibility.length === 0 ? (
          <p>A11y bulgusu yok.</p>
        ) : (
          <ul className="quality-panel__list">
            {summary.accessibility.map((issue, index) => (
              <li key={`${issue.type}-${issue.qaId || index}`}>
                <span className="quality-panel__fix">
                  <WarningAltFilled size={16} />
                  {issue.type}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="quality-panel__section quality-panel__metrics">
        <h4>Tipografi & Görsel</h4>
        {summary.typography ? (
          <div className="quality-panel__metrics-grid">
            <div>
              <span>Ortalama Satır Uzunluğu</span>
              <strong>{formatMetric(summary.typography.avgCharsPerLine)}</strong>
            </div>
            <div>
              <span>Min/Max Satır</span>
              <strong>{formatMetric(summary.typography.minCharsPerLine)} / {formatMetric(summary.typography.maxCharsPerLine)}</strong>
            </div>
            <div>
              <span>Satır Aralığı</span>
              <strong>{formatMetric(summary.typography.lineHeightRatio, 'x')}</strong>
            </div>
            <div>
              <span>Hyphenation</span>
              <strong>{formatMetric((summary.typography.hyphenationDensity || 0) * 100, '%')}</strong>
            </div>
          </div>
        ) : (
          <p>Tipografi metrikleri yok.</p>
        )}
        {summary.visual && (
          <div className="quality-panel__visual">
            <span>Visual Regression:</span>
            <strong>
              {summary.visual.error
                ? `Hata: ${summary.visual.error}`
                : summary.visual.createdBaseline
                  ? 'Baseline oluşturuldu'
                  : `Mismatch: ${summary.visual.mismatchRatio || 0}`}
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}
