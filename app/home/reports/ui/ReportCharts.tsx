'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import type { ReportSeries } from '@/lib/reports/types';
import {
  formatReportAxisLabel,
  formatReportSeriesValue,
} from '@/lib/reports/format';

const COLORS = ['#1F4E78', '#2E7D4F', '#C47B2B', '#6B4C9A', '#B83B3B', '#3A8BB5', '#8B6B4A'];

/** Tamaño fijo A4 (2 columnas) — ResponsiveContainer queda en 0×0 al imprimir. */
const PRINT_CHART_WIDTH = 340;
const PRINT_CHART_HEIGHT = 200;

type Props = {
  series: ReportSeries[];
  /** Cuando true, renderiza charts con width/height fijos (imprescindible para print). */
  printing?: boolean;
};

function chartValueFormatter(series: ReportSeries) {
  return (raw: unknown) => {
    const formatted = formatReportSeriesValue(series.id, Number(raw), series.label);
    return [formatted, 'Valor'] as [string, string];
  };
}

function yAxisTickFormatter(series: ReportSeries) {
  return (raw: number) => formatReportSeriesValue(series.id, raw, series.label);
}

function ChartCard({
  series,
  printing = false,
}: {
  series: ReportSeries;
  printing?: boolean;
}) {
  const data = series.points.map((p) => ({
    name: formatReportAxisLabel(p.x),
    value: p.y,
  }));
  const formatTooltip = chartValueFormatter(series);
  const formatY = yAxisTickFormatter(series);
  const axisTick = { fontSize: printing ? 10 : 11, fill: '#444' };
  const margin = { top: 8, right: 12, left: 4, bottom: 4 };

  if (!data.length) {
    return (
      <div className="report-chart-card rounded border border-gray-200 p-4 text-sm text-gray-500">
        Sin datos para graficar ({series.label})
      </div>
    );
  }

  const chartBody =
    series.chart === 'pie' ? (
      <PieChart
        width={printing ? PRINT_CHART_WIDTH : undefined}
        height={printing ? PRINT_CHART_HEIGHT : undefined}
        margin={margin}
      >
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={printing ? 68 : 80}
          isAnimationActive={false}
          label={
            printing
              ? false
              : ({ name, value }) =>
                  `${name}: ${formatReportSeriesValue(series.id, Number(value), series.label)}`
          }
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="#fff" strokeWidth={1} />
          ))}
        </Pie>
        {!printing && <Tooltip formatter={formatTooltip} />}
      </PieChart>
    ) : series.chart === 'bar' ? (
      <BarChart
        width={printing ? PRINT_CHART_WIDTH : undefined}
        height={printing ? PRINT_CHART_HEIGHT : undefined}
        data={data}
        margin={margin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis
          dataKey="name"
          tick={axisTick}
          interval="preserveStartEnd"
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
        />
        <YAxis
          tick={axisTick}
          tickFormatter={formatY}
          width={printing ? 64 : 72}
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
        />
        {!printing && <Tooltip formatter={formatTooltip} />}
        <Bar dataKey="value" fill="#1F4E78" radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    ) : series.chart === 'area' ? (
      <AreaChart
        width={printing ? PRINT_CHART_WIDTH : undefined}
        height={printing ? PRINT_CHART_HEIGHT : undefined}
        data={data}
        margin={margin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis
          dataKey="name"
          tick={axisTick}
          interval="preserveStartEnd"
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
        />
        <YAxis
          tick={axisTick}
          tickFormatter={formatY}
          width={printing ? 64 : 72}
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
        />
        {!printing && <Tooltip formatter={formatTooltip} />}
        <Area
          type="monotone"
          dataKey="value"
          stroke="#1F4E78"
          fill="#1F4E7844"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    ) : (
      <LineChart
        width={printing ? PRINT_CHART_WIDTH : undefined}
        height={printing ? PRINT_CHART_HEIGHT : undefined}
        data={data}
        margin={margin}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
        <XAxis
          dataKey="name"
          tick={axisTick}
          interval="preserveStartEnd"
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
        />
        <YAxis
          tick={axisTick}
          tickFormatter={formatY}
          width={printing ? 64 : 72}
          axisLine={{ stroke: '#ccc' }}
          tickLine={{ stroke: '#ccc' }}
        />
        {!printing && <Tooltip formatter={formatTooltip} />}
        <Line
          type="monotone"
          dataKey="value"
          stroke="#1F4E78"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    );

  return (
    <div className="report-chart-card rounded border border-gray-200 bg-white p-3 overflow-hidden">
      <div className="report-chart-title text-sm font-medium text-gray-700 mb-2">
        {series.label}
      </div>
      <div
        className="report-chart-canvas w-full"
        style={
          printing
            ? { width: PRINT_CHART_WIDTH, height: PRINT_CHART_HEIGHT }
            : { height: 224 }
        }
      >
        {printing ? (
          chartBody
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartBody}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

export default function ReportCharts({ series, printing = false }: Props) {
  if (!series?.length) return null;
  return (
    <div className="report-charts-grid grid grid-cols-1 lg:grid-cols-2 gap-3">
      {series.map((s) => (
        <ChartCard key={s.id} series={s} printing={printing} />
      ))}
    </div>
  );
}
