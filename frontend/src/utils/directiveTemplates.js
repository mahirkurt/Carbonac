const directiveTemplates = [
  {
    id: 'callout',
    label: 'Callout',
    snippet: ':::callout{tone="info" title="Key Insight"}\nVurgu metni buraya.\n:::',
  },
  {
    id: 'data-table',
    label: 'Data Table',
    snippet: ':::data-table{caption="Tablo Basligi" source="Kaynak" methodology="Anket 2025" columns="Metric,Value"}\n| Metric | Value |\n| --- | --- |\n| Gelir | 12.4M |\n:::',
  },
  {
    id: 'chart',
    label: 'Chart',
    snippet: ':::chart{type="bar" variant="survey" question="Soru etiketi" highlight="64%" sampleSize="n=120" source="Kaynak" methodology="Online survey"}\n```json\n[{"group":"A","value":12},{"group":"B","value":18}]\n```\n:::',
  },
  {
    id: 'code-group',
    label: 'Code Group',
    snippet: ':::code-group{title="Ornek Kod" language="js" filename="index.js"}\n```js\nconsole.log("Hello");\n```\n:::',
  },
  {
    id: 'figure',
    label: 'Figure',
    snippet: ':::figure{src="https://example.com/image.png" caption="Sekil 1" source="Kaynak" width="80%"}\n:::',
  },
  {
    id: 'quote',
    label: 'Quote',
    snippet: ':::quote{author="Ada Lovelace" title="Matematikci" source="Konferans"}\n"Veri, hikayenin kalbidir."\n:::',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    snippet: ':::timeline{layout="vertical" start="2024" end="2025"}\n- Q1: Kesif\n- Q2: Gelistirme\n- Q3: Pilot\n:::',
  },
  {
    id: 'accordion',
    label: 'Accordion',
    snippet: ':::accordion{variant="default"}\n### Soru 1\nYaniti burada.\n\n### Soru 2\nYaniti burada.\n:::',
  },
  {
    id: 'marginnote',
    label: 'Margin Note',
    snippet: ':marginnote[Bu bir kenar notudur.]{align="right"}',
  },
  {
    id: 'pattern',
    label: 'Pattern',
    snippet: ':::pattern{type="executive-summary" title="Executive Summary"}\nKisa ozet burada.\n:::',
  },
];

export default directiveTemplates;
