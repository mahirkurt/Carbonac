# TOKEN PACKS (Print Pipeline)

> Bu dokuman Paged.js render icin token pack yapisini ve override akisini tanimlar.

## 1) Dizin Yapisi
```
tokens/
  core.json
  print.json
  themes/
    white.json
    g10.json
    g90.json
    g100.json
templates/
  <template-key>/
    overrides.json
```

## 2) Token Pack Icerigi
Her pack `cssVars` objesi ile CSS degiskenlerini tanimlar.

Ornek:
```json
{
  "version": "1.0.0",
  "cssVars": {
    "--report-max-width": "960px",
    "--font-size-body": "10pt"
  }
}
```

## 3) Theme Pack'leri
Tema pack'leri renkleri belirler:
- `--cds-text-primary`
- `--cds-text-secondary`
- `--cds-border-subtle`
- `--cds-accent`
- `--report-surface`, `--report-surface-muted`

Tema secimi, `body.theme--<theme>` class'i ile uygulanir.

## 4) Template Overrides
`templates/<template-key>/overrides.json` dosyasi ile token override edilir.

Ornek:
```json
{
  "cssVars": {
    "--report-max-width": "900px"
  },
  "themes": {
    "white": {
      "--cds-accent": "#0043ce"
    }
  }
}
```

## 5) Press Pack Overrides
Press pack manifest icindeki `tokens.tokenPack.overrides` alani, template override'larin ustune eklenir.

## 6) Token Lint
Print CSS icin hard-coded hex/px degerleri `scripts/token-lint.js` ile kontrol edilir:
```bash
npm run lint:tokens
```
