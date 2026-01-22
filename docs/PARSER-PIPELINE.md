# Parser Pipeline (Markdown -> AST -> HTML)

Bu dokuman Carbonac parser zincirini ve ciktisini ozetler. Pipeline SoT ile uyumludur ve tek kaynaktan (remark/unified) calisir.

## Hedef
- Deterministik parse (remark-parse + gfm + frontmatter)
- Frontmatter normalizasyonu (wizard ile ayni schema)
- Baslik slug/id uretimi
- TOC uretimi
- Tipografi transformlari (opt-in)

## Pipeline
1) **Frontmatter ayrimi**
   - `gray-matter` ile YAML frontmatter ayristirilir.
   - Canonical alanlar normalize edilir: `docType`, `templateKey`, `layoutProfile`, `printProfile`, `theme`, `locale`, `version`.
   - `documentType` geri uyumluluk icin `docType`'a map edilir.

2) **Remark parse chain**
   - `remark-parse`
   - `remark-gfm`
   - `remark-frontmatter`
   - `remarkHeadingIds` (slug/id uretimi)
   - `remark-smartypants` (opsiyonel)

3) **HTML render (paged.js oncesi)**
   - `remark-rehype` (allowDangerousHtml)
   - `rehype-raw`
   - `rehype-stringify`

## Normalizasyon Kurallari
- `title`: yoksa `Untitled Document`
- `author`: yoksa `Anonymous`
- `date`: yoksa locale tabanli tarih
- `theme`: yoksa `white`
- `layoutProfile`: yoksa `symmetric`
- `printProfile`: yoksa `pagedjs-a4`
- `locale`: yoksa `en-US`
- `language`: yoksa `locale`

## TOC Kurallari
- Her heading `id` alir (Github slugger).
- TOC entry: `{ level, title, id }`.
- ID ayni metinlerde benzersiz olacak sekilde sufikslenir.

## Tipografi (Opt-in)
- `remark-smartypants` ile akilli tirnak, tire, ellipsis.
- Opt-in kullanim: `parseMarkdown(markdown, { typography: { smartypants: true } })`.

## API (utils/markdown-parser.js)
- `parseMarkdown(markdown, options)` -> `{ metadata, content, rawContent, toc, ast }`
- `markdownToHtml(content, options)` -> `string`
- `extractToc(content, options)` -> `{ level, title, id }[]`

## Ornek
```js
import { parseMarkdown, markdownToHtml } from './utils/markdown-parser.js';

const { metadata, content, toc } = parseMarkdown(source, {
  typography: { smartypants: true }
});

const html = markdownToHtml(content, {
  typography: { smartypants: true }
});
```

## Notlar
- Markdown parser tek kaynak; ek template motoru kullanilmaz.
- HTML ciktisi Paged.js preview + export pipeline ile ortak kullanilir.
