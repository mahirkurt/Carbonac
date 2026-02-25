/**
 * Carbonac AI Chat
 * Carbon AI Chat widget wired to Carbonac backend (/api/ai/ask, /api/ai/analyze).
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ChatContainer,
  ChatCustomElement,
  MessageInputType,
  MessageResponseTypes,
  MinimizeButtonIconType,
} from '@carbon/ai-chat';

import { useDocument, useTheme } from '../../contexts';
import { askAi, analyzeAi } from '../../services/aiService';
import { applyLintFixes } from '../../utils/markdownLintFixes';
import {
  AI_APPLY_COMMAND_EVENT,
  AI_CHAT_PREFILL_EVENT,
  AI_CHAT_SUGGESTIONS_EVENT,
  AI_COMMAND_RESULT_EVENT,
} from '../../constants/editorConstants';

function tryExtractMarkdownFromResponse(text) {
  const value = String(text || '').trim();
  if (!value) return null;

  const jsonFence = value.match(/```json\s*([\s\S]*?)```/i);
  const jsonRaw = jsonFence ? jsonFence[1] : value;
  try {
    const parsed = JSON.parse(jsonRaw);
    const candidate = parsed?.markdown || parsed?.revisedMarkdown || parsed?.content || null;
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate;
    }
  } catch {
    // continue
  }

  const mdFence = value.match(/```(?:md|markdown)?\s*([\s\S]*?)```/i);
  if (mdFence?.[1]?.trim()) {
    return mdFence[1].trim();
  }

  return null;
}

function clampText(value, maxChars) {
  const text = String(value || '');
  if (text.length <= maxChars) return text;
  return `${text.slice(0, Math.max(0, maxChars - 15))}\n\n...(truncated)`;
}

function extractOutline(markdown, maxItems = 32) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const outline = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const match = line.match(/^(#{1,3})\s+(.+)/);
    if (!match) continue;
    outline.push({
      level: match[1].length,
      text: (match[2] || '').trim(),
      line: i + 1,
    });
    if (outline.length >= maxItems) break;
  }
  return outline;
}

function buildMarkdownExcerpt(markdown, headChars = 4500, tailChars = 1200) {
  const text = String(markdown || '');
  if (!text) return { head: '', tail: '' };
  if (text.length <= headChars + tailChars + 64) {
    return { head: text, tail: '' };
  }
  return {
    head: text.slice(0, headChars),
    tail: text.slice(-tailChars),
  };
}

function formatAnalyzeOutput(raw) {
  const text = String(raw || '').trim();
  if (!text) return 'Analiz sonucu bos dondu.';

  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === 'object') {
        const summary = parsed.summary ? String(parsed.summary).trim() : '';
        const keyFindings = Array.isArray(parsed.keyFindings) ? parsed.keyFindings : [];
        const risks = Array.isArray(parsed.risks) ? parsed.risks : [];
        const layoutSuggestions = Array.isArray(parsed.layoutSuggestions) ? parsed.layoutSuggestions : [];

        const sections = [];
        if (summary) sections.push(`## Ozet\n\n${summary}`);
        if (keyFindings.length) sections.push(`## Kilit Bulgular\n\n${keyFindings.map((x) => `- ${String(x).trim()}`).join('\n')}`);
        if (risks.length) sections.push(`## Riskler\n\n${risks.map((x) => `- ${String(x).trim()}`).join('\n')}`);
        if (layoutSuggestions.length) {
          sections.push(`## Layout Onerileri\n\n${layoutSuggestions.map((x) => `- ${String(x).trim()}`).join('\n')}`);
        }

        if (sections.length) return sections.join('\n\n');
      }
    } catch (error) {
      // fallthrough
    }

    return `Analiz çıktısı JSON gibi görünüyor ama ayrıştırılamadı:\n\n\`\`\`json\n${clampText(text, 8000)}\n\`\`\``;
  }

  return clampText(text, 9000);
}

function toInlineErrorItem(error, fallbackText) {
  const err = error instanceof Error ? error : new Error(String(error));
  const statusCode = Number(err.status) || undefined;
  const code = err.code ? String(err.code) : undefined;
  const requestId = err.requestId ? String(err.requestId) : undefined;
  const retryAfterSecs = err.retryAfterSecs ? Number(err.retryAfterSecs) : undefined;

  const debugInfo = {
    ...(code ? { code } : {}),
    ...(requestId ? { request_id: requestId } : {}),
    ...(retryAfterSecs ? { retry_after_secs: retryAfterSecs } : {}),
  };

  return {
    response_type: MessageResponseTypes.INLINE_ERROR,
    text: fallbackText || err.message || 'Bir hata oluştu.',
    debug: {
      ...(statusCode ? { statusCode } : {}),
      text: err.message,
      info: Object.keys(debugInfo).length ? debugInfo : undefined,
    },
  };
}

function formatLintForHumans(lintIssues = []) {
  if (!Array.isArray(lintIssues) || lintIssues.length === 0) return '';

  const top = lintIssues
    .slice(0, 6)
    .map((issue) => {
      const ruleId = String(issue?.ruleId || '').trim();
      const message = String(issue?.message || '').trim();
      const line = Number(issue?.line) || 0;

      const titleMap = {
        'unknown-directive': 'Tanınmayan bir özel blok (directive) kullanılmış',
        'directive-attribute': 'Özel blokta desteklenmeyen bir ayar (attribute) var',
        'empty-heading': 'Boş başlık var',
        'heading-order': 'Başlık sırası atlanmış',
        'duplicate-heading': 'Aynı başlık birden fazla kez kullanılmış',
        'long-paragraph': 'Paragraf çok uzun',
      };

      const actionMap = {
        'unknown-directive':
          'Directive adını kontrol edin veya desteklenen bir directive seçin. (Örn: callout, figure, chart)',
        'directive-attribute':
          'Bu directive için geçerli ayarları kullanın; hatalı attribute’u kaldırın ya da düzeltin.',
        'empty-heading':
          'Başlığa bir metin ekleyin veya başlığı kaldırın.',
        'heading-order':
          'Başlık seviyelerini sırayla kullanın. (Örn: H2’den sonra H3)',
        'duplicate-heading':
          'Başlıkları benzersiz yapın veya tekrar eden başlığı birleştirin.',
        'long-paragraph':
          'Paragrafı 2-3 kısa paragrafa bölün; madde işaretleri kullanabilirsiniz.',
      };

      const title = titleMap[ruleId] || 'Biçim/Düzen uyarısı';
      const action = actionMap[ruleId] || 'Metni daha kısa ve anlaşılır hale getirmeyi deneyin.';

      const where = line ? ` (satır ${line})` : '';
      const details = message ? `\n  - Detay: ${message}` : '';

      return `- ${title}${where}\n  - Öneri: ${action}${details}`;
    })
    .join('\n');

  const remaining = lintIssues.length > 6 ? `\n\n(+${lintIssues.length - 6} uyarı daha var)` : '';
  return `Şu anki metinde bazı yazım/düzen uyarıları görüyorum:\n\n${top}${remaining}`;
}

function getAiUserFacingErrorText(error) {
  const status = Number(error?.status) || 0;
  const retryAfterSecs = Number(error?.retryAfterSecs) || 0;

  if (status === 401) {
    return 'Oturum geçersiz veya süresi dolmuş olabilir. Lütfen tekrar giriş yapın.';
  }
  if (status === 429) {
    return retryAfterSecs
      ? `AI için oran sınırına ulaştınız. ${retryAfterSecs} sn sonra tekrar deneyin.`
      : 'AI için oran sınırına ulaştınız. Biraz sonra tekrar deneyin.';
  }
  return 'AI isteği başarısız oldu.';
}

function buildSuggestionPack({ hasMarkdown = false, hasSelection = false } = {}) {
  if (!hasMarkdown) {
    return [
      {
        label: 'Örnek markdown iskeleti oluştur',
        prompt: 'Carbon standartlarında örnek bir rapor markdown iskeleti oluştur. Çıktıyı markdown code block olarak ver.',
        expectMarkdown: true,
      },
      {
        label: 'Doküman yapısı öner',
        prompt: 'Bu doküman için kapak, içindekiler ve bölüm akışını kısa maddelerle öner.',
        expectMarkdown: false,
      },
    ];
  }

  const suggestions = [
    {
      label: 'Tüm metni Carbon uyumlu revize et',
      prompt: 'Markdown içeriğini Carbon tasarım ilkelerine göre baştan sona revize et. Çıktıyı yalnızca markdown code block olarak ver.',
      expectMarkdown: true,
      applyTarget: 'document',
    },
    {
      label: 'Kapak + içindekiler ekle',
      prompt: 'Mevcut markdown içeriğine Carbon uyumlu kapak ve içindekiler ekle. Çıktıyı tam markdown olarak ver.',
      expectMarkdown: true,
      applyTarget: 'document',
    },
    {
      label: 'Tablo/grafik noktalarını öner',
      prompt: 'Bu dokümanda tablo ve grafik eklenebilecek bölümleri kısa gerekçelerle listele.',
      expectMarkdown: false,
    },
  ];

  if (hasSelection) {
    suggestions.unshift({
      label: 'Seçili metni revize et',
      prompt: 'Seçili metni daha açık, kısa ve profesyonel olacak şekilde revize et. Çıktıyı sadece seçili bölüm markdown olarak ver.',
      expectMarkdown: true,
      applyTarget: 'selection',
    });
  }

  return suggestions.slice(0, 6);
}

function insertSnippetAtSelection({ markdown = '', snippet = '', start = 0, end = 0 }) {
  const current = String(markdown || '');
  const normalizedSnippet = String(snippet || '').trim();
  if (!normalizedSnippet) return current;

  const safeStart = Math.max(0, Math.min(Number(start) || 0, current.length));
  const safeEnd = Math.max(safeStart, Math.min(Number(end) || safeStart, current.length));

  const before = current.slice(0, safeStart);
  const after = current.slice(safeEnd);
  const needsLeadingBreak = before.length > 0 && !before.endsWith('\n');
  const needsTrailingBreak = after.length > 0 && !after.startsWith('\n');

  return `${before}${needsLeadingBreak ? '\n\n' : ''}${normalizedSnippet}${needsTrailingBreak ? '\n' : ''}${after}`;
}

export default function CarbonacAiChat({
  enabled = true,
  embedded = false,
  embeddedClassName = 'carbonac-ai-chat--embedded',
  isAuthenticated = false,
  onRequestLogin,
  onInstanceReady,
}) {
  const { theme } = useTheme();
  const doc = useDocument();

  const instanceRef = useRef(null);
  const historyRef = useRef([]);
  const prefillContextRef = useRef([]);

  const pushHistory = useCallback((role, text) => {
    const normalized = String(text || '').trim();
    if (!normalized) return;
    historyRef.current.push({ role, text: clampText(normalized, 3000) });
    if (historyRef.current.length > 40) {
      historyRef.current = historyRef.current.slice(-40);
    }
  }, []);

  const pushPrefillContext = useCallback((text, label = 'Bağlam') => {
    const normalizedText = String(text || '').trim();
    if (!normalizedText) return;

    prefillContextRef.current = [
      ...prefillContextRef.current,
      {
        label: String(label || 'Bağlam').trim() || 'Bağlam',
        text: clampText(normalizedText, 1400),
        timestamp: Date.now(),
      },
    ].slice(-8);
  }, []);

  const emitAiCommandResult = useCallback((payload = {}) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(AI_COMMAND_RESULT_EVENT, {
      detail: payload,
    }));
  }, []);

  const markAuthRequired = useCallback((requestId, kind, message) => {
    emitAiCommandResult({
      requestId,
      kind,
      ok: false,
      authRequired: true,
      message,
    });
  }, [emitAiCommandResult]);

  const emitAiSuggestions = useCallback((suggestions = []) => {
    if (typeof window === 'undefined') return;

    const normalized = (Array.isArray(suggestions) ? suggestions : [])
      .map((item) => ({
        label: String(item?.label || '').trim(),
        prompt: String(item?.prompt || '').trim(),
        expectMarkdown: item?.expectMarkdown === true,
        applyTarget: item?.applyTarget === 'selection' ? 'selection' : 'document',
      }))
      .filter((item) => item.label && item.prompt)
      .slice(0, 6);

    window.dispatchEvent(new CustomEvent(AI_CHAT_SUGGESTIONS_EVENT, {
      detail: { suggestions: normalized },
    }));
  }, []);

  const publishSuggestionPack = useCallback(() => {
    const hasMarkdown = Boolean(String(doc.markdownContent || '').trim());
    const hasSelection = Boolean(String(doc.editorSelection?.text || '').trim());
    emitAiSuggestions(buildSuggestionPack({ hasMarkdown, hasSelection }));
  }, [doc.editorSelection?.text, doc.markdownContent, emitAiSuggestions]);

  const buildContext = useCallback((question) => {
    const markdown = doc.markdownContent || '';
    const lintIssues = Array.isArray(doc.lintIssues) ? doc.lintIssues : [];
    const outline = extractOutline(markdown, 28);
    const excerpt = buildMarkdownExcerpt(markdown, 4200, 1100);

    const lintTop = lintIssues.slice(0, 6).map((issue) => ({
      ruleId: issue.ruleId,
      severity: issue.severity,
      message: issue.message,
      line: issue.line,
      column: issue.column,
    }));

    const recentChat = historyRef.current.slice(-6);
    const prefillContext = prefillContextRef.current
      .slice(-5)
      .map((entry) => ({
        label: entry.label,
        text: entry.text,
      }));
    const selection = doc.editorSelection || { start: 0, end: 0, text: '' };

    // Keep context readable and compact (models handle this well).
    return clampText(
      [
        `context_version: 1`,
        `theme: ${theme}`,
        `workflow_step: ${doc.currentStep}`,
        `workspace: workflow`,
        `template: ${doc.selectedTemplate}`,
        `layout_profile: ${doc.selectedLayoutProfile}`,
        `print_profile: ${doc.selectedPrintProfile}`,
        `document: ${doc.fileName || '(unknown)'}`,
        '',
        doc.reportSettings
          ? `report_settings: ${JSON.stringify(doc.reportSettings)}`
          : null,
        lintTop.length
          ? `lint_top: ${JSON.stringify(lintTop)}`
          : `lint_top: []`,
        outline.length
          ? `outline: ${JSON.stringify(outline)}`
          : `outline: []`,
        '',
        excerpt.head ? `markdown_head:\n${excerpt.head}` : null,
        excerpt.tail ? `\nmarkdown_tail:\n${excerpt.tail}` : null,
        recentChat.length
          ? `\nrecent_chat:\n${recentChat.map((m) => `${m.role === 'user' ? 'U' : 'A'}: ${m.text}`).join('\n')}`
          : null,
        prefillContext.length
          ? `\nexternal_prefill_context: ${JSON.stringify(prefillContext)}`
          : null,
        `\neditor_selection: ${JSON.stringify({
          start: Number(selection.start) || 0,
          end: Number(selection.end) || 0,
          text: selection.text || '',
        })}`,
        question ? `\nquestion:\n${question}` : null,
      ].filter(Boolean).join('\n'),
      12000
    );
  }, [
    doc.currentStep,
    doc.fileName,
    doc.lintIssues,
    doc.markdownContent,
    doc.reportSettings,
    doc.editorSelection,
    doc.selectedLayoutProfile,
    doc.selectedPrintProfile,
    doc.selectedTemplate,
    theme,
  ]);

  const addAssistantText = useCallback(async (instance, text) => {
    await instance.messaging.addMessage({
      output: {
        generic: [
          {
            response_type: MessageResponseTypes.TEXT,
            text,
          },
        ],
      },
    });
  }, []);

  const applyLintAutofix = useCallback(async () => {
    const instance = instanceRef.current;
    if (!instance) return;

    const current = String(doc.markdownContent || '');
    const lintIssues = Array.isArray(doc.lintIssues) ? doc.lintIssues : [];
    if (!current.trim()) {
      await addAssistantText(instance, 'Düzeltmek için önce bir markdown içeriği olmalı.');
      return;
    }
    if (!lintIssues.length) {
      await addAssistantText(instance, 'Şu an için lint uyarısı yok.');
      return;
    }

    const { nextMarkdown, applied, skipped } = applyLintFixes(current, lintIssues);
    if (nextMarkdown === current) {
      await addAssistantText(
        instance,
        'Bu uyarılar için otomatik ve güvenli bir düzeltme bulamadım. İsterseniz tek tek hangi uyarıya odaklanacağımızı yazın.'
      );
      return;
    }

    doc.setMarkdown(nextMarkdown);

    const appliedText = applied.length
      ? applied
          .slice(0, 8)
          .map((x) => `- ${x.ruleId} (satır ${x.line})`)
          .join('\n')
      : '- (uygulanamadı)';
    const skippedText = skipped.length
      ? `\n\nAtlananlar: ${skipped.length} (riskli veya bağlam gerektiren).`
      : '';

    await addAssistantText(
      instance,
      `Lint düzeltmeleri uygulandı.\n\nUygulananlar:\n${appliedText}${skippedText}`
    );
    publishSuggestionPack();
  }, [addAssistantText, doc, publishSuggestionPack]);

  const applyAiRevision = useCallback(async ({ instruction }) => {
    const instance = instanceRef.current;
    if (!instance) return;

    const markdown = String(doc.markdownContent || '');
    if (!markdown.trim()) {
      await addAssistantText(instance, 'Revizyon için önce markdown içeriği olmalı.');
      return;
    }

    if (!isAuthenticated) {
      await addAssistantText(instance, 'AI revizyonu için giriş yapmanız gerekiyor.');
      onRequestLogin?.();
      return;
    }

    const prompt = [
      'Aşağıdaki markdown metnini verilen revizyon talebine göre güncelle.',
      'IBM Carbon ilkelerine uygun, açık ve tutarlı bir çıktı üret.',
      'Yanıtı SADECE markdown code block içinde ver.',
      '',
      doc.editorSelection?.text
        ? `Sadece şu seçili parçayı güncelle (geri kalan metni koru):\n"""\n${doc.editorSelection.text}\n"""`
        : 'Seçili parça yoksa tüm metin üzerinde revizyon uygula.',
      '',
      `Revizyon talebi: ${instruction}`,
    ].join('\n');

    try {
      const answer = await askAi({
        question: prompt,
        context: buildContext(instruction),
      });
      const revised = tryExtractMarkdownFromResponse(answer);
      if (!revised) {
        await addAssistantText(
          instance,
          'AI cevabından uygulanabilir markdown çıkaramadım. Lütfen talebi daha net yazın.'
        );
        return;
      }

      const selectedText = String(doc.editorSelection?.text || '');
      const hasSelection = selectedText.trim().length > 0;
      if (hasSelection && revised.trim() && revised.trim() !== String(doc.markdownContent || '').trim()) {
        const current = String(doc.markdownContent || '');
        const start = Number(doc.editorSelection?.start) || 0;
        const end = Number(doc.editorSelection?.end) || 0;
        if (end > start && start >= 0 && end <= current.length) {
          const nextMarkdown = `${current.slice(0, start)}${revised}${current.slice(end)}`;
          doc.setMarkdown(nextMarkdown);
        } else if (current.includes(selectedText)) {
          doc.setMarkdown(current.replace(selectedText, revised));
        } else {
          doc.setMarkdown(revised);
        }
      } else {
        doc.setMarkdown(revised);
      }
      await addAssistantText(instance, 'AI revizyonu uygulandı ve editöre işlendi.');
      publishSuggestionPack();
    } catch (error) {
      await instance.messaging.addMessage({
        output: {
          generic: [toInlineErrorItem(error, getAiUserFacingErrorText(error))],
        },
      });
    }
  }, [addAssistantText, buildContext, doc, isAuthenticated, onRequestLogin, publishSuggestionPack]);

  const runAnalyze = useCallback(async () => {
    const instance = instanceRef.current;
    if (!instance) return;

    if (!isAuthenticated) {
      await addAssistantText(
        instance,
        'AI analiz özelliği için giriş yapmanız gerekiyor.'
      );
      onRequestLogin?.();
      return;
    }

    const markdown = String(doc.markdownContent || '');
    if (!markdown.trim()) {
      await addAssistantText(instance, 'Analiz için önce markdown içeriği oluşmalı.');
      return;
    }

    instance.updateIsMessageLoadingCounter('increase', 'Analiz ediliyor...');
    try {
      const output = await analyzeAi({
        markdown,
        metadata: {
          fileName: doc.fileName || null,
          fileType: doc.fileType || null,
          workflowStep: doc.currentStep || null,
          template: doc.selectedTemplate || null,
          theme,
          layoutProfile: doc.selectedLayoutProfile || null,
          printProfile: doc.selectedPrintProfile || null,
          reportSettings: doc.reportSettings || null,
        },
      });
      await addAssistantText(instance, formatAnalyzeOutput(output));
    } catch (error) {
      await instance.messaging.addMessage({
        output: {
          generic: [toInlineErrorItem(error, getAiUserFacingErrorText(error))],
        },
      });

      if (Number(error?.status) === 401) {
        onRequestLogin?.();
      }
    } finally {
      instance.updateIsMessageLoadingCounter('decrease');
    }
  }, [
    addAssistantText,
    doc.currentStep,
    doc.fileName,
    doc.fileType,
    doc.markdownContent,
    doc.reportSettings,
    doc.selectedLayoutProfile,
    doc.selectedPrintProfile,
    doc.selectedTemplate,
    isAuthenticated,
    onRequestLogin,
    theme,
  ]);

  const handleAiApplyCommand = useCallback(async (detail = {}) => {
    const instance = instanceRef.current;
    const kind = String(detail?.kind || '').trim();
    const requestId = detail?.requestId;

    if (!kind) {
      return {
        ok: false,
        requestId,
        message: 'AI komut türü bulunamadı.',
      };
    }

    if (kind === 'selection-context') {
      const selectionText = String(detail?.selectionText || doc.editorSelection?.text || '').trim();
      if (!selectionText) {
        return {
          ok: false,
          requestId,
          message: 'Seçili metin bulunamadı.',
        };
      }

      pushPrefillContext(selectionText, 'Seçili Metin');
      if (instance) {
        await addAssistantText(instance, 'Seçili metin AI bağlamına eklendi.');
      }
      publishSuggestionPack();
      return {
        ok: true,
        requestId,
        message: 'Seçili metin AI bağlamına eklendi.',
      };
    }

    if (kind === 'design-rewrite') {
      const markdown = String(doc.markdownContent || '');
      if (!markdown.trim()) {
        return {
          ok: false,
          requestId,
          message: 'Revize edilecek markdown içeriği bulunamadı.',
        };
      }

      if (!isAuthenticated) {
        if (instance) {
          await addAssistantText(instance, 'Tasarım revizyonu için giriş yapmanız gerekiyor.');
        }
        markAuthRequired(requestId, kind, 'Tasarım revizyonu için giriş yapın.');
        onRequestLogin?.();
        return {
          ok: false,
          requestId,
          message: 'Tasarım revizyonu için giriş yapın.',
        };
      }

      const wizardSettings = detail?.wizardSettings || doc.reportSettings || {};
      const layoutProfile = detail?.layoutProfile || doc.selectedLayoutProfile || null;
      const printProfile = detail?.printProfile || doc.selectedPrintProfile || null;

      const answer = await askAi({
        question: [
          'Aşağıdaki markdown metnini IBM Carbon tasarım ilkelerine göre baştan sona revize et.',
          'Başlık hiyerarşisini güçlendir, okunabilirlik ve içerik akışını iyileştir, gerekli yerde bileşen önerisi göm.',
          'Anlamı koru ve gereksiz tekrarları temizle.',
          'Çıktı SADECE tek bir markdown code block olsun.',
          `Rapor ayarları: ${JSON.stringify(wizardSettings)}`,
          `Yerleşim profili: ${layoutProfile || '(belirtilmedi)'}`,
          `Baskı profili: ${printProfile || '(belirtilmedi)'}`,
        ].join('\n'),
        context: buildContext('design rewrite'),
      });

      const revisedMarkdown = tryExtractMarkdownFromResponse(answer);
      if (!revisedMarkdown) {
        return {
          ok: false,
          requestId,
          message: 'AI cevabından uygulanabilir markdown çıkarılamadı.',
        };
      }

      doc.setMarkdown(revisedMarkdown);
      if (instance) {
        await addAssistantText(instance, 'Tüm markdown Carbon tasarım kurallarına göre revize edilip editöre uygulandı.');
      }
      pushHistory('user', '[design-rewrite] Carbon tasarım revizyonu');
      pushHistory('assistant', revisedMarkdown);
      publishSuggestionPack();

      return {
        ok: true,
        requestId,
        message: 'Tasarım revizyonu tamamlandı.',
      };
    }

    if (kind === 'quick-action') {
      if (!isAuthenticated) {
        if (instance) {
          await addAssistantText(instance, 'Hızlı AI aksiyonları için giriş yapmanız gerekiyor.');
        }
        markAuthRequired(requestId, kind, 'AI aksiyonu için giriş yapın.');
        onRequestLogin?.();
        return {
          ok: false,
          requestId,
          message: 'AI aksiyonu için giriş yapın.',
        };
      }

      const prompt = String(detail?.prompt || '').trim();
      if (!prompt) {
        return {
          ok: false,
          requestId,
          message: 'Hızlı erişim komutu boş.',
        };
      }

      const expectMarkdown = detail?.expectMarkdown === true;
      const applyTarget = detail?.applyTarget === 'selection' ? 'selection' : 'document';

      if (expectMarkdown) {
        const markdown = String(doc.markdownContent || '');
        if (!markdown.trim()) {
          return {
            ok: false,
            requestId,
            message: 'Markdown içeriği olmadan uygulama yapılamaz.',
          };
        }

        const answer = await askAi({
          question: [
            'Aşağıdaki görevi mevcut markdown dokümanı üzerinde uygula.',
            applyTarget === 'selection'
              ? 'Sadece seçili metin aralığını güncelle; diğer tüm kısımlar aynı kalsın.'
              : 'Tüm dokümanı tutarlı şekilde güncelle.',
            'Çıktı SADECE güncellenmiş markdown code block olsun.',
            `Görev: ${prompt}`,
          ].join('\n'),
          context: buildContext(prompt),
        });

        const revisedMarkdown = tryExtractMarkdownFromResponse(answer);
        if (!revisedMarkdown) {
          return {
            ok: false,
            requestId,
            message: 'AI yanıtından markdown çıkarılamadı.',
          };
        }

        if (applyTarget === 'selection') {
          const start = Number(doc.editorSelection?.start);
          const end = Number(doc.editorSelection?.end);
          if (!(Number.isFinite(start) && Number.isFinite(end) && end > start)) {
            return {
              ok: false,
              requestId,
              message: 'Seçili metne uygulamak için editörde bir aralık seçin.',
            };
          }
          const nextMarkdown = `${markdown.slice(0, start)}${revisedMarkdown}${markdown.slice(end)}`;
          doc.setMarkdown(nextMarkdown);
        } else {
          doc.setMarkdown(revisedMarkdown);
        }

        if (instance) {
          await addAssistantText(instance, 'AI önerisi markdown içeriğine uygulandı.');
        }
        pushHistory('user', `[quick-action/apply] ${prompt}`);
        pushHistory('assistant', revisedMarkdown);
        publishSuggestionPack();
        return {
          ok: true,
          requestId,
          message: 'AI önerisi markdown içeriğine uygulandı.',
        };
      }

      const answer = await askAi({
        question: prompt,
        context: buildContext(prompt),
      });
      const answerText = String(answer || '').trim() || '(boş yanıt)';
      if (instance) {
        await addAssistantText(instance, answerText);
      }
      pushHistory('user', `[quick-action] ${prompt}`);
      pushHistory('assistant', answerText);
      publishSuggestionPack();
      return {
        ok: true,
        requestId,
        message: 'Hızlı erişim AI çıktısı üretildi.',
      };
    }

    if (kind === 'insert-directive') {
      const templateLabel = String(detail?.templateLabel || detail?.templateId || 'Directive').trim();
      const fallbackSnippet = String(detail?.templateSnippet || '').trim();

      if (!fallbackSnippet) {
        return {
          ok: false,
          requestId,
          message: 'Directive şablonu bulunamadı.',
        };
      }

      if (!isAuthenticated) {
        if (instance) {
          await addAssistantText(instance, 'AI ile blok eklemek için giriş yapmanız gerekiyor.');
        }
        markAuthRequired(requestId, kind, 'AI blok ekleme için giriş yapın.');
        onRequestLogin?.();
        return {
          ok: false,
          requestId,
          message: 'AI blok ekleme için giriş yapın.',
        };
      }

      let resolvedSnippet = fallbackSnippet;
      try {
        const answer = await askAi({
          question: [
            `"${templateLabel}" için markdown bloğu üret.`,
            'Sadece eklenecek blok içeriğini ver; açıklama yazma.',
            'Yanıtı markdown code block olarak döndür.',
            `Referans şablon:\n${fallbackSnippet}`,
          ].join('\n\n'),
          context: buildContext(`Directive insertion: ${templateLabel}`),
        });

        const candidate = tryExtractMarkdownFromResponse(answer) || String(answer || '').trim();
        if (candidate) {
          resolvedSnippet = candidate;
        }
      } catch (error) {
        if (instance) {
          await instance.messaging.addMessage({
            output: {
              generic: [toInlineErrorItem(error, `${templateLabel} için AI üretimi başarısız oldu, varsayılan şablon eklenecek.`)],
            },
          });
        }
      }

      const currentMarkdown = String(doc.markdownContent || '');
      const selectionStart = Number(doc.editorSelection?.start);
      const selectionEnd = Number(doc.editorSelection?.end);
      const safeStart = Number.isFinite(selectionStart) ? selectionStart : currentMarkdown.length;
      const safeEnd = Number.isFinite(selectionEnd) ? selectionEnd : safeStart;

      const nextMarkdown = insertSnippetAtSelection({
        markdown: currentMarkdown,
        snippet: resolvedSnippet,
        start: safeStart,
        end: safeEnd,
      });

      doc.setMarkdown(nextMarkdown);
      if (instance) {
        await addAssistantText(instance, `${templateLabel} bloğu editöre eklendi.`);
      }
      return {
        ok: true,
        requestId,
        message: `${templateLabel} bloğu AI komutuyla eklendi.`,
      };
    }

    if (kind === 'wizard-transform') {
      const markdown = String(doc.markdownContent || '');
      if (!markdown.trim()) {
        return {
          ok: false,
          requestId,
          message: 'Dönüştürülecek markdown bulunamadı.',
        };
      }

      if (!isAuthenticated) {
        if (instance) {
          await addAssistantText(instance, 'Sihirbaz dönüşümü için giriş yapmanız gerekiyor.');
        }
        markAuthRequired(requestId, kind, 'Sihirbaz dönüşümü için giriş yapın.');
        onRequestLogin?.();
        return {
          ok: false,
          requestId,
          message: 'Sihirbaz dönüşümü için giriş yapın.',
        };
      }

      const wizardSettings = detail?.wizardSettings || doc.reportSettings || {};
      const layoutProfile = detail?.layoutProfile || doc.selectedLayoutProfile || null;
      const printProfile = detail?.printProfile || doc.selectedPrintProfile || null;

      const answer = await askAi({
        question: [
          'Aşağıdaki markdown metnini rapor ayarlarına göre yeniden düzenle.',
          'Çıktı SADECE markdown code block olsun.',
          'Anlamı koru, bölüm yapısını iyileştir, okunabilirliği artır.',
          `Rapor ayarları: ${JSON.stringify(wizardSettings)}`,
          `Yerleşim profili: ${layoutProfile || '(belirtilmedi)'}`,
          `Baskı profili: ${printProfile || '(belirtilmedi)'}`,
        ].join('\n'),
        context: buildContext('wizard transform'),
      });

      const revisedMarkdown = tryExtractMarkdownFromResponse(answer);
      if (!revisedMarkdown) {
        return {
          ok: false,
          requestId,
          message: 'AI cevabından uygulanabilir markdown çıkarılamadı.',
        };
      }

      doc.setMarkdown(revisedMarkdown);
      if (instance) {
        await addAssistantText(instance, 'Sihirbaz tercihleri markdown içeriğine uygulandı.');
      }
      publishSuggestionPack();
      return {
        ok: true,
        requestId,
        message: 'Sihirbaz dönüşümü tamamlandı.',
      };
    }

    return {
      ok: false,
      requestId,
      message: `Desteklenmeyen AI komutu: ${kind}`,
    };
  }, [
    addAssistantText,
    buildContext,
    doc,
    isAuthenticated,
    markAuthRequired,
    onRequestLogin,
    publishSuggestionPack,
    pushHistory,
    pushPrefillContext,
  ]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onPrefill = (event) => {
      const detail = event?.detail || {};
      const selectionText = String(detail?.selectionText || detail?.text || '').trim();
      const prompt = String(detail?.prompt || '').trim();

      if (selectionText) {
        pushPrefillContext(selectionText, 'Prefill Selection');
      }
      if (prompt) {
        pushPrefillContext(prompt, 'Prefill Prompt');
      }
    };

    window.addEventListener(AI_CHAT_PREFILL_EVENT, onPrefill);
    return () => {
      window.removeEventListener(AI_CHAT_PREFILL_EVENT, onPrefill);
    };
  }, [pushPrefillContext]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const onApplyCommand = (event) => {
      const detail = event?.detail || {};
      const requestId = detail?.requestId;

      void (async () => {
        try {
          const result = await handleAiApplyCommand(detail);
          emitAiCommandResult({
            requestId,
            kind: detail?.kind,
            ok: result?.ok !== false,
            message: result?.message || (result?.ok === false ? 'AI komutu tamamlanamadı.' : 'AI komutu tamamlandı.'),
          });
        } catch (error) {
          const instance = instanceRef.current;
          if (instance) {
            await instance.messaging.addMessage({
              output: {
                generic: [toInlineErrorItem(error, getAiUserFacingErrorText(error))],
              },
            });
          }

          emitAiCommandResult({
            requestId,
            kind: detail?.kind,
            ok: false,
            message: getAiUserFacingErrorText(error),
          });
        }
      })();
    };

    window.addEventListener(AI_APPLY_COMMAND_EVENT, onApplyCommand);
    return () => {
      window.removeEventListener(AI_APPLY_COMMAND_EVENT, onApplyCommand);
    };
  }, [emitAiCommandResult, handleAiApplyCommand]);

  const customSendMessage = useCallback(async (request, requestOptions, instance) => {
    const signal = requestOptions?.signal;

    if (request?.history?.is_welcome_request) {
      const welcome = isAuthenticated
        ? 'Merhaba. Metin, yerleşim ve Carbon tasarım kararlarında yardımcı olabilirim. Ne yapmak istersiniz?'
        : 'Merhaba. AI Danışmanını kullanmak için giriş yapmanız gerekiyor.';

      await addAssistantText(instance, welcome);
      if (isAuthenticated) {
        publishSuggestionPack();
      } else {
        emitAiSuggestions([]);
      }
      if (!isAuthenticated) {
        onRequestLogin?.();
      }
      return;
    }

    if (request?.input?.message_type === MessageInputType.EVENT) {
      const eventName = request?.input?.event?.name;
      if (eventName === 'CARBONAC_ANALYZE') {
        await runAnalyze();
        return;
      }
    }

    const question = String(request?.input?.text || '').trim();
    if (!question) {
      await addAssistantText(instance, 'Bir soru yazıp gönderebilirsiniz.');
      return;
    }

    const normalizedExact = question.trim().toLowerCase();
    const normalizedQ = normalizedExact;
    const wantsAutofix =
      normalizedExact === 'bu uyarıları düzelt' ||
      normalizedExact === 'lint düzelt' ||
      normalizedExact === 'lint uyarılarını düzelt' ||
      normalizedExact === 'uyarıları düzelt';
    if (wantsAutofix) {
      await applyLintAutofix();
      return;
    }

    const wantsRevision =
      normalizedQ.includes('revize et') ||
      normalizedQ.includes('yeniden yaz') ||
      normalizedQ.includes('metni düzenle') ||
      normalizedQ.includes('bu metni düzelt') ||
      normalizedQ.includes('seçili metni') ||
      normalizedQ.includes('selected text') ||
      normalizedQ.startsWith('/revize');
    if (wantsRevision) {
      await applyAiRevision({ instruction: question });
      return;
    }

    // Quick lint helper: if user asks about lint, respond with a human-friendly summary.
    const looksLikeLintQuestion =
      normalizedQ.includes('lint') ||
      normalizedQ.includes('uyarı') ||
      normalizedQ.includes('hata') ||
      normalizedQ.includes('düzelt');
    if (looksLikeLintQuestion) {
      const lintText = formatLintForHumans(doc.lintIssues);
      if (lintText) {
        await addAssistantText(
          instance,
          `${lintText}\n\nİsterseniz “Bu uyarıları düzelt” yazın; hangi bölümleri düzeltmemi istediğinizi soracağım.`
        );
        // Fall through to AI ask as well, so user also gets a richer answer.
      }
    }

    if (!isAuthenticated) {
      await addAssistantText(instance, 'AI Danışmanını kullanmak için giriş yapmanız gerekiyor.');
      onRequestLogin?.();
      return;
    }

    const context = buildContext(question);

    try {
      const answer = await askAi({ question, context, signal });
      pushHistory('user', question);
      pushHistory('assistant', String(answer || ''));
      await addAssistantText(instance, String(answer || '').trim() || '(bos yanit)');
      publishSuggestionPack();
    } catch (error) {
      // If the request was aborted by the widget, keep the UI clean.
      if (error?.name === 'AbortError') {
        await instance.messaging.addMessage({
          output: {
            generic: [toInlineErrorItem(error, 'İstek zaman aşımına uğradı veya iptal edildi.')],
          },
        });
        return;
      }

      if (Number(error?.status) === 401) {
        onRequestLogin?.();
      }

      await instance.messaging.addMessage({
        output: {
          generic: [toInlineErrorItem(error, getAiUserFacingErrorText(error))],
        },
      });
      return;
    }
  }, [
    addAssistantText,
    applyLintAutofix,
    applyAiRevision,
    buildContext,
    isAuthenticated,
    onRequestLogin,
    emitAiSuggestions,
    publishSuggestionPack,
    pushHistory,
    runAnalyze,
  ]);

  const handleBeforeRender = useCallback((instance) => {
    instanceRef.current = instance;
    onInstanceReady?.(instance);
  }, [onInstanceReady]);

  const menuOptions = useMemo(() => {
    const options = [];

    if (isAuthenticated) {
      options.push({
        text: 'Dokümanı analiz et',
        handler: () => {
          void runAnalyze();
        },
      });
    }

    options.push({
      text: 'Sohbeti sıfırla',
      handler: () => {
        const instance = instanceRef.current;
        if (!instance) return;
        void instance.messaging.restartConversation();
      },
    });

    if (!isAuthenticated && onRequestLogin) {
      options.push({
        text: 'Giriş yap',
        handler: () => onRequestLogin(),
      });
    }

    return options;
  }, [isAuthenticated, onRequestLogin, runAnalyze]);

  const disclaimerHTML = useMemo(() => (
    `
      <p><strong>Not:</strong> Bu özellik deneysel bir AI entegrasyonudur.</p>
      <ul>
        <li>Hassas veri / kişi bilgisi girmeyin.</li>
        <li>Yanıtları uygulamadan önce doğrulayın.</li>
        <li>Önerileri Carbon token'ları ve rapor hedefleriyle uyumlu olacak şekilde değerlendirin.</li>
      </ul>
    `
  ), []);

  if (!enabled) return null;

  const commonProps = {
    namespace: 'carbonac',
    aiEnabled: true,
    assistantName: 'Carbonac AI',
    debug: false,
    shouldSanitizeHTML: true,
    disclaimer: {
      isOn: true,
      disclaimerHTML,
    },
    openChatByDefault: Boolean(embedded),
    launcher: {
      isOn: false,
    },
    header: {
      title: 'AI Danışmanı',
      minimizeButtonIconType: MinimizeButtonIconType.CLOSE,
      hideMinimizeButton: Boolean(embedded),
      showRestartButton: true,
      showAiLabel: true,
      menuOptions,
    },
    homescreen: {
      isOn: true,
      greeting: isAuthenticated
        ? 'Merhaba. Bir hedef söyleyin; birlikte düzenleyelim.'
        : 'AI Danışmanını kullanmak için giriş yapın.',
      starters: isAuthenticated
        ? {
            isOn: true,
            buttons: [
              { label: 'Bu metni daha okunabilir yap ve bölümlere ayır.' },
              { label: 'Tipografi ve boşluklar için öneri ver.' },
              { label: 'Yazım/düzen uyarılarını açıkla ve düzeltme öner.' },
              { label: 'Şablon ve yerleşim seçimim için öneride bulun.' },
            ],
          }
        : { isOn: false, buttons: [] },
    },
    input: {
      isDisabled: !isAuthenticated,
      maxInputCharacters: 8000,
    },
    messaging: {
      skipWelcome: false,
      messageTimeoutSecs: 90,
      customSendMessage,
    },
    onBeforeRender: handleBeforeRender,
  };

  return (
    embedded ? (
      <ChatCustomElement
        className={embeddedClassName}
        {...commonProps}
      />
    ) : (
      <ChatContainer
        {...commonProps}
      />
    )
  );
}
