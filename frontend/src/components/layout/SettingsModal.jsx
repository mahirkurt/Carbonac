/**
 * SettingsModal Component
 * 
 * Application settings modal with tabs for General, Appearance, and Conversion.
 */

import React, { memo } from 'react';
import {
  Modal,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Toggle,
  Dropdown,
} from '@carbon/react';
import { useTheme, THEMES, THEME_LABELS } from '../../contexts/ThemeContext';
import { LAYOUT_PROFILE_OPTIONS, PRINT_PROFILE_OPTIONS } from './AppSidebar';

const THEME_OPTIONS = Object.values(THEMES).map((theme) => ({
  id: theme,
  label: THEME_LABELS[theme],
}));

function SettingsModal({
  isOpen,
  onClose,
  selectedLayoutProfile,
  onLayoutProfileChange,
  selectedPrintProfile,
  onPrintProfileChange,
  autoSave = true,
  onAutoSaveChange,
  livePreview = true,
  onLivePreviewChange,
}) {
  const { theme, setTheme, useSystemPreference, toggleSystemPreference } = useTheme();

  return (
    <Modal
      open={isOpen}
      modalHeading="Ayarlar"
      primaryButtonText="Kaydet"
      secondaryButtonText="İptal"
      onRequestClose={onClose}
      onRequestSubmit={onClose}
      size="md"
      aria-label="Uygulama ayarları"
    >
      <Tabs>
        <TabList aria-label="Ayar kategorileri">
          <Tab>Genel</Tab>
          <Tab>Görünüm</Tab>
          <Tab>Dönüştürme</Tab>
        </TabList>
        
        <TabPanels>
          {/* General Settings */}
          <TabPanel>
            <div className="settings-modal__section">
              <Toggle
                id="auto-save"
                labelText="Otomatik Kaydetme"
                labelA="Kapalı"
                labelB="Açık"
                toggled={autoSave}
                onToggle={(checked) => onAutoSaveChange?.(checked)}
              />
              <p className="settings-modal__hint">Değişiklikler otomatik olarak yerel taslağa kaydedilir.</p>
              
              <Toggle
                id="live-preview"
                labelText="Canlı Önizleme"
                labelA="Kapalı"
                labelB="Açık"
                toggled={livePreview}
                onToggle={(checked) => onLivePreviewChange?.(checked)}
              />
              <p className="settings-modal__hint">PDF üretimi olmadan hızlı markdown önizlemesini gösterir.</p>
            </div>
          </TabPanel>
          
          {/* Appearance Settings */}
          <TabPanel>
            <div className="settings-modal__section">
              <Toggle
                id="system-preference"
                labelText="Sistem Temasını Kullan"
                labelA="Kapalı"
                labelB="Açık"
                toggled={useSystemPreference}
                onToggle={toggleSystemPreference}
              />
              
              {!useSystemPreference && (
                <Dropdown
                  id="theme-select"
                  items={THEME_OPTIONS}
                  selectedItem={THEME_OPTIONS.find((t) => t.id === theme)}
                  onChange={({ selectedItem }) => setTheme(selectedItem.id)}
                  label="Tema Seçin"
                  titleText="Uygulama Teması"
                />
              )}
              
            </div>
          </TabPanel>
          
          {/* Conversion Settings */}
          <TabPanel>
            <div className="settings-modal__section">
              <Dropdown
                id="default-layout-profile"
                items={LAYOUT_PROFILE_OPTIONS}
                selectedItem={LAYOUT_PROFILE_OPTIONS.find((item) => item.id === selectedLayoutProfile)}
                onChange={({ selectedItem }) => onLayoutProfileChange?.(selectedItem?.id)}
                label="Varsayılan Yerleşim Profili"
                titleText="Yerleşim Profili"
              />
              <Dropdown
                id="default-print-profile"
                items={PRINT_PROFILE_OPTIONS}
                selectedItem={PRINT_PROFILE_OPTIONS.find((item) => item.id === selectedPrintProfile)}
                onChange={({ selectedItem }) => onPrintProfileChange?.(selectedItem?.id)}
                label="Varsayılan Baskı Profili"
                titleText="Baskı Profili"
              />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Modal>
  );
}

export default memo(SettingsModal);
