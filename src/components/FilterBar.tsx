import React from 'react';
import { ColumnInfo, FilterState } from '../types';
import { Search, RotateCcw, Filter, Calendar } from 'lucide-react';

interface FilterBarProps {
  columns: ColumnInfo[];
  filterState: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  columns,
  filterState,
  onFilterChange,
  onResetFilters,
}) => {
  const categoryColumns = columns.filter((c) => c.type === 'category' && c.categories && c.categories.length > 0);
  const dateColumns = columns.filter((c) => c.type === 'date');

  // Count active filters
  let activeFilterCount = 0;
  if (filterState.globalSearch.trim()) activeFilterCount++;
  Object.values(filterState.columnFilters).forEach((v) => {
    if (v && v !== 'ALL') activeFilterCount++;
  });
  if (filterState.dateRange?.start || filterState.dateRange?.end) activeFilterCount++;

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filterState,
      globalSearch: e.target.value,
    });
  };

  const handleColumnFilterChange = (columnKey: string, value: string) => {
    onFilterChange({
      ...filterState,
      columnFilters: {
        ...filterState.columnFilters,
        [columnKey]: value,
      },
    });
  };

  const handleDateChange = (type: 'start' | 'end', value: string, dateColKey: string) => {
    onFilterChange({
      ...filterState,
      dateRange: {
        columnKey: dateColKey,
        start: type === 'start' ? value : filterState.dateRange?.start || '',
        end: type === 'end' ? value : filterState.dateRange?.end || '',
      },
    });
  };

  return (
    <div className="bg-white rounded-xl p-3.5 border border-slate-200 shadow-xs mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        
        {/* Left: Global Search & Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
          
          {/* Global Search */}
          <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="filter-search-input"
              type="text"
              placeholder="Search table & charts..."
              value={filterState.globalSearch}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-colors"
            />
          </div>

          {/* Top Category Selectors (up to 3) */}
          {categoryColumns.slice(0, 3).map((col) => (
            <div key={col.key} className="flex items-center gap-1.5">
              <select
                id={`filter-select-${col.key}`}
                value={filterState.columnFilters[col.key] || 'ALL'}
                onChange={(e) => handleColumnFilterChange(col.key, e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                <option value="ALL">All {col.name}s</option>
                {col.categories?.map((cat) => (
                  <option key={cat.label} value={cat.label}>
                    {cat.label} ({cat.count})
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Date Range if present */}
          {dateColumns.length > 0 && (
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={filterState.dateRange?.start || ''}
                onChange={(e) => handleDateChange('start', e.target.value, dateColumns[0].key)}
                className="bg-transparent text-xs text-slate-700 focus:outline-hidden"
                title="Start Date"
              />
              <span className="text-slate-400">→</span>
              <input
                type="date"
                value={filterState.dateRange?.end || ''}
                onChange={(e) => handleDateChange('end', e.target.value, dateColumns[0].key)}
                className="bg-transparent text-xs text-slate-700 focus:outline-hidden"
                title="End Date"
              />
            </div>
          )}
        </div>

        {/* Right: Active Filter Counter & Reset */}
        <div className="flex items-center gap-2 shrink-0">
          {activeFilterCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
              <Filter className="w-3 h-3" />
              <span>{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</span>
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              id="filter-reset-btn"
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3 h-3 text-slate-500" />
              <span>Reset</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
