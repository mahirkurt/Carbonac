/**
 * AiCanvasSidebar - Suggestion sidebar for AI Canvas editor
 */
import React from 'react';
import { Accordion, AccordionItem, ClickableTile, Tag } from '@carbon/react';
import {
  Document, Report, Book, ListBulleted, Quotes,
  DataTable, ChartBar, Grid as GridIcon, Image, Time,
  Compare, TextLongParagraph, UserMultiple, Analytics,
  CheckmarkOutline, DocumentAttachment, Chemistry, SidePanelOpen,
  WarningAlt,
} from '@carbon/icons-react';
import PATTERN_PROMPTS from '../../data/patternPrompts';
import './AiCanvasSidebar.scss';

const ICON_MAP = {
  Document, Report, Book, ListBulleted, Quotes,
  DataTable, ChartBar, Grid: GridIcon, Image, Time,
  Compare, TextLongParagraph, UserMultiple, Analytics,
  CheckmarkOutline, DocumentAttachment, Chemistry, SidePanelOpen,
};

const DOC_TYPE_LABELS = {
  report: '\u0130\u015f Raporu', presentation: 'Sunum', article: 'Makale',
  documentation: 'Dok\u00fcmantasyon', analytics: 'Analiz Raporu', academic: 'Akademik Rapor',
};

const AUDIENCE_LABELS = {
  executive: '\u00dcst Y\u00f6netim', technical: 'Teknik Ekip',
  business: '\u0130\u015f Birimi', general: 'Genel Okuyucu', academic: 'Akademik \u00c7evre',
};

const TONE_LABELS = {
  formal: 'Resmi', technical: 'Teknik', casual: 'Yar\u0131 Resmi',
};

function ProfileSummaryCard({ reportSettings }) {
  const docType = DOC_TYPE_LABELS[reportSettings?.documentType] || '';
  const audience = AUDIENCE_LABELS[reportSettings?.audience] || '';
  const tone = TONE_LABELS[reportSettings?.tone] || '';
  if (!docType) return null;

  return (
    <div className="ai-canvas-sidebar__profile">
      <div className="ai-canvas-sidebar__profile-tags">
        {docType ? <Tag type="blue" size="sm">{docType}</Tag> : null}
        {audience ? <Tag type="teal" size="sm">{audience}</Tag> : null}
        {tone ? <Tag type="gray" size="sm">{tone}</Tag> : null}
      </div>
    </div>
  );
}

function PatternActionList({ enabledPatterns, onAction, disabled }) {
  if (!enabledPatterns || enabledPatterns.length === 0) return null;

  return (
    <div className="ai-canvas-sidebar__patterns">
      {enabledPatterns.map((patternId) => {
        const prompt = PATTERN_PROMPTS[patternId];
        if (!prompt) return null;
        const IconComponent = ICON_MAP[prompt.icon] || Document;

        return (
          <ClickableTile
            key={patternId}
            className="ai-canvas-sidebar__pattern-tile"
            onClick={() => onAction(prompt)}
            disabled={disabled}
          >
            <IconComponent size={16} />
            <span>{prompt.label}</span>
          </ClickableTile>
        );
      })}
    </div>
  );
}

function ContextualSuggestionList({ suggestions, onAction, disabled }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="ai-canvas-sidebar__contextual">
      {suggestions.map((item, idx) => (
        <ClickableTile
          key={`${item.label}-${idx}`}
          className="ai-canvas-sidebar__suggestion-tile"
          onClick={() => onAction(item)}
          disabled={disabled}
        >
          <span>{item.label}</span>
        </ClickableTile>
      ))}
    </div>
  );
}

function LintSummary({ lintIssues, onFix }) {
  const count = Array.isArray(lintIssues) ? lintIssues.length : 0;

  return (
    <div className="ai-canvas-sidebar__lint">
      <div className="ai-canvas-sidebar__lint-count">
        <WarningAlt size={16} />
        <span>{count} lint bulgusu</span>
      </div>
      {count > 0 && onFix ? (
        <button
          type="button"
          className="ai-canvas-sidebar__lint-fix"
          onClick={onFix}
        >
          Otomatik d\u00fczelt
        </button>
      ) : null}
    </div>
  );
}

export default function AiCanvasSidebar({
  reportSettings,
  enabledPatterns,
  contextualSuggestions,
  lintIssues,
  onPatternAction,
  onSuggestionAction,
  onLintFix,
  disabled,
  children,
}) {
  const hasProfile = Boolean(reportSettings?.documentType);

  return (
    <aside className="ai-canvas-sidebar">
      <Accordion align="start">
        {hasProfile ? (
          <AccordionItem title="Tasar\u0131m Profili" open>
            <ProfileSummaryCard reportSettings={reportSettings} />
          </AccordionItem>
        ) : null}

        {enabledPatterns && enabledPatterns.length > 0 ? (
          <AccordionItem title={`Pattern Aksiyonlar\u0131 (${enabledPatterns.length})`} open>
            <PatternActionList
              enabledPatterns={enabledPatterns}
              onAction={onPatternAction}
              disabled={disabled}
            />
          </AccordionItem>
        ) : null}

        <AccordionItem title="\u00d6neriler" open>
          <ContextualSuggestionList
            suggestions={contextualSuggestions}
            onAction={onSuggestionAction}
            disabled={disabled}
          />
        </AccordionItem>

        <AccordionItem title="Lint">
          <LintSummary lintIssues={lintIssues} onFix={onLintFix} />
        </AccordionItem>
      </Accordion>

      {children ? (
        <div className="ai-canvas-sidebar__chat-slot">
          {children}
        </div>
      ) : null}
    </aside>
  );
}
