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
  { id: 'symmetric', text: 'Symmetric (Dengeli)' },
  { id: 'asymmetric', text: 'Asymmetric (Vurgu)' },
  { id: 'dashboard', text: 'Dashboard (Yoğun)' },
];

// Print profile options
const PRINT_PROFILE_OPTIONS = [
  { id: 'pagedjs-a4', text: 'Paged.js A4' },
  { id: 'pagedjs-a3', text: 'Paged.js A3' },
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
