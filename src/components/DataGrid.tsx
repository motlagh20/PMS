import React, { useState, useMemo } from 'react';
import { ColumnInfo } from '../types';
import { formatValue } from '../utils/dataProcessor';
import { ArrowUpDown, ChevronLeft, ChevronRight, Eye, Download, Search, Check } from 'lucide-react';

interface DataGridProps {
  columns: ColumnInfo[];
  rows: Record<string, any>[];
  totalRawRows: number;
}

export const DataGrid: React.FC<DataGridProps> = ({ columns, rows, totalRawRows }) => {
  const [sortKey, setSortKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [visibleColKeys, setVisibleColKeys] = useState<string[]>(columns.map((c) => c.key));
  const [showColPicker, setShowColPicker] = useState<boolean>(false);
  const [localSearch, setLocalSearch] = useState<string>('');

  // Keep visible columns synchronized if columns change
  React.useEffect(() => {
    setVisibleColKeys(columns.map((c) => c.key));
  }, [columns]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey('');
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const toggleColumnVisibility = (key: string) => {
    if (visibleColKeys.includes(key)) {
      if (visibleColKeys.length > 1) {
        setVisibleColKeys(visibleColKeys.filter((k) => k !== key));
      }
    } else {
      setVisibleColKeys([...visibleColKeys, key]);
    }
  };

  // Filter & Sort
  const processedRows = useMemo(() => {
    let result = [...rows];

    // Local table search
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter((row) =>
        columns.some((col) => {
          const val = row[col.key];
          return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortKey) {
      const colInfo = columns.find((c) => c.key === sortKey);
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];

        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;

        if (colInfo?.type === 'number') {
          return sortOrder === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
        }

        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    return result;
  }, [rows, localSearch, sortKey, sortOrder, columns]);

  // Pagination
  const totalPages = Math.ceil(processedRows.length / pageSize) || 1;
  const paginatedRows = processedRows.slice((page - 1) * pageSize, page * pageSize);

  const activeColumns = columns.filter((c) => visibleColKeys.includes(c.key));

  const exportCurrentTableCsv = () => {
    const headers = activeColumns.map((c) => `"${c.name}"`).join(',');
    const csvRows = processedRows.map((row) =>
      activeColumns
        .map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return '""';
          return `"${String(val).replace(/"/g, '""')}"`;
        })
        .join(',')
    );

    const blob = new Blob([[headers, ...csvRows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sheet_data_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        
        {/* Left: Quick search */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search table rows..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {processedRows.length} of {totalRawRows} rows
          </span>
        </div>

        {/* Right: Column Visibility & Export */}
        <div className="flex items-center gap-2 relative">
          
          {/* Column Visibility Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColPicker(!showColPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-600" />
              <span>Columns ({activeColumns.length}/{columns.length})</span>
            </button>

            {showColPicker && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-20 p-2 max-h-64 overflow-y-auto">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
                  Toggle Columns
                </div>
                {columns.map((col) => {
                  const isChecked = visibleColKeys.includes(col.key);
                  return (
                    <label
                      key={col.key}
                      className="flex items-center justify-between px-2 py-1.5 text-xs hover:bg-slate-50 rounded-lg cursor-pointer"
                    >
                      <span className="text-slate-800 truncate pr-2">{col.name}</span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleColumnVisibility(col.key)}
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={exportCurrentTableCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Download table as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>CSV</span>
          </button>

        </div>

      </div>

      {/* Grid Container */}
      <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl max-h-[500px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-3 text-left font-bold text-slate-400 w-12">#</th>
              {activeColumns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 py-3 text-left font-bold cursor-pointer transition-colors hover:bg-slate-100 whitespace-nowrap ${
                      col.type === 'number' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div className={`flex items-center gap-1.5 ${col.type === 'number' ? 'justify-end' : 'justify-start'}`}>
                      <span>{col.name}</span>
                      <ArrowUpDown className={`w-3 h-3 ${isSorted ? 'text-indigo-600 font-bold' : 'text-slate-400'}`} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={activeColumns.length + 1} className="py-12 text-center text-slate-400 text-xs">
                  No records match the current filter or search criteria.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => {
                const rowNum = (page - 1) * pageSize + idx + 1;
                return (
                  <tr key={row._id || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px]">{rowNum}</td>
                    {activeColumns.map((col) => {
                      const val = row[col.key];

                      return (
                        <td
                          key={col.key}
                          className={`px-4 py-2.5 whitespace-nowrap ${
                            col.type === 'number'
                              ? 'text-right font-mono font-medium text-slate-800'
                              : 'text-left text-slate-700'
                          }`}
                        >
                          {col.type === 'category' && val ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800">
                              {String(val)}
                            </span>
                          ) : col.type === 'boolean' ? (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                                val ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {val ? 'True' : 'False'}
                            </span>
                          ) : (
                            formatValue(val, col.type)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
        
        <div className="flex items-center gap-2">
          <span className="text-slate-500">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1 focus:outline-hidden"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
