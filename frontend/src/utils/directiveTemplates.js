const directiveTemplates = [
  {
    id: 'callout',
    label: 'Callout',
    snippet: ':::callout{tone="info" title="Key Insight"}\nVurgu metni buraya.\n:::',
  },
  {
    id: 'data-table',
    label: 'Data Table',
    snippet: ':::data-table{caption="Tablo Başlığı" source="Kaynak" methodology="Anket 2025" columns="Metric,Value"}\n| Metric | Value |\n| --- | --- |\n| Gelir | 12.4M |\n:::',
  },
  {
    id: 'chart',
    label: 'Chart',
    snippet: ':::chart{type="bar" variant="survey" question="Soru etiketi" highlight="64%" sampleSize="n=120" source="Kaynak" methodology="Online survey"}\n```json\n[{"group":"A","value":12},{"group":"B","value":18}]\n```\n:::',
  },
  {
    id: 'chart-scatter',
    label: 'Scatter Chart',
    snippet: ':::chart{type="scatter" caption="Korelasyon Analizi" source="Kaynak"}\n```json\n[{"group":"A","x":10,"y":25},{"group":"B","x":30,"y":45},{"group":"C","x":18,"y":12}]\n```\n:::',
  },
  {
    id: 'chart-radar',
    label: 'Radar Chart',
    snippet: ':::chart{type="radar" caption="Yetkinlik Haritasi" source="Kaynak"}\n```json\n[{"group":"Takim A","key":"Hiz","value":8},{"group":"Takim A","key":"Kalite","value":7},{"group":"Takim A","key":"Maliyet","value":6},{"group":"Takim B","key":"Hiz","value":6},{"group":"Takim B","key":"Kalite","value":8},{"group":"Takim B","key":"Maliyet","value":7}]\n```\n:::',
  },
  {
    id: 'chart-treemap',
    label: 'Treemap Chart',
    snippet: ':::chart{type="treemap" caption="Portfoy Dagilimi" source="Kaynak"}\n```json\n[{"group":"Urun A","value":35},{"group":"Urun B","value":22},{"group":"Urun C","value":18},{"group":"Urun D","value":25}]\n```\n:::',
  },
  {
    id: 'code-group',
    label: 'Code Group',
    snippet: ':::code-group{title="Örnek Kod" language="js" filename="index.js"}\n```js\nconsole.log("Hello");\n```\n:::',
  },
  {
    id: 'figure',
    label: 'Figure',
    snippet: ':::figure{src="https://example.com/image.png" caption="Şekil 1" source="Kaynak" width="80%"}\n:::',
  },
  {
    id: 'quote',
    label: 'Quote',
    snippet: ':::quote{author="Ada Lovelace" title="Matematikçi" source="Konferans"}\n"Veri, hikayenin kalbidir."\n:::',
  },
  {
    id: 'timeline',
    label: 'Timeline',
    snippet: ':::timeline{layout="vertical" start="2024" end="2025"}\n- Q1: Keşif\n- Q2: Geliştirme\n- Q3: Pilot\n:::',
  },
  {
    id: 'accordion',
    label: 'Accordion',
    snippet: ':::accordion{variant="default"}\n### Soru 1\nYanıtı burada.\n\n### Soru 2\nYanıtı burada.\n:::',
  },
  {
    id: 'marginnote',
    label: 'Margin Note',
    snippet: ':marginnote[Bu bir kenar notudur.]{align="right"}',
  },
  {
    id: 'pattern',
    label: 'Pattern',
    snippet: ':::pattern{type="executive-summary" title="Executive Summary"}\nKısa özet burada.\n:::',
  },
];

export default directiveTemplates;
