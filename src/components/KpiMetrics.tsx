import React from 'react';
import { ColumnInfo } from '../types';
import { formatValue } from '../utils/dataProcessor';
import { Hash, TrendingUp, DollarSign, Layers, CheckCircle2, Award } from 'lucide-react';

interface KpiMetricsProps {
  columns: ColumnInfo[];
  totalRows: number;
  filteredRowsCount: number;
  rows: Record<string, any>[];
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  columns,
  totalRows,
  filteredRowsCount,
}) => {
  const numericColumns = columns.filter((c) => c.type === 'number' && c.sum !== undefined);
  const categoryColumns = columns.filter((c) => c.type === 'category');
  
  // Pick primary numeric columns (up to 3)
  const primaryNumeric = numericColumns.slice(0, 3);
  
  // Calculate total cell completeness
  const totalCells = columns.length * (filteredRowsCount || 1);
  const totalNulls = columns.reduce((acc, c) => acc + (c.nullCount || 0), 0);
  const completeness = Math.max(0, Math.min(100, Math.round(((totalCells - totalNulls) / totalCells) * 100)));

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      
      {/* KPI 1: Record Count */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records</span>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Hash className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900">{filteredRowsCount.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {filteredRowsCount !== totalRows ? `Filtered from ${totalRows.toLocaleString()} total` : `${columns.length} columns analyzed`}
          </p>
        </div>
      </div>

      {/* KPI 2 & 3: Primary Numeric Totals */}
      {primaryNumeric.length > 0 ? (
        primaryNumeric.map((col, idx) => {
          const isCurrency = col.name.toLowerCase().includes('price') ||
                            col.name.toLowerCase().includes('sales') ||
                            col.name.toLowerCase().includes('revenue') ||
                            col.name.toLowerCase().includes('profit') ||
                            col.name.toLowerCase().includes('cost') ||
                            col.name.toLowerCase().includes('amount') ||
                            col.name.toLowerCase().includes('total');

          return (
            <div key={col.key} className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[120px]" title={col.name}>
                  {col.name} (Sum)
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  idx === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'
                }`}>
                  {isCurrency ? <DollarSign className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold text-slate-900 truncate">
                  {formatValue(col.sum, 'number')}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                  <span>Avg: {formatValue(col.avg, 'number')}</span>
                  <span>Max: {formatValue(col.max, 'number')}</span>
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Categories</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900">{categoryColumns.length}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Discrete categorical dimensions</p>
          </div>
        </div>
      )}

      {/* KPI 4: Completeness & Quality */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Data Health</span>
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            {completeness >= 90 ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Award className="w-4 h-4" />}
          </div>
        </div>
        <div className="mt-3">
          <div className="text-2xl font-bold text-slate-900">{completeness}%</div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {totalNulls === 0 ? 'No empty cells detected' : `${totalNulls} empty cells across dataset`}
          </p>
        </div>
      </div>

    </div>
  );
};
