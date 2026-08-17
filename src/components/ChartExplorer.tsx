import React, { useState, useMemo } from 'react';
import { ColumnInfo, ChartType, AggregationType } from '../types';
import { aggregateChartData, formatValue } from '../utils/dataProcessor';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Layers, Sparkles, SlidersHorizontal } from 'lucide-react';

interface ChartExplorerProps {
  columns: ColumnInfo[];
  rows: Record<string, any>[];
}

const COLOR_PALETTES = {
  indigo: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6'],
  emerald: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#047857', '#065f46', '#14b8a6'],
  sunset: ['#f97316', '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', '#d97706', '#dc2626'],
  ocean: ['#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#0369a1', '#075985', '#6366f1'],
};

export const ChartExplorer: React.FC<ChartExplorerProps> = ({ columns, rows }) => {
  const numericColumns = columns.filter((c) => c.type === 'number');
  const nonNumericColumns = columns.filter((c) => c.type !== 'number');

  // Intelligent defaults
  const defaultX = nonNumericColumns.find((c) => c.type === 'category' || c.type === 'date')?.key || columns[0]?.key || '';
  const defaultY = numericColumns[0]?.key || columns[1]?.key || '';

  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisKey, setXAxisKey] = useState<string>(defaultX);
  const [selectedYKeys, setSelectedYKeys] = useState<string[]>([defaultY].filter(Boolean));
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [paletteKey, setPaletteKey] = useState<keyof typeof COLOR_PALETTES>('indigo');
  const [isStacked, setIsStacked] = useState(false);

  // Sync if columns change
  React.useEffect(() => {
    if (!xAxisKey && defaultX) setXAxisKey(defaultX);
    if (selectedYKeys.length === 0 && defaultY) setSelectedYKeys([defaultY]);
  }, [defaultX, defaultY]);

  const colors = COLOR_PALETTES[paletteKey] || COLOR_PALETTES.indigo;

  // Process data for charts
  const chartData = useMemo(() => {
    if (!xAxisKey || selectedYKeys.length === 0 || rows.length === 0) return [];
    return aggregateChartData(rows, xAxisKey, selectedYKeys, aggregation);
  }, [rows, xAxisKey, selectedYKeys, aggregation]);

  const handleToggleYKey = (key: string) => {
    if (selectedYKeys.includes(key)) {
      if (selectedYKeys.length > 1) {
        setSelectedYKeys(selectedYKeys.filter((k) => k !== key));
      }
    } else {
      setSelectedYKeys([...selectedYKeys, key]);
    }
  };

  const getColName = (key: string) => columns.find((c) => c.key === key)?.name || key;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      
      {/* Top Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        
        {/* Chart Type Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
          <button
            id="chart-type-bar"
            onClick={() => setChartType('bar')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'bar'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Bar</span>
          </button>

          <button
            id="chart-type-line"
            onClick={() => setChartType('line')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'line'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LineIcon className="w-3.5 h-3.5" />
            <span>Line</span>
          </button>

          <button
            id="chart-type-area"
            onClick={() => setChartType('area')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'area'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Area</span>
          </button>

          <button
            id="chart-type-pie"
            onClick={() => setChartType('pie')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'pie'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Donut</span>
          </button>

          <button
            id="chart-type-composed"
            onClick={() => setChartType('composed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              chartType === 'composed'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Combo</span>
          </button>
        </div>

        {/* Dimension & Metric Selectors */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* X Axis Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">X-Axis:</span>
            <select
              id="chart-select-xaxis"
              value={xAxisKey}
              onChange={(e) => setXAxisKey(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {columns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.name} ({col.type})
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Agg:</span>
            <select
              id="chart-select-agg"
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as AggregationType)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count (Rows)</option>
              <option value="max">Max</option>
              <option value="min">Min</option>
            </select>
          </div>

          {/* Palette */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Theme:</span>
            <select
              value={paletteKey}
              onChange={(e) => setPaletteKey(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="indigo">Indigo</option>
              <option value="emerald">Emerald</option>
              <option value="sunset">Sunset</option>
              <option value="ocean">Ocean</option>
            </select>
          </div>

          {/* Stacked toggle for bar */}
          {chartType === 'bar' && selectedYKeys.length > 1 && (
            <label className="flex items-center gap-1.5 text-slate-700 font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={isStacked}
                onChange={(e) => setIsStacked(e.target.checked)}
                className="rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span>Stacked</span>
            </label>
          )}

        </div>

      </div>

      {/* Y-Axis Metric Multi-Selection Pills */}
      <div className="flex flex-wrap items-center gap-2 pt-3 pb-2 text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
          Metrics:
        </span>
        {numericColumns.map((col, idx) => {
          const isSelected = selectedYKeys.includes(col.key);
          const color = colors[idx % colors.length];
          return (
            <button
              key={col.key}
              onClick={() => handleToggleYKey(col.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: isSelected ? color : '#94a3b8' }}
              />
              <span>{col.name}</span>
            </button>
          );
        })}
      </div>

      {/* Main Chart Canvas */}
      <div className="w-full h-[360px] sm:h-[400px] mt-4">
        {chartData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 border border-dashed border-slate-200 rounded-xl">
            <SlidersHorizontal className="w-8 h-8 mb-2" />
            <p className="text-xs font-medium">No data available for the selected axes and filters</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  angle={-20}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatValue(v, 'number')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                  formatter={(val: any, name: any) => [formatValue(val, 'number'), getColName(String(name))]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(name) => <span className="text-xs text-slate-700 font-medium">{getColName(name)}</span>}
                />
                {selectedYKeys.map((yKey, index) => (
                  <Bar
                    key={yKey}
                    dataKey={yKey}
                    fill={colors[index % colors.length]}
                    radius={isStacked ? [0, 0, 0, 0] : [6, 6, 0, 0]}
                    stackId={isStacked ? 'stack' : undefined}
                    animationDuration={600}
                  />
                ))}
              </BarChart>
            ) : chartType === 'line' ? (
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatValue(v, 'number')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [formatValue(val, 'number'), getColName(String(name))]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(name) => <span className="text-xs text-slate-700 font-medium">{getColName(name)}</span>}
                />
                {selectedYKeys.map((yKey, index) => (
                  <Line
                    key={yKey}
                    type="monotone"
                    dataKey={yKey}
                    stroke={colors[index % colors.length]}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: colors[index % colors.length] }}
                    activeDot={{ r: 6 }}
                    animationDuration={600}
                  />
                ))}
              </LineChart>
            ) : chartType === 'area' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <defs>
                  {selectedYKeys.map((yKey, index) => {
                    const color = colors[index % colors.length];
                    return (
                      <linearGradient key={`grad-${yKey}`} id={`grad-${yKey}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatValue(v, 'number')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [formatValue(val, 'number'), getColName(String(name))]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(name) => <span className="text-xs text-slate-700 font-medium">{getColName(name)}</span>}
                />
                {selectedYKeys.map((yKey, index) => (
                  <Area
                    key={yKey}
                    type="monotone"
                    dataKey={yKey}
                    stroke={colors[index % colors.length]}
                    fill={`url(#grad-${yKey})`}
                    strokeWidth={2}
                    animationDuration={600}
                  />
                ))}
              </AreaChart>
            ) : chartType === 'pie' ? (
              <PieChart>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [formatValue(val, 'number'), getColName(selectedYKeys[0])]}
                />
                <Legend
                  verticalAlign="bottom"
                  height={48}
                  formatter={(name) => <span className="text-xs text-slate-700 font-medium">{name}</span>}
                />
                <Pie
                  data={chartData}
                  dataKey={selectedYKeys[0] || '_count'}
                  nameKey={xAxisKey}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={115}
                  paddingAngle={3}
                  animationDuration={600}
                >
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
              </PieChart>
            ) : (
              /* Composed / Combo */
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => formatValue(v, 'number')}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any, name: any) => [formatValue(val, 'number'), getColName(String(name))]}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(name) => <span className="text-xs text-slate-700 font-medium">{getColName(name)}</span>}
                />
                {selectedYKeys[0] && (
                  <Bar
                    dataKey={selectedYKeys[0]}
                    fill={colors[0]}
                    radius={[6, 6, 0, 0]}
                    animationDuration={600}
                  />
                )}
                {selectedYKeys[1] && (
                  <Line
                    type="monotone"
                    dataKey={selectedYKeys[1]}
                    stroke={colors[1]}
                    strokeWidth={3}
                    dot={{ r: 4, fill: colors[1] }}
                    animationDuration={600}
                  />
                )}
                {selectedYKeys.slice(2).map((yKey, idx) => (
                  <Line
                    key={yKey}
                    type="monotone"
                    dataKey={yKey}
                    stroke={colors[(idx + 2) % colors.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                ))}
              </ComposedChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};
