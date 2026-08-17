import React, { useState, useMemo } from 'react';
import { ColumnInfo, DbRecord } from '../types';
import { formatValue } from '../utils/dataProcessor';
import { deleteRecord } from '../services/dbService';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Search,
  Trash2,
  Edit2,
  Plus,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DatabaseRecordsTableProps {
  columns: ColumnInfo[];
  records: DbRecord[];
  onEditRecord: (record: DbRecord) => void;
  onOpenNewForm: () => void;
  onSeedDatabase: () => void;
}

export const DatabaseRecordsTable: React.FC<DatabaseRecordsTableProps> = ({
  columns,
  records,
  onEditRecord,
  onOpenNewForm,
  onSeedDatabase,
}) => {
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [localSearch, setLocalSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Available filters
  const categories = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.category) set.add(r.category);
    });
    return Array.from(set);
  }, [records]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.status) set.add(r.status);
    });
    return Array.from(set);
  }, [records]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string, orderId: string) => {
    if (window.confirm(`Are you sure you want to delete record ${orderId} from the database?`)) {
      try {
        setIsDeletingId(id);
        await deleteRecord(id);
      } catch (err: any) {
        console.error('Delete error:', err);
        alert(err?.message || 'Failed to delete record.');
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  // Filter & Sort records
  const processedRecords = useMemo(() => {
    let result = [...records];

    if (selectedCategory !== 'ALL') {
      result = result.filter((r) => r.category === selectedCategory);
    }

    if (selectedStatus !== 'ALL') {
      result = result.filter((r) => r.status === selectedStatus);
    }

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(
        (r) =>
          (r.orderId && r.orderId.toLowerCase().includes(q)) ||
          (r.product && r.product.toLowerCase().includes(q)) ||
          (r.region && r.region.toLowerCase().includes(q)) ||
          (r.category && r.category.toLowerCase().includes(q)) ||
          (r.customerName && r.customerName.toLowerCase().includes(q)) ||
          (r.status && r.status.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];

      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }

      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });

    return result;
  }, [records, selectedCategory, selectedStatus, localSearch, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(processedRecords.length / pageSize) || 1;
  const paginatedRecords = processedRecords.slice((page - 1) * pageSize, page * pageSize);

  const exportCurrentTableCsv = () => {
    const headers = [
      'Order ID',
      'Date',
      'Region',
      'Category',
      'Product',
      'Quantity',
      'Unit Price',
      'Total Sales',
      'Profit',
      'Status',
      'Customer',
      'Notes',
    ];

    const csvRows = processedRecords.map((r) =>
      [
        `"${r.orderId || ''}"`,
        `"${r.date || ''}"`,
        `"${r.region || ''}"`,
        `"${r.category || ''}"`,
        `"${(r.product || '').replace(/"/g, '""')}"`,
        r.quantity || 0,
        r.unitPrice || 0,
        r.totalSales || 0,
        r.profit || 0,
        `"${r.status || ''}"`,
        `"${(r.customerName || '').replace(/"/g, '""')}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    );

    const blob = new Blob([[headers.join(','), ...csvRows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `firestore_records_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6">
      {/* Table Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        
        {/* Left: Quick search & Category Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by order, product, client..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden"
          >
            <option value="ALL">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 font-medium ml-1">
            {processedRecords.length} records in Database
          </span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewForm}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Record</span>
          </button>

          {records.length === 0 && (
            <button
              onClick={onSeedDatabase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Seed Initial Database Data</span>
            </button>
          )}

          <button
            onClick={exportCurrentTableCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="Download database records as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl max-h-[520px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10">
            <tr>
              <th
                onClick={() => handleSort('orderId')}
                className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1">
                  <span>Order ID</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('date')}
                className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1">
                  <span>Date</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('region')}
                className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1">
                  <span>Region</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('category')}
                className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1">
                  <span>Category</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('product')}
                className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1">
                  <span>Product / Item</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('quantity')}
                className="px-3 py-3 text-right font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Qty</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('unitPrice')}
                className="px-3 py-3 text-right font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Unit Price</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('totalSales')}
                className="px-3 py-3 text-right font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Total Sales</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('profit')}
                className="px-3 py-3 text-right font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Profit</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th
                onClick={() => handleSort('status')}
                className="px-3 py-3 text-left font-bold cursor-pointer hover:bg-slate-100"
              >
                <div className="flex items-center gap-1">
                  <span>Status</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-400" />
                </div>
              </th>

              <th className="px-3 py-3 text-right font-bold text-slate-400">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-12 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Database className="w-8 h-8 text-slate-300" />
                    <span>No records found in database matching your criteria.</span>
                    <button
                      onClick={onOpenNewForm}
                      className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      + Create First Database Entry
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r) => {
                const isDelivered = r.status === 'Delivered';
                const isCancelled = r.status === 'Cancelled';
                const isProcessing = r.status === 'Processing';

                return (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {r.orderId}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{r.date}</td>
                    <td className="px-3 py-2.5 text-slate-700 whitespace-nowrap">{r.region}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                      {r.product}
                      {r.customerName && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          Client: {r.customerName}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-medium text-slate-800">
                      {r.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-600">
                      ${Number(r.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                      ${Number(r.totalSales || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-semibold text-emerald-700">
                      ${Number(r.profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-700'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-700'
                            : isProcessing
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditRecord(r)}
                          className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit Record"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.orderId)}
                          disabled={isDeletingId === r.id}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
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
