/**
 * Carbonac AI Chat
 * Carbon AI Chat widget wired to Carbonac backend (/api/ai/ask, /api/ai/analyze).
 */

import React, { useCallback, useMemo, useRef } from 'react';
import {
  ChatContainer,
  MessageInputType,
  MessageResponseTypes,
  MinimizeButtonIconType,
} from '@carbon/ai-chat';

import { useDocument, useTheme } from '../../contexts';
import { askAi, analyzeAi } from '../../services/aiService';

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

export default function CarbonacAiChat({
  enabled = true,
  isAuthenticated = false,
  onRequestLogin,
  onInstanceReady,
}) {
  const { theme } = useTheme();
  const doc = useDocument();

  const instanceRef = useRef(null);
  const historyRef = useRef([]);

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

  const customSendMessage = useCallback(async (request, requestOptions, instance) => {
    const signal = requestOptions?.signal;

    if (request?.history?.is_welcome_request) {
      const welcome = isAuthenticated
        ? 'Merhaba. Metin, yerleşim ve Carbon tasarım kararlarında yardımcı olabilirim. Ne yapmak istersiniz?'
        : 'Merhaba. AI Danışmanını kullanmak için giriş yapmanız gerekiyor.';

      await addAssistantText(instance, welcome);
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

    // Quick lint helper: if user asks about lint, respond with a human-friendly summary.
    const normalizedQ = question.toLowerCase();
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
      historyRef.current.push({ role: 'user', text: question });
      historyRef.current.push({ role: 'assistant', text: String(answer || '') });
      if (historyRef.current.length > 40) {
        historyRef.current = historyRef.current.slice(-40);
      }
      await addAssistantText(instance, String(answer || '').trim() || '(bos yanit)');
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
    buildContext,
    isAuthenticated,
    onRequestLogin,
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

  return (
    <ChatContainer
      namespace="carbonac"
      aiEnabled
      assistantName="Carbonac AI"
      debug={false}
      shouldSanitizeHTML
      disclaimer={{
        isOn: true,
        disclaimerHTML,
      }}
      openChatByDefault={false}
      launcher={{
        isOn: false,
      }}
      header={{
        title: 'AI Danışmanı',
        minimizeButtonIconType: MinimizeButtonIconType.CLOSE,
        showRestartButton: true,
        showAiLabel: true,
        menuOptions,
      }}
      homescreen={{
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
      }}
      input={{
        isDisabled: !isAuthenticated,
        maxInputCharacters: 8000,
      }}
      messaging={{
        skipWelcome: false,
        messageTimeoutSecs: 90,
        customSendMessage,
      }}
      onBeforeRender={handleBeforeRender}
    />
  );
}
