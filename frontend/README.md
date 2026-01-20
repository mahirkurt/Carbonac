# Carbon PDF Converter - Frontend

IBM Carbon Design System stilinde tasarlanmış web arayüzü.

## Özellikler

- 📝 **Markdown Editör** - Canlı düzenleme ve syntax highlighting
- 📄 **PDF Önizleme** - Gerçek zamanlı render önizlemesi
- 🤖 **AI Danışman** - Gemini-powered Carbon tasarım önerileri
- 🎨 **Tema Desteği** - Açık (White) ve karanlık (G100) temalar
- 📁 **Dosya Yükleme** - Markdown dosyalarını sürükle-bırak
- ⚙️ **Motor Seçimi** - Typst veya Quarto dönüştürme

## Kurulum

```bash
cd frontend
npm install
npm run dev
```

## Teknoloji Stack

| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| React | 18.x | UI framework |
| Vite | 5.x | Build tool |
| @carbon/react | 1.49+ | Carbon Design bileşenleri |
| @carbon/icons-react | 11.x | Carbon ikonları |
| Sass | 1.69+ | CSS preprocessor |

## Klasör Yapısı

```
frontend/
├── index.html          # HTML entry point
├── package.json        # Dependencies
├── vite.config.js      # Vite configuration
└── src/
    ├── main.jsx        # React entry point
    ├── App.jsx         # Main application component
    └── styles/
        └── index.scss  # Global styles
```

## Geliştirme

### Dev Server Başlatma
```bash
npm run dev
```
Uygulama `http://localhost:3000` adresinde çalışır.

### Production Build
```bash
npm run build
npm run preview
```

## UI Bileşenleri

### Ana Layout
- **Header** - Navigasyon ve global aksiyonlar
- **Settings Sidebar** - Motor ve şablon seçimi
- **Editor Panel** - Markdown düzenleme alanı
- **Preview Panel** - PDF çıktı önizlemesi
- **Advisor Panel** - AI tasarım danışmanı

### Kullanılan Carbon Bileşenleri
- `Theme` - Tema yönetimi
- `Header`, `HeaderGlobalAction` - Üst navigasyon
- `Button`, `Dropdown`, `Toggle` - Form elemanları
- `TextArea` - Markdown editör
- `Modal`, `Tabs` - Ayarlar dialog
- `Tag`, `Tile` - Bilgi gösterimi
- `InlineNotification` - Bildirimler
- `Loading` - Yükleme göstergesi

## API Entegrasyonu

Frontend, backend CLI ile API üzerinden iletişim kurar:

```javascript
// PDF Dönüştürme
POST /api/convert/to-pdf
Body: { markdown, settings: { layoutProfile, printProfile, theme } }

// AI Advisor
POST /api/advisor/analyze
Body: { content }

POST /api/advisor/ask
Body: { question }
```

## Temalar

### White (Varsayılan)
Açık renkli tema, profesyonel dokümanlar için ideal.

### G100 (Dark)
Karanlık tema, uzun süreli çalışma için göz yorgunluğunu azaltır.

Tema değiştirmek için header'daki ay/güneş ikonuna tıklayın.

## Ekran Görüntüleri

| Açık Tema | Karanlık Tema |
|-----------|---------------|
| Editor ve önizleme paneli | G100 tema ile aynı layout |
| AI Danışman chat | Karanlık modda chat |

## Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/yeni-ozellik`)
3. Değişikliklerinizi commit edin
4. Push yapın (`git push origin feature/yeni-ozellik`)
5. Pull Request açın
