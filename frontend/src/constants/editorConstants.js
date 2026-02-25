import {
  Upload,
  Edit,
  MagicWand,
  ColorPalette,
  TextFont,
  ChartBar,
  Grid as GridIcon,
  Template,
  CodeReference,
  Ai,
} from '@carbon/icons-react';
import { WORKFLOW_STEPS } from '../contexts';

export const AI_APPLY_COMMAND_EVENT = 'CARBONAC_AI_APPLY_COMMAND';
export const AI_CHAT_PREFILL_EVENT = 'CARBONAC_AI_PREFILL';
export const AI_COMMAND_RESULT_EVENT = 'CARBONAC_AI_COMMAND_RESULT';
export const AI_CHAT_SUGGESTIONS_EVENT = 'CARBONAC_AI_SUGGESTIONS';

function getLayoutProfileHint(profileId) {
  switch (profileId) {
    case 'symmetric':
      return 'Dengeli kolon yapısı. Kurumsal rapor, teknik doküman ve okunaklı uzun metinler için önerilir.';
    case 'asymmetric':
      return 'Vurgu odaklı asimetrik yerleşim. Yönetici özeti, hikâye anlatımı ve görsel ağırlıklı sayfalar için ideal.';
    case 'dashboard':
      return 'Veri yoğun, modüler yerleşim. KPI, tablo ve çoklu grafik içeren raporlarda hızlı tarama sağlar.';
    default:
      return 'Yerleşim profili açıklaması bulunamadı.';
  }
}

function getPrintProfileHint(profileId) {
  switch (profileId) {
    case 'pagedjs-a3':
      return 'A3 (297×420mm) — Poster, büyük tablo ve yoğun görsel kompozisyonlar için geniş alan sunar.';
    case 'pagedjs-a4':
      return 'A4 (210×297mm) — Standart rapor formatı. Ekran ve baskı arasında en dengeli varsayılan profildir.';
    case 'pagedjs-a5':
      return 'A5 (148×210mm) — Cep kılavuzu, özet broşür ve kısa dökümanlar için kompakt baskı profili.';
    default:
      return 'Baskı profili açıklaması bulunamadı.';
  }
}

export const layoutProfileOptions = [
  {
    id: 'symmetric',
    label: 'Simetrik (Dengeli)',
    shortLabel: 'Simetrik',
    description: 'Dengeli kolon yapısı, kurumsal metinler için güvenli varsayılan.',
    hint: getLayoutProfileHint('symmetric'),
  },
  {
    id: 'asymmetric',
    label: 'Asimetrik (Vurgu)',
    shortLabel: 'Asimetrik',
    description: 'Başlık ve vurgu kutularını öne çıkaran dinamik düzen.',
    hint: getLayoutProfileHint('asymmetric'),
  },
  {
    id: 'dashboard',
    label: 'Dashboard (Veri Yoğun)',
    shortLabel: 'Dashboard',
    description: 'Grafik, tablo ve KPI blokları için sıkı grid düzeni.',
    hint: getLayoutProfileHint('dashboard'),
  },
];

export const printProfileOptions = [
  {
    id: 'pagedjs-a3',
    label: 'Paged.js A3 (297×420mm)',
    shortLabel: 'A3',
    description: 'Geniş alan, tablo ve grafik yoğun içeriklerde ideal.',
    hint: getPrintProfileHint('pagedjs-a3'),
  },
  {
    id: 'pagedjs-a4',
    label: 'Paged.js A4 (210×297mm)',
    shortLabel: 'A4',
    description: 'Standart rapor çıktıları için dengeli ve yaygın profil.',
    hint: getPrintProfileHint('pagedjs-a4'),
  },
  {
    id: 'pagedjs-a5',
    label: 'Paged.js A5 (148×210mm)',
    shortLabel: 'A5',
    description: 'Kompakt çıktı, özet doküman ve broşürler için optimize.',
    hint: getPrintProfileHint('pagedjs-a5'),
  },
];

export const QUICK_ACCESS_ACTIONS = [
  {
    id: 'design-rewrite',
    label: 'Tasarım Revizyonu',
    icon: MagicWand,
    prompt: 'Markdown içeriğini Carbon tasarım ilkelerine göre baştan sona revize et. Başlık hiyerarşisi, okunabilirlik ve bileşen dağılımını iyileştir.',
  },
  {
    id: 'feature-pack',
    label: 'Bileşen Paketi',
    icon: Template,
    prompt: 'Bu doküman için wizard aşamasında önerilecek en uygun bileşenleri (tablo, grafik, callout, timeline) kısa gerekçelerle listele.',
  },
  {
    id: 'palette-advice',
    label: 'Renk Sistemi',
    icon: ColorPalette,
    prompt: 'Seçili içeriğe uygun IBM Carbon renk paleti öner ve kısa gerekçe yaz.',
  },
  {
    id: 'typography-advice',
    label: 'Tipografi',
    icon: TextFont,
    prompt: 'Mevcut metin için başlık hiyerarşisi ve tipografi iyileştirmesi öner.',
  },
  {
    id: 'chart-advice',
    label: 'Grafik Önerisi',
    icon: ChartBar,
    prompt: 'Bu içerik için en uygun grafik türünü ve örnek chart directive üret.',
  },
  {
    id: 'grid-advice',
    label: 'Grid Düzeni',
    icon: GridIcon,
    prompt: 'Rapor için grid düzeni, kolonsal hiyerarşi ve boşluk önerisi ver.',
  },
  {
    id: 'components-advice',
    label: 'Bileşen Rehberi',
    icon: Template,
    prompt: 'İçeriğe uygun Carbon bileşenlerini ve directive örneklerini listele.',
  },
];

export const EDITOR_PREVIEW_MODES = [
  { id: 'markdown', label: 'Kod', icon: CodeReference },
  { id: 'rich', label: 'Zengin Önizleme', icon: Ai },
];

export const WORKFLOW_STEP_CONFIG = {
  [WORKFLOW_STEPS.UPLOAD]: {
    label: 'Doküman Yükle',
    icon: Upload,
    description: 'PDF, Word veya metin dosyası yükleyin',
  },
  [WORKFLOW_STEPS.PROCESSING]: {
    label: 'İşleniyor',
    icon: MagicWand,
    description: 'Markdown\'a dönüştürülüyor ve önizleme hazırlanıyor',
  },
  [WORKFLOW_STEPS.WIZARD]: {
    label: 'Stil Sihirbazı',
    icon: ColorPalette,
    description: 'Rapor tasarımını belirleyin ve özet onayı verin',
  },
  [WORKFLOW_STEPS.EDITOR]: {
    label: 'Düzenle',
    icon: Edit,
    description: 'Markdown + AI Canvas ile düzenleme ve PDF üretimi',
  },
};

export function markdownToRichPreviewHtml(markdown) {
  if (!markdown) return '';
  return String(markdown)
    .replace(/^# (.+)$/gm, '<h1 class="preview-h1">$1</h1>')
    .replace(/^## (.+)$/gm, '<h2 class="preview-h2">$1</h2>')
    .replace(/^### (.+)$/gm, '<h3 class="preview-h3">$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="preview-code">$1</code>')
    .replace(/^- (.+)$/gm, '<li class="preview-li">$1</li>')
    .replace(/\n/g, '<br/>');
}
