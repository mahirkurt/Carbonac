import React, { useEffect, useMemo, useState } from 'react';
import { Button, Dropdown, InlineLoading, InlineNotification, Loading, Tag } from '@carbon/react';
import { Template, Checkmark } from '@carbon/icons-react';
import { useDocument } from '../../contexts/DocumentContext';

const SORT_OPTIONS = [
  { id: 'name', label: 'Isme gore' },
  { id: 'updated', label: 'Guncelleme tarihi' },
];

function TemplateGallery() {
  const {
    templates,
    templatesLoading,
    templatesError,
    selectedTemplate,
    loadTemplates,
    selectTemplate,
    updateTemplateVersionStatus,
    reviewerEnabled,
    isReviewer,
  } = useDocument();
  const [selectedTheme, setSelectedTheme] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSort, setSelectedSort] = useState(SORT_OPTIONS[0]);
  const [governanceLoading, setGovernanceLoading] = useState(false);
  const [governanceError, setGovernanceError] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const themeOptions = useMemo(() => {
    const themes = new Set();
    templates.forEach((template) => {
      if (template.activeVersion?.theme) {
        themes.add(template.activeVersion.theme);
      }
    });
    return [
      { id: 'all', label: 'Tum temalar' },
      ...Array.from(themes).map((theme) => ({ id: theme, label: theme })),
    ];
  }, [templates]);

  const categoryOptions = useMemo(() => {
    const categories = new Set();
    templates.forEach((template) => {
      if (template.category) {
        categories.add(template.category);
      }
    });
    return [
      { id: 'all', label: 'Tum tipler' },
      ...Array.from(categories).map((category) => ({ id: category, label: category })),
    ];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];
    if (selectedTheme !== 'all') {
      result = result.filter((template) => template.activeVersion?.theme === selectedTheme);
    }
    if (selectedCategory !== 'all') {
      result = result.filter((template) => template.category === selectedCategory);
    }
    if (selectedSort.id === 'name') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else if (selectedSort.id === 'updated') {
      result.sort((a, b) => {
        const left = Date.parse(a.updatedAt || a.createdAt || '') || 0;
        const right = Date.parse(b.updatedAt || b.createdAt || '') || 0;
        return right - left;
      });
    }
    return result;
  }, [templates, selectedTheme, selectedCategory, selectedSort]);

  const selectedTemplateData = useMemo(() => {
    return templates.find((template) => template.key === selectedTemplate) || null;
  }, [templates, selectedTemplate]);

  const activeVersion = selectedTemplateData?.activeVersion || null;

  const statusTag = useMemo(() => {
    if (!activeVersion?.status) return null;
    const status = activeVersion.status;
    const type = status === 'approved' || status === 'published'
      ? 'green'
      : status === 'review'
        ? 'blue'
        : 'gray';
    const labelMap = {
      draft: 'Taslak',
      review: 'Inceleme',
      approved: 'Onayli',
      published: 'Yayinda',
    };
    return { type, label: labelMap[status] || status };
  }, [activeVersion]);

  const governanceActions = useMemo(() => {
    if (!activeVersion?.status) return [];
    switch (activeVersion.status) {
      case 'draft':
        return [{ id: 'review', label: 'Reviewe gonder' }];
      case 'review':
        return [{ id: 'approved', label: 'Onayla' }];
      case 'approved':
        return [{ id: 'published', label: 'Yayinla' }];
      default:
        return [];
    }
  }, [activeVersion]);

  const handleGovernanceAction = async (nextStatus) => {
    if (!activeVersion?.id) return;
    setGovernanceError(null);
    setGovernanceLoading(true);
    try {
      await updateTemplateVersionStatus(activeVersion.id, nextStatus);
    } catch (error) {
      setGovernanceError(error.message || 'Template guncellenemedi.');
    } finally {
      setGovernanceLoading(false);
    }
  };

  return (
    <section className="template-gallery" id="templates">
      <div className="template-gallery__header">
        <div>
          <h2 className="template-gallery__title">
            <Template size={20} />
            Template Galerisi
          </h2>
          <p>PDF ciktilari icin varsayilan tasarimi secin.</p>
        </div>
        <div className="template-gallery__filters">
          <Dropdown
            id="template-theme-filter"
            size="sm"
            items={themeOptions}
            selectedItem={themeOptions.find((item) => item.id === selectedTheme) || themeOptions[0]}
            label="Tema"
            onChange={({ selectedItem }) => setSelectedTheme(selectedItem.id)}
          />
          <Dropdown
            id="template-category-filter"
            size="sm"
            items={categoryOptions}
            selectedItem={categoryOptions.find((item) => item.id === selectedCategory) || categoryOptions[0]}
            label="Tip"
            onChange={({ selectedItem }) => setSelectedCategory(selectedItem.id)}
          />
          <Dropdown
            id="template-sort"
            size="sm"
            items={SORT_OPTIONS}
            selectedItem={selectedSort}
            label="Sirala"
            onChange={({ selectedItem }) => setSelectedSort(selectedItem)}
          />
        </div>
      </div>

      {templatesError && (
        <InlineNotification
          kind="error"
          title="Template listesi alinmadi"
          subtitle={templatesError}
        />
      )}

      <div className="template-gallery__content">
        {templatesLoading ? (
          <div className="template-gallery__loading">
            <Loading withOverlay={false} description="Template listesi yukleniyor..." />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="template-gallery__empty">
            <p>Filtrelere uygun template bulunamadi.</p>
          </div>
        ) : (
          <>
            <div className="template-grid">
              {filteredTemplates.map((template) => {
                const isSelected = template.key === selectedTemplate;
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-card${isSelected ? ' template-card--selected' : ''}`}
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="template-card__preview">
                      {template.previewUrl ? (
                        <img src={template.previewUrl} alt={`${template.name} preview`} />
                      ) : (
                        <div className="template-card__placeholder">
                          <Template size={24} />
                          <span>Preview hazir degil</span>
                        </div>
                      )}
                      {isSelected && (
                        <span className="template-card__check">
                          <Checkmark size={16} />
                        </span>
                      )}
                    </div>
                    <div className="template-card__body">
                      <div className="template-card__title">{template.name}</div>
                      {template.description && (
                        <div className="template-card__description">{template.description}</div>
                      )}
                      <div className="template-card__meta">
                        {template.category && (
                          <Tag size="sm" type="gray">
                            {template.category}
                          </Tag>
                        )}
                        {template.activeVersion?.theme && (
                          <Tag size="sm" type="blue">
                            {template.activeVersion.theme}
                          </Tag>
                        )}
                        {template.activeVersion?.status && (
                          <Tag size="sm" type="gray">
                            {template.activeVersion.status}
                          </Tag>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedTemplateData && (
              <div className="template-governance">
                <div className="template-governance__header">
                  <div>
                    <h3>Template Governance</h3>
                    <p>Secili template versiyonu onay akisi.</p>
                  </div>
                  {statusTag && (
                    <Tag size="sm" type={statusTag.type}>
                      {statusTag.label}
                    </Tag>
                  )}
                </div>
                {governanceError && (
                  <InlineNotification
                    kind="error"
                    title="Template guncellenemedi"
                    subtitle={governanceError}
                  />
                )}
                <div className="template-governance__actions">
                  {reviewerEnabled && !isReviewer && (
                    <p className="template-governance__hint">
                      Reviewer yetkisi olmayan kullanicilar status guncelleyemez.
                    </p>
                  )}
                  {reviewerEnabled && isReviewer && governanceActions.length > 0 && (
                    <div className="template-governance__buttons">
                      {governanceActions.map((action) => (
                        <Button
                          key={action.id}
                          size="sm"
                          kind="ghost"
                          disabled={governanceLoading}
                          onClick={() => handleGovernanceAction(action.id)}
                        >
                          {action.label}
                        </Button>
                      ))}
                      {governanceLoading && (
                        <InlineLoading description="Guncelleniyor..." />
                      )}
                    </div>
                  )}
                  {reviewerEnabled && isReviewer && governanceActions.length === 0 && (
                    <p className="template-governance__hint">Bu template icin ek aksiyon yok.</p>
                  )}
                  {!reviewerEnabled && (
                    <p className="template-governance__hint">
                      Reviewer listesi tanimlanmadi (VITE_TEMPLATE_REVIEWER_EMAILS).
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default TemplateGallery;
