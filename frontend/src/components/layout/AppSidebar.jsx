/**
 * AppSidebar Component
 * 
 * Settings sidebar with conversion options.
 * Includes layout/print profile selection, file upload, and quick actions.
 */

import React, { memo, useCallback } from 'react';
import { Button, Dropdown, Tag } from '@carbon/react';
import {
  Upload,
  Play,
  Download,
  ColorPalette,
  TextFont,
  ChartBar,
  Grid as GridIcon,
  Template,
} from '@carbon/icons-react';

// Layout profile options
const LAYOUT_PROFILE_OPTIONS = [
  {
    id: 'symmetric',
    label: 'Simetrik (Dengeli)',
    description: 'Kurumsal raporlar için dengeli kolon akışı ve düzenli ritim sağlar.',
    hint: 'Başlık, metin ve görsellerin daha eşit ağırlıkla ilerlediği düzen.',
  },
  {
    id: 'asymmetric',
    label: 'Asimetrik (Vurgu)',
    description: 'Hikâye anlatımı odaklı, vurgu alanları güçlü bir kompozisyon sunar.',
    hint: 'Kritik bulguları öne çıkaran daha dinamik blok dağılımı.',
  },
  {
    id: 'dashboard',
    label: 'Dashboard (Yoğun)',
    description: 'Veri yoğun dokümanlarda tablo, metrik ve grafik bloklarını optimize eder.',
    hint: 'KPI, kart ve kısa özet bloklarını yoğun kullanan düzen.',
  },
];

// Print profile options
const PRINT_PROFILE_OPTIONS = [
  {
    id: 'pagedjs-a3',
    label: 'Paged.js A3 (297×420mm)',
    shortLabel: 'A3',
    description: 'Geniş alan, tablo ve grafik yoğun içeriklerde ideal.',
    hint: 'Büyük görseller, karşılaştırmalı tablolar ve pano tipli raporlar için.',
  },
  {
    id: 'pagedjs-a4',
    label: 'Paged.js A4 (210×297mm)',
    shortLabel: 'A4',
    description: 'Standart rapor çıktıları için dengeli ve yaygın profil.',
    hint: 'Genel kullanım için önerilen varsayılan çıktı boyutu.',
  },
  {
    id: 'pagedjs-a5',
    label: 'Paged.js A5 (148×210mm)',
    shortLabel: 'A5',
    description: 'Kompakt çıktı, özet doküman ve broşürler için optimize.',
    hint: 'Kısa raporlar, tek bakışta özet ve mobil odaklı baskılar için.',
  },
];

function AppSidebar({
  selectedLayoutProfile,
  onLayoutProfileChange,
  selectedPrintProfile,
  onPrintProfileChange,
  onFileUpload,
  onConvert,
  onDownload,
  isConverting = false,
}) {
  const resolvedLayoutProfile = LAYOUT_PROFILE_OPTIONS.find(
    (option) => option.id === selectedLayoutProfile
  );
  const resolvedPrintProfile = PRINT_PROFILE_OPTIONS.find(
    (option) => option.id === selectedPrintProfile
  );

  // Handle file input change
  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileUpload?.(file);
    }
  }, [onFileUpload]);

  return (
    <aside className="settings-sidebar" aria-label="Dönüştürme ayarları">
      {/* Layout Profile Selection */}
      <div className="settings-section">
        <div className="settings-section__title">Yerleşim Profili</div>
        <Dropdown
          id="layout-profile-select"
          items={LAYOUT_PROFILE_OPTIONS}
          selectedItem={resolvedLayoutProfile}
          onChange={({ selectedItem }) => onLayoutProfileChange?.(selectedItem?.id)}
          label="Profil Seçin"
          titleText=""
        />
      </div>

      {/* Print Profile Selection */}
      <div className="settings-section">
        <div className="settings-section__title">Baskı Profili</div>
        <Dropdown
          id="print-profile-select"
          items={PRINT_PROFILE_OPTIONS}
          selectedItem={resolvedPrintProfile}
          onChange={({ selectedItem }) => onPrintProfileChange?.(selectedItem?.id)}
          label="Profil Seçin"
          titleText=""
        />
      </div>

      {/* File Upload */}
      <div className="settings-section">
        <div className="settings-section__title">Dosya Yükle</div>
        <div className="file-upload-area" role="button" tabIndex={0}>
          <Upload size={32} className="file-upload-area__icon" aria-hidden="true" />
          <p className="file-upload-area__text">
            Dosya sürükleyin veya{' '}
            <label className="file-upload-area__link">
              gözatın
              <input
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleFileChange}
                className="visually-hidden"
                aria-label="Markdown dosyası seçin"
              />
            </label>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="settings-section">
        <div className="settings-section__title">İşlemler</div>
        <Button
          kind="primary"
          size="lg"
          renderIcon={Play}
          onClick={onConvert}
          disabled={isConverting}
          className="action-button action-button--primary"
        >
          {isConverting ? 'Dönüştürülüyor...' : 'PDF Oluştur'}
        </Button>
        <Button
          kind="secondary"
          size="lg"
          renderIcon={Download}
          onClick={onDownload}
          className="action-button action-button--secondary"
        >
          PDF İndir
        </Button>
      </div>

      {/* Quick Access Tags */}
      <div className="settings-section">
        <div className="settings-section__title">Hızlı Erişim</div>
        <div className="quick-access-tags">
          <Tag type="blue" renderIcon={ColorPalette}>Renkler</Tag>
          <Tag type="purple" renderIcon={TextFont}>Tipografi</Tag>
          <Tag type="cyan" renderIcon={ChartBar}>Grafikler</Tag>
          <Tag type="teal" renderIcon={GridIcon}>Grid</Tag>
          <Tag type="green" renderIcon={Template}>Bileşenler</Tag>
        </div>
      </div>
    </aside>
  );
}

export default memo(AppSidebar);

// Export options for use in parent component
export { LAYOUT_PROFILE_OPTIONS, PRINT_PROFILE_OPTIONS };
