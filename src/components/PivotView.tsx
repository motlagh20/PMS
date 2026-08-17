import React, { useState, useMemo } from 'react';
import { ColumnInfo, AggregationType } from '../types';
import { parseNumber, formatValue } from '../utils/dataProcessor';
import { Table, ArrowUpDown, Layers, Sigma } from 'lucide-react';

interface PivotViewProps {
  columns: ColumnInfo[];
  rows: Record<string, any>[];
}

export const PivotView: React.FC<PivotViewProps> = ({ columns, rows }) => {
  const dimensionColumns = columns.filter((c) => c.type === 'category' || c.type === 'text' || c.type === 'date');
  const metricColumns = columns.filter((c) => c.type === 'number');

  const defaultDimension = dimensionColumns[0]?.key || columns[0]?.key || '';
  const defaultMetric = metricColumns[0]?.key || columns[1]?.key || '';

  const [dimensionKey, setDimensionKey] = useState<string>(defaultDimension);
  const [selectedMetricKeys, setSelectedMetricKeys] = useState<string[]>([defaultMetric].filter(Boolean));
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [sortBy, setSortBy] = useState<string>('');
  const [sortAsc, setSortAsc] = useState(false);

  React.useEffect(() => {
    if (!dimensionKey && defaultDimension) setDimensionKey(defaultDimension);
    if (selectedMetricKeys.length === 0 && defaultMetric) setSelectedMetricKeys([defaultMetric]);
  }, [defaultDimension, defaultMetric]);

  const toggleMetric = (key: string) => {
    if (selectedMetricKeys.includes(key)) {
      if (selectedMetricKeys.length > 1) {
        setSelectedMetricKeys(selectedMetricKeys.filter((k) => k !== key));
      }
    } else {
      setSelectedMetricKeys([...selectedMetricKeys, key]);
    }
  };

  const getColName = (key: string) => columns.find((c) => c.key === key)?.name || key;

  // Group and aggregate
  const pivotData = useMemo(() => {
    if (!dimensionKey || rows.length === 0) return { rows: [], totals: {} };

    const groups: Record<string, { count: number; values: Record<string, number[]> }> = {};

    rows.forEach((row) => {
      let dimVal = row[dimensionKey];
      if (dimVal === null || dimVal === undefined || dimVal === '') {
        dimVal = '(Empty)';
      } else {
        dimVal = String(dimVal);
      }

      if (!groups[dimVal]) {
        groups[dimVal] = { count: 0, values: {} };
        selectedMetricKeys.forEach((m) => {
          groups[dimVal].values[m] = [];
        });
      }

      groups[dimVal].count++;
      selectedMetricKeys.forEach((m) => {
        const num = parseNumber(row[m]);
        if (!isNaN(num)) {
          groups[dimVal].values[m].push(num);
        }
      });
    });

    const resultRows = Object.entries(groups).map(([dimVal, data]) => {
      const item: Record<string, any> = {
        _dimension: dimVal,
        _count: data.count,
      };

      selectedMetricKeys.forEach((m) => {
        const nums = data.values[m] || [];
        if (nums.length === 0) {
          item[m] = 0;
          return;
        }

        switch (aggregation) {
          case 'sum':
            item[m] = nums.reduce((a, b) => a + b, 0);
            break;
          case 'avg':
            item[m] = nums.reduce((a, b) => a + b, 0) / nums.length;
            break;
          case 'count':
            item[m] = nums.length;
            break;
          case 'min':
            item[m] = Math.min(...nums);
            break;
          case 'max':
            item[m] = Math.max(...nums);
            break;
          default:
            item[m] = nums.reduce((a, b) => a + b, 0);
        }
      });

      return item;
    });

    // Calculate totals
    const totals: Record<string, number> = { _count: rows.length };
    selectedMetricKeys.forEach((m) => {
      const allNums = rows.map((r) => parseNumber(r[m])).filter((n) => !isNaN(n));
      if (allNums.length === 0) {
        totals[m] = 0;
        return;
      }
      switch (aggregation) {
        case 'sum':
          totals[m] = allNums.reduce((a, b) => a + b, 0);
          break;
        case 'avg':
          totals[m] = allNums.reduce((a, b) => a + b, 0) / allNums.length;
          break;
        case 'count':
          totals[m] = allNums.length;
          break;
        case 'min':
          totals[m] = Math.min(...allNums);
          break;
        case 'max':
          totals[m] = Math.max(...allNums);
          break;
        default:
          totals[m] = allNums.reduce((a, b) => a + b, 0);
      }
    });

    // Sort rows
    const sortField = sortBy || selectedMetricKeys[0] || '_count';
    resultRows.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortAsc ? valA - valB : valB - valA;
      }
      return sortAsc
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return { rows: resultRows, totals };
  }, [rows, dimensionKey, selectedMetricKeys, aggregation, sortBy, sortAsc]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(false);
    }
  };

  const primaryMetric = selectedMetricKeys[0];
  const maxPrimaryVal = Math.max(...pivotData.rows.map((r) => r[primaryMetric] || 0), 1);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      
      {/* Pivot Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Pivot & Summary Aggregation</h3>
            <p className="text-xs text-slate-500">Group dimensions and aggregate metrics dynamically</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          
          {/* Dimension Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Group By:</span>
            <select
              id="pivot-select-dimension"
              value={dimensionKey}
              onChange={(e) => setDimensionKey(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              {dimensionColumns.map((col) => (
                <option key={col.key} value={col.key}>
                  {col.name}
                </option>
              ))}
            </select>
          </div>

          {/* Aggregation Method */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[11px]">Calculation:</span>
            <select
              id="pivot-select-agg"
              value={aggregation}
              onChange={(e) => setAggregation(e.target.value as AggregationType)}
              className="bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            >
              <option value="sum">Sum</option>
              <option value="avg">Average</option>
              <option value="count">Count</option>
              <option value="min">Min</option>
              <option value="max">Max</option>
            </select>
          </div>

        </div>

      </div>

      {/* Metric Selectors */}
      <div className="flex flex-wrap items-center gap-2 pt-3 pb-2 text-xs">
        <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] mr-1">
          Included Values:
        </span>
        {metricColumns.map((col) => {
          const isSelected = selectedMetricKeys.includes(col.key);
          return (
            <button
              key={col.key}
              onClick={() => toggleMetric(col.key)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {col.name}
            </button>
          );
        })}
      </div>

      {/* Pivot Data Table */}
      <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th
                onClick={() => handleSort('_dimension')}
                className="px-4 py-3 text-left font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>{getColName(dimensionKey)}</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('_count')}
                className="px-4 py-3 text-right font-bold cursor-pointer hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Row Count</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              {selectedMetricKeys.map((m) => (
                <th
                  key={m}
                  onClick={() => handleSort(m)}
                  className="px-4 py-3 text-right font-bold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>
                      {getColName(m)} ({aggregation})
                    </span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
              ))}

              {primaryMetric && (
                <th className="px-4 py-3 text-left font-bold min-w-[120px]">Distribution</th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {pivotData.rows.map((row) => {
              const val = row[primaryMetric] || 0;
              const pct = Math.max(0, Math.min(100, Math.round((val / maxPrimaryVal) * 100)));

              return (
                <tr key={row._dimension} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-2.5 font-semibold text-slate-900 whitespace-nowrap">
                    {row._dimension}
                  </td>
                  <td className="px-4 py-2.5 text-right text-slate-600 whitespace-nowrap font-mono">
                    {row._count.toLocaleString()}
                  </td>
                  {selectedMetricKeys.map((m) => (
                    <td key={m} className="px-4 py-2.5 text-right font-semibold text-slate-800 whitespace-nowrap font-mono">
                      {formatValue(row[m], 'number')}
                    </td>
                  ))}
                  {primaryMetric && (
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono w-8">{pct}%</span>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>

          {/* Grand Total Footer */}
          <tfoot className="bg-slate-100/80 font-bold border-t-2 border-slate-300 text-slate-900">
            <tr>
              <td className="px-4 py-3 flex items-center gap-1.5">
                <Sigma className="w-3.5 h-3.5 text-indigo-600" />
                <span>Grand Total</span>
              </td>
              <td className="px-4 py-3 text-right font-mono">
                {pivotData.totals._count?.toLocaleString()}
              </td>
              {selectedMetricKeys.map((m) => (
                <td key={m} className="px-4 py-3 text-right font-mono text-indigo-900">
                  {formatValue(pivotData.totals[m], 'number')}
                </td>
              ))}
              {primaryMetric && <td className="px-4 py-3 text-xs text-slate-400 font-normal">100% total</td>}
            </tr>
          </tfoot>
        </table>
      </div>

    </div>
  );
};
