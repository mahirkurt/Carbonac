/**
 * CarbonChartWrapper
 *
 * Thin adapter around `@carbon/charts-react` to keep Carbonac's `:::chart{...}`
 * directive format stable while we expand chart support.
 */

import React, { memo, useMemo } from 'react';
import {
  AlluvialChart,
  AreaChart,
  BoxplotChart,
  BubbleChart,
  ComboChart,
  DonutChart,
  GaugeChart,
  GroupedBarChart,
  HeatmapChart,
  HistogramChart,
  LineChart,
  LollipopChart,
  MeterChart,
  PieChart,
  RadarChart,
  ScatterChart,
  SimpleBarChart,
  StackedAreaChart,
  StackedBarChart,
  TreemapChart,
  WordCloudChart,
  ScaleTypes,
} from '@carbon/charts-react';

import { useTheme } from '../../contexts';

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeType(value) {
  return String(value || 'bar').trim().toLowerCase();
}

function hasField(data, key) {
  if (!Array.isArray(data)) return false;
  return data.some((item) => isRecord(item) && item[key] !== undefined && item[key] !== null);
}

function pickFirstNumericField(sample, exclude) {
  if (!isRecord(sample)) return null;
  const excluded = new Set(exclude);
  for (const key of Object.keys(sample)) {
    if (excluded.has(key)) continue;
    const num = Number(sample[key]);
    if (Number.isFinite(num)) return key;
  }
  return null;
}

function inferAxes(type, data) {
  if (!Array.isArray(data) || data.length === 0) return null;
  const sample = data.find((item) => isRecord(item)) || null;
  if (!sample) return null;

  const hasDate = hasField(data, 'date');
  const hasKey = hasField(data, 'key');
  const hasGroup = hasField(data, 'group');

  if (type === 'scatter' || type === 'bubble') {
    const xKey = hasField(data, 'x')
      ? 'x'
      : pickFirstNumericField(sample, ['group', 'key', 'value', 'y', 'size', 'r']);
    const yKey = hasField(data, 'y')
      ? 'y'
      : pickFirstNumericField(sample, ['group', 'key', 'value', xKey || 'x', 'size', 'r']);

    if (!xKey || !yKey) return null;

    return {
      bottom: { mapsTo: xKey, scaleType: ScaleTypes.LINEAR, title: xKey },
      left: { mapsTo: yKey, scaleType: ScaleTypes.LINEAR, title: yKey },
    };
  }

  if (type === 'line' || type === 'area' || type === 'stackedarea') {
    const xKey = hasDate ? 'date' : (hasKey ? 'key' : (hasGroup ? 'group' : null));
    if (!xKey) return null;
    return {
      bottom: { mapsTo: xKey, scaleType: hasDate ? ScaleTypes.TIME : ScaleTypes.LABELS },
      left: { mapsTo: 'value', scaleType: ScaleTypes.LINEAR },
    };
  }

  // Axis-based categorical charts (bar, stacked bar, lollipop, histogram, etc.)
  const categoryKey = hasKey && hasGroup ? 'key' : (hasGroup ? 'group' : (hasKey ? 'key' : null));
  if (!categoryKey) return null;
  return {
    bottom: { mapsTo: categoryKey, scaleType: ScaleTypes.LABELS },
    left: { mapsTo: 'value', scaleType: ScaleTypes.LINEAR },
  };
}

function resolveChartComponent(type, data, options) {
  if (type === 'bar') {
    // If the dataset includes (key + group), prefer grouped bars (key=category, group=series).
    return (hasField(data, 'key') && hasField(data, 'group')) ? GroupedBarChart : SimpleBarChart;
  }

  if (type === 'stacked') {
    // Heuristic: time-series => stacked area, otherwise stacked bar.
    return hasField(data, 'date') ? StackedAreaChart : StackedBarChart;
  }

  const map = {
    line: LineChart,
    area: AreaChart,
    donut: DonutChart,
    pie: PieChart,
    scatter: ScatterChart,
    bubble: BubbleChart,
    radar: RadarChart,
    treemap: TreemapChart,
    gauge: GaugeChart,
    heatmap: HeatmapChart,
    histogram: HistogramChart,
    boxplot: BoxplotChart,
    meter: MeterChart,
    combo: ComboChart,
    lollipop: LollipopChart,
    wordcloud: WordCloudChart,
    alluvial: AlluvialChart,
  };

  return map[type] || SimpleBarChart;
}

class ChartErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      // Allow recovery when the chart inputs change.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ error: null });
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      return (
        <div className="carbonac-chart__error" role="alert">
          Grafik onizlemesi olusturulamadi: {String(error?.message || error)}
        </div>
      );
    }
    return this.props.children;
  }
}

function buildChartOptions({ type, data, caption, theme, userOptions }) {
  const base = {
    theme,
    height: '360px',
  };

  const title = (userOptions?.title || caption || '').trim();
  if (title) {
    base.title = title;
  }

  // Provide sensible defaults unless the caller already supplied axes.
  if (!userOptions?.axes) {
    const axes = inferAxes(type, data);
    if (axes) {
      base.axes = axes;
    }
  }

  if (type === 'radar') {
    base.radar = {
      axes: { angle: 'key', value: 'value' },
      ...(isRecord(userOptions?.radar) ? userOptions.radar : {}),
    };
  }

  if (type === 'wordcloud') {
    base.wordCloud = {
      wordMapsTo: 'group',
      fontSizeMapsTo: 'value',
      ...(isRecord(userOptions?.wordCloud) ? userOptions.wordCloud : {}),
    };
  }

  return {
    ...base,
    ...(isRecord(userOptions) ? userOptions : {}),
    theme: (isRecord(userOptions) && userOptions.theme) ? userOptions.theme : theme,
  };
}

function normalizeDataInput(input) {
  if (Array.isArray(input)) {
    return { data: input, options: null };
  }
  if (isRecord(input)) {
    const data = Array.isArray(input.data)
      ? input.data
      : (Array.isArray(input.values) ? input.values : []);
    const options = isRecord(input.options) ? input.options : null;
    return { data, options };
  }
  return { data: [], options: null };
}

function ChartMeta({ source, sampleSize, methodology, notes }) {
  const parts = [
    sampleSize ? `Sample: ${sampleSize}` : null,
    methodology ? `Method: ${methodology}` : null,
    source ? `Source: ${source}` : null,
    notes ? `Notes: ${notes}` : null,
  ].filter(Boolean);

  if (!parts.length) return null;

  return (
    <div className="carbonac-chart__meta">
      {parts.join(' | ')}
    </div>
  );
}

function CarbonChartWrapper({
  type = 'bar',
  data: rawData,
  options: rawOptions,
  caption,
  question,
  source,
  sampleSize,
  methodology,
  notes,
  highlight,
  themeOverride,
}) {
  const { theme: appTheme } = useTheme();
  const theme = themeOverride || appTheme;

  const normalizedType = normalizeType(type);
  const { data, options: payloadOptions } = useMemo(() => normalizeDataInput(rawData), [rawData]);

  const userOptions = useMemo(() => {
    if (isRecord(rawOptions)) return rawOptions;
    if (isRecord(payloadOptions)) return payloadOptions;
    return null;
  }, [payloadOptions, rawOptions]);

  const Component = useMemo(
    () => resolveChartComponent(normalizedType, data, userOptions),
    [data, normalizedType, userOptions]
  );

  const mergedOptions = useMemo(() => buildChartOptions({
    type: normalizedType,
    data,
    caption: caption || question || '',
    theme,
    userOptions,
  }), [caption, data, normalizedType, question, theme, userOptions]);

  const errorResetKey = useMemo(() => {
    const head = Array.isArray(data) && data.length ? JSON.stringify(data[0]) : '';
    return `${normalizedType}|${theme}|${data.length}|${head}`;
  }, [data, normalizedType, theme]);

  const resolvedCaption = (caption || question || '').trim();
  const hasData = Array.isArray(data) && data.length > 0;

  if (!hasData) {
    return (
      <div className={`carbonac-chart carbonac-chart--${normalizedType}`}>
        {resolvedCaption ? <div className="carbonac-chart__caption">{resolvedCaption}</div> : null}
        <div className="carbonac-chart__empty">Grafik verisi bulunamadi.</div>
      </div>
    );
  }

  return (
    <div className={`carbonac-chart carbonac-chart--${normalizedType}`}>
      {highlight ? <div className="carbonac-chart__highlight">{String(highlight)}</div> : null}
      <ChartErrorBoundary resetKey={errorResetKey}>
        <Component data={data} options={mergedOptions} />
      </ChartErrorBoundary>
      {resolvedCaption ? <div className="carbonac-chart__caption">{resolvedCaption}</div> : null}
      <ChartMeta
        source={source}
        sampleSize={sampleSize}
        methodology={methodology}
        notes={notes}
      />
    </div>
  );
}

export default memo(CarbonChartWrapper);
