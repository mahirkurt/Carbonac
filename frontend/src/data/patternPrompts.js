/**
 * Pattern-to-prompt mapping for AI Canvas sidebar.
 * Each entry maps a pattern ID (from patternCardsSlim.js) to
 * an actionable AI prompt that generates/inserts that pattern.
 */
const PATTERN_PROMPTS = {
  'cover-page-hero': {
    label: 'Kapak sayfası oluştur',
    prompt: 'Mevcut markdown için Carbon uyumlu bir kapak sayfası oluştur. Başlık, alt başlık, tarih ve yazar bilgisi içersin. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Document',
  },
  'executive-summary': {
    label: 'Yönetici özeti ekle',
    prompt: 'İçerikten anahtar metrikleri ve 3-5 maddelik bulguları çıkararak yönetici özeti bölümü oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Report',
  },
  'chapter-opener': {
    label: 'Bölüm açılışları ekle',
    prompt: 'Mevcut başlıkları kullanarak her ana bölüme Carbon uyumlu bölüm açılış sayfası ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Book',
  },
  'key-findings-list': {
    label: 'Temel bulgular listesi',
    prompt: 'İçerikten öne çıkan bulguları numaralı liste halinde çıkar. Her maddeye önem derecesi ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ListBulleted',
  },
  'hero-stat-with-quote': {
    label: 'Öne çıkan istatistik ekle',
    prompt: 'İçerikteki en etkileyici sayısal veriyi büyük istatistik + uzman alıntısı formatında :::quote directive ile oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Quotes',
  },
  'data-table-spread': {
    label: 'Veri tablosu ekle',
    prompt: 'İçerikteki karşılaştırmalı verileri :::data-table directive formatında tam genişlik tablo olarak düzenle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'DataTable',
  },
  'chart-composition': {
    label: 'Grafik düzeni oluştur',
    prompt: 'İçerikteki sayısal verileri :::chart directive ile uygun grafik türünde (bar, line, donut) görselleştir. Yanına açıklama metni ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ChartBar',
  },
  'action-box': {
    label: 'Aksiyon kutusu ekle',
    prompt: 'İçerikten çıkarılabilecek somut öneriler ve sonraki adımlar için :::callout directive ile aksiyon bloğu oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'CheckmarkOutline',
  },
  'case-study-module': {
    label: 'Vaka çalışması ekle',
    prompt: 'İçerikten bir sorun/çözüm/sonuç yapısında vaka anlatısı bloğu oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Analytics',
  },
  'kpi-grid': {
    label: 'KPI grid oluştur',
    prompt: 'Markdown içeriğindeki sayısal verileri kullanarak 3-6 KPI göstergesi içeren grid bloğu oluştur. Her KPI için büyük sayı ve kısa açıklama olsun. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Grid',
  },
  'figure-with-caption': {
    label: 'Şekil ve altyazı ekle',
    prompt: 'İçeriğe uygun bir :::figure directive ile numaralı şekil, açıklayıcı altyazı ve kaynak bilgisi ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Image',
  },
  'appendix-page': {
    label: 'Ek bölüm oluştur',
    prompt: 'Rapor sonuna metodoloji notları, veri kaynakları ve referanslar içeren bir ek (appendix) bölümü ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'DocumentAttachment',
  },
  'survey-chart-page': {
    label: 'Anket sonuçları sayfası',
    prompt: 'İçerikteki anket/araştırma verilerini bar ve donut chart directive formatında görselleştir. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ChartBar',
  },
  'table-of-contents': {
    label: 'İçindekiler tablosu ekle',
    prompt: 'Başlıklara göre hiyerarşik içindekiler bölümü oluştur ve markdown akışına uygun noktaya ekle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ListBulleted',
  },
  'pull-quote-spread': {
    label: 'Büyük alıntı ekle',
    prompt: 'İçerikten en etkileyici cümleyi seçerek büyük tipografili :::quote directive ile editöryal alıntı bloğu oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Quotes',
  },
  'timeline-process': {
    label: 'Süreç akışı ekle',
    prompt: 'İçerikteki sıralı adımları :::timeline directive formatında 3-7 adımlı süreç akışı bloğuna dönüştür. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Time',
  },
  'comparison-table': {
    label: 'Karşılaştırma tablosu',
    prompt: 'İçerikteki alternatifleri yan yana karşılaştırma tablosu olarak düzenle. 2-4 seçenek, çoklu kriter. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Compare',
  },
  'two-column-narrative': {
    label: 'İki sütunlu metin',
    prompt: 'Uzun paragrafları iki sütunlu anlatı düzenine dönüştür. Sütunlar arasında dengeli dağılım yap. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'TextLongParagraph',
  },
  'infographic-strip': {
    label: 'İnfografik şerit ekle',
    prompt: 'İçerikteki 3-5 önemli sayısal veriyi ikon + istatistik formatında yatay infografik şerit bloğu olarak düzenle. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'ChartBar',
  },
  'author-bio-strip': {
    label: 'Yazar bilgisi ekle',
    prompt: 'Doküman yazarları için isim, unvan ve kısa biyografi içeren yazar kartları bölümü oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'UserMultiple',
  },
  'methodology-section': {
    label: 'Metodoloji bölümü yaz',
    prompt: 'Araştırma/rapor için veri toplama yöntemi, örneklem özellikleri ve analiz yaklaşımını açıklayan bir metodoloji bölümü oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'Chemistry',
  },
  'sidebar-callout': {
    label: 'Kenar notu ekle',
    prompt: 'İçerikten destekleyici tanım, istatistik veya bağlam bilgisini :::callout{tone="info"} directive ile kenar notu olarak oluştur. Çıktıyı markdown code block olarak ver.',
    expectMarkdown: true,
    icon: 'SidePanelOpen',
  },
};

export default PATTERN_PROMPTS;
