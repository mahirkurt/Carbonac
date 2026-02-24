/**
 * PatternSuggestionCards - Toggle-able pattern suggestion cards for wizard chat
 */
import React from 'react';
import { Toggle } from '@carbon/react';
import {
  ChartBar, Document, Report, Analytics, DataTable,
  TextLongParagraph, Image, ListBulleted, Quotes,
  Time, Compare, Book, UserMultiple, Grid as GridIcon,
  CheckmarkOutline, DocumentAttachment, Chemistry, SidePanelOpen,
} from '@carbon/icons-react';

const ICON_MAP = {
  ChartBar, Document, Report, Analytics, DataTable,
  TextLongParagraph, Image, ListBulleted, Quotes,
  Time, Compare, Book, UserMultiple, Grid: GridIcon,
  CheckmarkOutline, DocumentAttachment, Chemistry, SidePanelOpen,
};

function PatternSuggestionCards({ suggestions, onToggle }) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className="pattern-suggestion-cards">
      <p className="pattern-suggestion-cards__header">
        İçerik profilinize göre önerilen layout pattern'ları:
      </p>
      <div className="pattern-suggestion-cards__list">
        {suggestions.map((pattern) => {
          const IconComponent = ICON_MAP[pattern.icon] || Document;
          return (
            <div
              key={pattern.id}
              className={`pattern-suggestion-card ${!pattern.enabled ? 'pattern-suggestion-card--disabled' : ''}`}
            >
              <div className="pattern-suggestion-card__icon">
                <IconComponent size={20} />
              </div>
              <div className="pattern-suggestion-card__content">
                <span className="pattern-suggestion-card__name">{pattern.name}</span>
                <span className="pattern-suggestion-card__description">{pattern.description}</span>
              </div>
              <Toggle
                id={`pattern-toggle-${pattern.id}`}
                size="sm"
                toggled={pattern.enabled}
                onToggle={() => onToggle(pattern.id)}
                labelA=""
                labelB=""
                hideLabel
                aria-label={`${pattern.name} pattern'ını ${pattern.enabled ? 'kapat' : 'aç'}`}
              />
            </div>
          );
        })}
      </div>
      <p className="pattern-suggestion-cards__hint">
        İstemediğiniz pattern'ları kapatabilirsiniz.
      </p>
    </div>
  );
}

export default PatternSuggestionCards;
