import React from 'react';
import { ColumnInfo } from '../types';
import { formatValue } from '../utils/dataProcessor';
import { Lightbulb, TrendingUp, AlertCircle, BarChart2, ShieldCheck } from 'lucide-react';

interface InsightsPanelProps {
  columns: ColumnInfo[];
  rows: Record<string, any>[];
  totalRows: number;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ columns, rows, totalRows }) => {
  const numericColumns = columns.filter((c) => c.type === 'number' && c.sum !== undefined);
  const categoryColumns = columns.filter((c) => c.type === 'category' && c.categories && c.categories.length > 0);

  // Generate automated highlights
  const topCategoryInsights = categoryColumns.slice(0, 3).map((col) => {
    const top = col.categories?.[0];
    const percentage = top ? Math.round((top.count / totalRows) * 100) : 0;
    return {
      column: col.name,
      topValue: top?.label || '',
      count: top?.count || 0,
      percentage,
    };
  });

  const numericInsights = numericColumns.slice(0, 3).map((col) => {
    return {
      column: col.name,
      sum: col.sum,
      avg: col.avg,
      max: col.max,
      min: col.min,
    };
  });

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      
      <div className="flex items-center gap-2 pb-4 border-b border-slate-100 mb-4">
        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
          <Lightbulb className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">Automated Data Insights & Highlights</h3>
          <p className="text-xs text-slate-500">Summary findings detected across this spreadsheet dataset</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        
        {/* Card 1: Dominant Categories */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <BarChart2 className="w-4 h-4 text-indigo-600" />
              <span>Category Distributions</span>
            </div>
            {topCategoryInsights.length > 0 ? (
              <div className="space-y-2.5 mt-3">
                {topCategoryInsights.map((item, idx) => (
                  <div key={idx} className="text-xs">
                    <div className="flex justify-between text-slate-600 mb-0.5">
                      <span className="font-medium truncate max-w-[150px]">{item.column}: <strong className="text-slate-900">{item.topValue}</strong></span>
                      <span className="text-slate-500 font-mono">{item.percentage}% ({item.count})</span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-indigo-600 h-1.5 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">No categorical distributions found.</p>
            )}
          </div>
        </div>

        {/* Card 2: Numeric Aggregates */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Key Metric Spans</span>
            </div>
            {numericInsights.length > 0 ? (
              <div className="space-y-2.5 mt-3">
                {numericInsights.map((item, idx) => (
                  <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200/80 text-xs">
                    <div className="font-semibold text-slate-900 truncate mb-1">{item.column}</div>
                    <div className="grid grid-cols-3 gap-1 text-[11px] text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px]">SUM</span>
                        <span className="font-mono font-medium">{formatValue(item.sum, 'number')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">AVG</span>
                        <span className="font-mono font-medium">{formatValue(item.avg, 'number')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">PEAK</span>
                        <span className="font-mono font-medium text-emerald-700">{formatValue(item.max, 'number')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">No numeric fields detected.</p>
            )}
          </div>
        </div>

        {/* Card 3: Data Integrity & Health */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Dataset Structure</span>
            </div>
            <div className="space-y-2 mt-3 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Total Analyzed Rows:</span>
                <span className="font-mono font-semibold text-slate-900">{totalRows.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Columns Identified:</span>
                <span className="font-mono font-semibold text-slate-900">{columns.length}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-500">Numeric Measures:</span>
                <span className="font-mono font-semibold text-slate-900">{numericColumns.length}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Categorical Dimensions:</span>
                <span className="font-mono font-semibold text-slate-900">{categoryColumns.length}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
