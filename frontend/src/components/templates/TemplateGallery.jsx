import React, { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  InlineLoading,
  InlineNotification,
  Loading,
  Tag,
  TextInput,
} from '@carbon/react';
import { Template, Checkmark } from '@carbon/icons-react';
import { useDocument } from '../../contexts/DocumentContext';

const SORT_OPTIONS = [
  { id: 'name', label: 'İsme Göre' },
  { id: 'updated', label: 'Güncelleme Tarihi' },
];
const STATUS_LABELS = {
  draft: 'Taslak',
  review: 'İnceleme',
  approved: 'Onaylı',
  published: 'Yayında',
};

const BUILTIN_TEMPLATE_COPY = {
  'carbon-template': {
    title: 'Standart rapor',
    subtitle: 'Genel amaçlı, sade görünüm',
    description: 'Genel amaçlı raporlar için dengeli ve okunabilir bir şablon.',
    accent: '#0f62fe',
  },
  'carbon-advanced': {
    title: 'Sunum / yönetici özeti',
    subtitle: 'Vurgu ve bölümlendirme',
    description: 'Sunum ve yönetici özeti için vurgu alanları güçlü, bölümlü bir şablon.',
    accent: '#0f62fe',
  },
  'carbon-dataviz': {
    title: 'Veri odaklı rapor',
    subtitle: 'Grafikler ve KPI özetleri',
    description: 'Metin + grafik dengesi olan, veri anlatımı için uygun bir şablon.',
    accent: '#8a3ffc',
  },
  'carbon-components': {
    title: 'Bileşen odaklı şablon',
    subtitle: 'Hazır bloklar ve örnekler',
    description: 'Hazır içerik bloklarıyla hızlıca rapor oluşturmak için uygun bir şablon.',
    accent: '#007d79',
  },
  'carbon-forms': {
    title: 'Form ve başvuru',
    subtitle: 'Alanlar ve doğrulama',
    description: 'Form benzeri içerikler ve yapılandırılmış veri girişi için uygun şablon.',
    accent: '#24a148',
  },
  'carbon-grid': {
    title: 'Izgara odaklı',
    subtitle: 'Düzen ve hizalama',
    description: 'Izgara yapısına dayalı, hizalama ve düzen kontrolü güçlü bir şablon.',
    accent: '#0f62fe',
  },
  'carbon-colors': {
    title: 'Renk temaları',
    subtitle: 'Renk şemaları ve vurgu',
    description: 'Renk şemaları ve vurgu kullanımını öne çıkaran bir şablon.',
    accent: '#ee5396',
  },
  'carbon-notifications': {
    title: 'Uyarılar ve durumlar',
    subtitle: 'Bilgilendirme blokları',
    description: 'Bilgilendirme, uyarı ve durum mesajlarını öne çıkaran bir şablon.',
    accent: '#da1e28',
  },
  'carbon-empty-states': {
    title: 'Boş durumlar',
    subtitle: 'Boş/eksik içerik ekranları',
    description: 'Boş durum, eksik veri ve yönlendirme ekranları için örnek şablon.',
    accent: '#a56eff',
  },
  'carbon-cv': {
    title: 'Özgeçmiş (CV)',
    subtitle: 'Tek sayfa özgeçmiş',
    description: 'Kısa, tek sayfalık özgeçmiş düzeni için uygun şablon.',
    accent: '#0f62fe',
  },
  'carbon-theme-g100': {
    title: 'Koyu tema',
    subtitle: 'g100 görünümü',
    description: 'Koyu tema (g100) ile yüksek kontrastlı bir şablon.',
    accent: '#0f62fe',
  },
};

