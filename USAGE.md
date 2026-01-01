# Carbon Markdown to PDF - Kullanım Kılavuzu

## Hızlı Başlangıç

### 1. Kurulum

Sistem bağımlılıkları zaten kurulu:
- ✅ Typst 0.11.1
- ✅ Quarto 1.4.549
- ✅ Node.js bağımlılıkları

### 2. Temel Kullanım

#### CLI ile PDF Oluşturma

```bash
# Typst ile dönüştürme (hızlı)
node src/cli.js examples/sample.md --engine typst

# Quarto ile dönüştürme (LaTeX tabanlı)
node src/cli.js examples/sample.md --engine quarto

# Her iki motor ile birden
node src/cli.js examples/sample.md --engine both

# Özel çıktı yolu
node src/cli.js examples/sample.md --engine typst -o my-report.pdf

# Detaylı çıktı
node src/cli.js examples/sample.md --verbose
```

#### Sistem Bilgisi

```bash
node src/cli.js info
```

#### Örnek Dosya Oluşturma

```bash
node src/cli.js example
```

### 3. Markdown Dosyası Hazırlama

Markdown dosyanızın başına frontmatter ekleyin:

```markdown
---
title: "Araştırma Raporu Başlığı"
subtitle: "Alt Başlık"
author: "Yazar Adı"
date: "Ocak 2026"
---

# Giriş

Buraya içerik yazın...
```

## Özellikler

### IBM Carbon Design System

- **Renkler**: Profesyonel Carbon renk paleti
- **Tipografi**: IBM Plex Sans, Serif ve Mono fontları
- **Layout**: 8px grid sistemi
- **Erişilebilirlik**: WCAG 2.1 AA uyumlu

### Desteklenen Markdown Özellikleri

- ✅ Başlıklar (H1-H6)
- ✅ Kalın ve italik metin
- ✅ Kod blokları (syntax highlighting)
- ✅ Satır içi kod
- ✅ Listeler (sıralı ve sırasız)
- ✅ Tablolar
- ✅ Alıntılar (blockquotes)
- ✅ Bağlantılar
- ✅ Matematiksel formüller

### Programatik Kullanım

```javascript
import { convertToTypst, convertToQuarto } from './src/index.js';

// Typst ile dönüştürme
await convertToTypst('input.md', 'output.pdf');

// Quarto ile dönüştürme
await convertToQuarto('input.md', 'output.pdf');
```

## Karşılaştırma: Typst vs Quarto

| Özellik | Typst | Quarto |
|---------|-------|--------|
| Hız | ⚡ Çok hızlı | 🐢 Yavaş (LaTeX) |
| Sözdizimi | Basit | Zengin |
| Çıktı | PDF | PDF, HTML, DOCX |
| Font desteği | Sistem fontları | LaTeX fontları |
| Kurulum | Minimal | TinyTeX gerekir |

## Örnekler

### Akademik Makale

```markdown
---
title: "Yapay Zeka ve Gelecek"
subtitle: "Makine Öğrenmesinin Etkileri"
author: "Dr. Ahmet Yılmaz"
date: "2026"
---

# Özet

Bu çalışma yapay zekanın toplumsal etkilerini inceler...

## Giriş

Yapay zeka teknolojisi...
```

### Teknik Dokümantasyon

```markdown
---
title: "API Dokümantasyonu"
author: "Geliştirme Ekibi"
date: "v1.0.0"
---

# API Referansı

## Kimlik Doğrulama

\`\`\`python
import requests

response = requests.post(
    'https://api.example.com/auth',
    json={'username': 'user', 'password': 'pass'}
)
\`\`\`
```

## İpuçları

1. **Font Uyarıları**: IBM Plex fontları sistem yüklü değilse, Typst sistem fontlarına geri döner
2. **Hex Kodlar**: Markdown içinde renk kodları (#RRGGBB) otomatik olarak escape edilir
3. **Büyük Dosyalar**: Typst büyük dosyalar için daha hızlıdır
4. **Matematiksel Formüller**: Her iki motor da LaTeX tarzı formülleri destekler

## Sorun Giderme

### Typst Hatası

```bash
# Typst versiyonunu kontrol edin
typst --version

# Template dosyasını kontrol edin
cat templates/typst/carbon-template.typ
```

### Quarto Hatası

```bash
# TinyTeX kurulu mu?
quarto install tinytex

# Quarto versiyonu
quarto --version
```

## Gelişmiş Özellikler

### Özel Tema Oluşturma

`styles/carbon/theme.js` dosyasını düzenleyerek kendi temanızı oluşturabilirsiniz:

```javascript
export const customTheme = {
  colors: {
    primary: '#YOUR_COLOR',
    // ...
  }
};
```

### Template Özelleştirme

- Typst template: `templates/typst/carbon-template.typ`
- Quarto template: `templates/quarto/carbon-template.qmd`

## Performans

- **Typst**: ~1 saniye (orta boy belge)
- **Quarto**: ~5-10 saniye (LaTeX derleme)

## Lisans

MIT License - Serbestçe kullanabilir ve değiştirebilirsiniz.

## Destek

Sorun bildirmek için GitHub Issues kullanın.
