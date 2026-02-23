import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Accordion,
  AccordionItem,
  Button,
  Dropdown,
  InlineLoading,
  Tag,
} from '@carbon/react';
import { Information, Bullhorn, MagicWandFilled } from '@carbon/icons-react';
import { useDocument } from '../../contexts';
import {
  AI_APPLY_COMMAND_EVENT,
  AI_CHAT_PREFILL_EVENT,
  AI_COMMAND_RESULT_EVENT,
  layoutProfileOptions,
  printProfileOptions,
  QUICK_ACCESS_ACTIONS,
} from '../../constants/editorConstants';

function SettingsSidebar() {
  const {
    selectedLayoutProfile,
    selectedPrintProfile,
    setLayoutProfile,
    setPrintProfile,
    editorSelection,
    markdownContent,
    reportSettings,
  } = useDocument();
  const [pendingQuickActionId, setPendingQuickActionId] = useState(null);
  const [quickActionStatus, setQuickActionStatus] = useState('');
  const pendingRequestRef = useRef(null);

  const resolvedLayoutProfile = layoutProfileOptions.find(
    (option) => option.id === selectedLayoutProfile
  );
  const resolvedPrintProfile = printProfileOptions.find(
    (option) => option.id === selectedPrintProfile
  );

  const dispatchSidebarAiCommand = useCallback((detail) => {
    if (typeof window === 'undefined') return;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    pendingRequestRef.current = requestId;
    setPendingQuickActionId(detail?.quickActionId || detail?.kind || 'sidebar-ai');
    setQuickActionStatus(detail?.loadingMessage || 'AI komutu çalışıyor...');
    window.dispatchEvent(new CustomEvent(AI_APPLY_COMMAND_EVENT, {
      detail: {
        ...(detail || {}),
        requestId,
      },
    }));
  }, []);

  const handleQuickAccess = useCallback((action) => {
    dispatchSidebarAiCommand({
      kind: 'quick-action',
      quickActionId: action.id,
      prompt: action.prompt,
      loadingMessage: `${action.label} için AI önerisi hazırlanıyor...`,
    });
  }, [dispatchSidebarAiCommand]);

  const handleSelectionContext = useCallback(() => {
    const selectionText = String(editorSelection?.text || '').trim();
    if (!selectionText) {
      setQuickActionStatus('Önce editörde bir metin seçin.');
      setPendingQuickActionId(null);
      return;
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(AI_CHAT_PREFILL_EVENT, {
        detail: {
          selectionText,
          prompt: 'Bu seçili metni bağlam olarak kullan ve kısa iyileştirme öner.',
        },
      }));
    }

    dispatchSidebarAiCommand({
      kind: 'selection-context',
      quickActionId: 'selection-context',
      selectionText,
      loadingMessage: 'Seçili metin AI bağlamına ekleniyor...',
    });
  }, [dispatchSidebarAiCommand, editorSelection]);

  const handleWizardTransform = useCallback(() => {
    if (!String(markdownContent || '').trim()) {
      setQuickActionStatus('Sihirbaz dönüşümü için önce markdown içeriği oluşturun.');
      setPendingQuickActionId(null);
      return;
    }

    dispatchSidebarAiCommand({
      kind: 'wizard-transform',
      quickActionId: 'wizard-transform',
      wizardSettings: reportSettings,
      layoutProfile: selectedLayoutProfile,
      printProfile: selectedPrintProfile,
      loadingMessage: 'Sihirbaz tercihleri markdown\u2019a AI ile uygulanıyor...',
    });
  }, [dispatchSidebarAiCommand, markdownContent, reportSettings, selectedLayoutProfile, selectedPrintProfile]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onAiCommandResult = (event) => {
      const detail = event?.detail || {};
      const expectedRequestId = pendingRequestRef.current;
      if (!expectedRequestId) {
        return;
      }
      if (detail.requestId && detail.requestId !== expectedRequestId) {
        return;
      }
      pendingRequestRef.current = null;
      setPendingQuickActionId(null);
      setQuickActionStatus(detail.message || (detail.ok ? 'AI komutu tamamlandı.' : 'AI komutu tamamlanamadı.'));
    };

    window.addEventListener(AI_COMMAND_RESULT_EVENT, onAiCommandResult);
    return () => {
      window.removeEventListener(AI_COMMAND_RESULT_EVENT, onAiCommandResult);
    };
  }, []);

  useEffect(() => {
    if (!quickActionStatus || pendingQuickActionId) return undefined;
    const timeout = setTimeout(() => setQuickActionStatus(''), 5000);
    return () => clearTimeout(timeout);
  }, [quickActionStatus, pendingQuickActionId]);

  return (
    <aside className="settings-sidebar">
      <Accordion>
        <AccordionItem title="Yerleşim Profili" open>
          <Dropdown
            id="layout-profile-select"
            items={layoutProfileOptions}
            selectedItem={resolvedLayoutProfile}
            onChange={({ selectedItem }) => setLayoutProfile(selectedItem.id)}
            itemToString={(item) => item?.label || ''}
            label="Profil Seçin"
            titleText=""
          />
          <p className="settings-section__hint" title={resolvedLayoutProfile?.hint || ''}>
            <Information size={14} />
            <span>{resolvedLayoutProfile?.description || resolvedLayoutProfile?.hint}</span>
          </p>
        </AccordionItem>

        <AccordionItem title="Baskı Profili" open>
          <Dropdown
            id="print-profile-select"
            items={printProfileOptions}
            selectedItem={resolvedPrintProfile}
            onChange={({ selectedItem }) => setPrintProfile(selectedItem.id)}
            itemToString={(item) => item?.label || ''}
            label="Profil Seçin"
            titleText=""
          />
          <p className="settings-section__hint" title={resolvedPrintProfile?.hint || ''}>
            <Information size={14} />
            <span>{resolvedPrintProfile?.description || resolvedPrintProfile?.hint}</span>
          </p>
        </AccordionItem>

        {Object.keys(reportSettings).some(k => reportSettings[k]) && (
          <AccordionItem title="Rapor Ayarları" open>
            <div className="settings-summary">
              {reportSettings.documentType && (
                <Tag type="blue" size="sm">{reportSettings.documentType}</Tag>
              )}
              {reportSettings.audience && (
                <Tag type="purple" size="sm">{reportSettings.audience}</Tag>
              )}
              {reportSettings.colorScheme && (
                <Tag type="cyan" size="sm">{reportSettings.colorScheme}</Tag>
              )}
              {reportSettings.layoutStyle && (
                <Tag type="teal" size="sm">{reportSettings.layoutStyle}</Tag>
              )}
            </div>
          </AccordionItem>
        )}

        <AccordionItem title="Hızlı Erişim" open>
          <div className="quick-access-actions">
            {QUICK_ACCESS_ACTIONS.map((action) => (
              <Button
                key={action.id}
                size="sm"
                kind="tertiary"
                renderIcon={action.icon}
                className="quick-access-button"
                onClick={() => handleQuickAccess(action)}
                disabled={Boolean(pendingQuickActionId)}
              >
                {action.label}
              </Button>
            ))}
          </div>
          <div className="quick-access-actions quick-access-actions--secondary">
            <Button
              size="sm"
              kind="ghost"
              renderIcon={Bullhorn}
              onClick={handleSelectionContext}
              disabled={!String(editorSelection?.text || '').trim() || Boolean(pendingQuickActionId)}
            >
              Seçili Metni AI Bağlamına Ekle
            </Button>
            <Button
              size="sm"
              kind="ghost"
              renderIcon={MagicWandFilled}
              onClick={handleWizardTransform}
              disabled={!markdownContent || Boolean(pendingQuickActionId)}
            >
              Sihirbazı Markdown'a Uygula
            </Button>
          </div>
          {pendingQuickActionId ? (
            <InlineLoading status="active" description={quickActionStatus || 'AI komutu çalışıyor...'} />
          ) : null}
          {!pendingQuickActionId && quickActionStatus ? (
            <p className="settings-section__status">{quickActionStatus}</p>
          ) : null}
        </AccordionItem>
      </Accordion>
    </aside>
  );
}

export default SettingsSidebar;