function escapeXml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildPreviewDataUri({ title, subtitle, accent = '#0f62fe', theme = 'white' }) {
  const dark = ['g90', 'g100'].includes(String(theme || '').toLowerCase());
  const bg = dark ? '#161616' : '#f4f4f4';
  const panel = dark ? '#0f0f0f' : '#ffffff';
  const text = dark ? '#f4f4f4' : '#161616';
  const muted = dark ? '#c6c6c6' : '#525252';

  const safeTitle = escapeXml(title || 'Şablon');
  const safeSubtitle = escapeXml(subtitle || '');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${bg}"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0.65"/>
        </linearGradient>
      </defs>
      <rect width="800" height="450" rx="18" fill="url(#g)"/>
      <rect x="32" y="32" width="736" height="386" rx="14" fill="${panel}" fill-opacity="0.92"/>

      <rect x="64" y="76" width="172" height="10" rx="5" fill="${accent}"/>
      <text x="64" y="150" font-family="IBM Plex Sans, Arial, sans-serif" font-size="44" font-weight="600" fill="${text}">${safeTitle}</text>
      ${safeSubtitle ? `<text x="64" y="190" font-family="IBM Plex Sans, Arial, sans-serif" font-size="22" fill="${muted}">${safeSubtitle}</text>` : ''}

      <rect x="64" y="242" width="520" height="14" rx="7" fill="${muted}" fill-opacity="0.22"/>
      <rect x="64" y="270" width="460" height="14" rx="7" fill="${muted}" fill-opacity="0.16"/>
      <rect x="64" y="298" width="560" height="14" rx="7" fill="${muted}" fill-opacity="0.12"/>

      <rect x="64" y="340" width="240" height="28" rx="14" fill="${accent}" fill-opacity="0.18"/>
      <text x="84" y="360" font-family="IBM Plex Sans, Arial, sans-serif" font-size="16" fill="${text}" fill-opacity="0.9">Önizleme</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function resolveTemplateCopy(template) {
  const key = String(template?.key || '').trim();
  const isBuiltin = key.startsWith('carbon-');
  const builtin = isBuiltin ? BUILTIN_TEMPLATE_COPY[key] : null;

  const title = (builtin?.title || template?.name || key || 'Şablon').trim();
  const subtitle = (builtin?.subtitle || '').trim();
  const description = (builtin?.description || template?.description || '').trim();
  const accent = builtin?.accent || '#0f62fe';
  return { title, subtitle, description, accent, isBuiltin };
}

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
  const [query, setQuery] = useState('');
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
      { id: 'all', label: 'Tüm Temalar' },
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
      { id: 'all', label: 'Tüm Kategoriler' },
      ...Array.from(categories).map((category) => ({ id: category, label: category })),
    ];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = [...templates];
    const normalizedQuery = (query || '').trim().toLowerCase();
    if (normalizedQuery) {
      result = result.filter((template) => {
        const haystack = [
          template.name,
          template.key,
          template.description,
          template.category,
          ...(Array.isArray(template.tags) ? template.tags : []),
          template.activeVersion?.theme,
          template.activeVersion?.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      });
    }
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
  }, [templates, selectedTheme, selectedCategory, selectedSort, query]);

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
    return { type, label: STATUS_LABELS[status] || status };
  }, [activeVersion]);

  const recommendedTemplates = useMemo(() => {
    return templates
      .filter((template) => ['approved', 'published'].includes(template.activeVersion?.status))
      .slice(0, 3);
  }, [templates]);

  const governanceActions = useMemo(() => {
    if (!activeVersion?.status) return [];
    switch (activeVersion.status) {
      case 'draft':
        return [{ id: 'review', label: 'İncelemeye Gönder' }];
      case 'review':
        return [{ id: 'approved', label: 'Onayla' }];
      case 'approved':
        return [{ id: 'published', label: 'Yayınla' }];
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
      setGovernanceError(error.message || 'Şablon güncellenemedi.');
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
            Şablon Galerisi
          </h2>
          <p>PDF çıktıları için varsayılan tasarımı seçin.</p>
        </div>
        <div className="template-gallery__filters">
          <TextInput
            id="template-search"
            size="sm"
            labelText="Ara"
            placeholder="Ara (isim, anahtar, etiket...)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
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
            label="Sırala"
            onChange={({ selectedItem }) => setSelectedSort(selectedItem)}
          />
        </div>
      </div>

      {templatesError && (
          <InlineNotification
            kind="error"
            title="Şablon listesi alınamadı"
            subtitle={templatesError}
          />
      )}

      <div className="template-gallery__content">
        {templatesLoading ? (
          <div className="template-gallery__loading">
            <Loading withOverlay={false} description="Şablon listesi yükleniyor..." />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="template-gallery__empty">
            <p>Filtrelere uygun şablon bulunamadı.</p>
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <Button
                size="sm"
                kind="ghost"
                onClick={() => {
                  setQuery('');
                  setSelectedTheme('all');
                  setSelectedCategory('all');
                  setSelectedSort(SORT_OPTIONS[0]);
                }}
              >
                Filtreleri Sıfırla
              </Button>
            </div>
          </div>
        ) : (
          <>
            {recommendedTemplates.length > 0 && (
              <div className="template-gallery__recommendations">
                <h3>Öne çıkan şablonlar</h3>
                <div className="template-grid">
                  {recommendedTemplates.map((template) => (
                    (() => {
                      const copy = resolveTemplateCopy(template);
                      const theme = template.activeVersion?.theme || 'white';
                      const fallbackSrc = buildPreviewDataUri({
                        title: copy.title,
                        subtitle: copy.subtitle || copy.description,
                        accent: copy.accent,
                        theme,
                      });
                      const previewSrc = template.previewUrl || fallbackSrc;
                      return (
                    <button
                      key={`recommended-${template.id}`}
                      type="button"
                      className={`template-card${template.key === selectedTemplate ? ' template-card--selected' : ''}`}
                      onClick={() => selectTemplate(template)}
                    >
                      <div className="template-card__preview">
                        <img
                          src={previewSrc}
                          alt={`${copy.title} şablon önizlemesi`}
                          loading="lazy"
                          onError={(event) => {
                            const el = event.currentTarget;
                            if (el?.dataset?.fallbackApplied) return;
                            el.dataset.fallbackApplied = '1';
                            el.src = fallbackSrc;
                          }}
                        />
                      </div>
                      <div className="template-card__body">
                        <div className="template-card__title">{copy.title}</div>
                        {(copy.description || template.description) && (
                          <div className="template-card__description">{copy.description || template.description}</div>
                        )}
                        <div className="template-card__meta">
                          {template.activeVersion?.theme && (
                            <Tag size="sm" type="blue">
                              {template.activeVersion.theme}
                            </Tag>
                          )}
                          {template.category && (
                            <Tag size="sm" type="gray">
                              {template.category}
                            </Tag>
                          )}
                        </div>
                      </div>
                    </button>
                      );
                    })()
                  ))}
                </div>
              </div>
            )}
            <div className="template-grid">
              {filteredTemplates.map((template) => {
                const isSelected = template.key === selectedTemplate;
                const copy = resolveTemplateCopy(template);
                const theme = template.activeVersion?.theme || 'white';
                const fallbackSrc = buildPreviewDataUri({
                  title: copy.title,
                  subtitle: copy.subtitle || copy.description,
                  accent: copy.accent,
                  theme,
                });
                const previewSrc = template.previewUrl || fallbackSrc;
                return (
                  <button
                    key={template.id}
                    type="button"
                    className={`template-card${isSelected ? ' template-card--selected' : ''}`}
                    onClick={() => selectTemplate(template)}
                  >
                    <div className="template-card__preview">
                      <img
                        src={previewSrc}
                        alt={`${copy.title} şablon önizlemesi`}
                        loading="lazy"
                        onError={(event) => {
                          const el = event.currentTarget;
                          if (el?.dataset?.fallbackApplied) return;
                          el.dataset.fallbackApplied = '1';
                          el.src = fallbackSrc;
                        }}
                      />
                      {isSelected && (
                        <span className="template-card__check">
                          <Checkmark size={16} />
                        </span>
                      )}
                    </div>
                    <div className="template-card__body">
                      <div className="template-card__title">{copy.title}</div>
                      {(copy.description || template.description) && (
                        <div className="template-card__description">{copy.description || template.description}</div>
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
                            {STATUS_LABELS[template.activeVersion.status] || template.activeVersion.status}
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
                    <h3>Şablon onay süreci</h3>
                    <p>Seçili şablon sürümünün onay süreci.</p>
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
                    title="Şablon Güncellenemedi"
                    subtitle={governanceError}
                  />
                )}
                <div className="template-governance__actions">
                  {reviewerEnabled && !isReviewer && (
                    <p className="template-governance__hint">
                      Bu alan yalnızca yetkili onaylayıcılara açıktır.
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
                        <InlineLoading description="Güncelleniyor..." />
                      )}
                    </div>
                  )}
                  {reviewerEnabled && isReviewer && governanceActions.length === 0 && (
                    <p className="template-governance__hint">Bu şablon için ek aksiyon yok.</p>
                  )}
                  {!reviewerEnabled && (
                    <p className="template-governance__hint">
                      Şablon onaylama/yayınlama işlemleri bu ortamda kapalı.
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
