import React, { useState, useMemo } from 'react';
import { KilnRecord } from '../types';
import { deleteKilnRecord } from '../services/dbService';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  Edit3,
  Download,
  Plus,
  Flame,
  Filter,
  Sparkles,
  Layers,
} from 'lucide-react';

interface KilnRecordsTableProps {
  records: KilnRecord[];
  onEditRecord: (record: KilnRecord) => void;
  onOpenNewForm: () => void;
  onOpenImportModal?: () => void;
  onSeedDatabase: () => void;
}

export const KilnRecordsTable: React.FC<KilnRecordsTableProps> = ({
  records,
  onEditRecord,
  onOpenNewForm,
  onOpenImportModal,
  onSeedDatabase,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<keyof KilnRecord>('rowNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Distinct lists for filtering
  const operators = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.operator) set.add(r.operator);
    });
    return Array.from(set);
  }, [records]);

  const products = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.productType) set.add(r.productType);
    });
    return Array.from(set);
  }, [records]);

  const handleSort = (key: keyof KilnRecord) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string, rowNum?: number) => {
    if (window.confirm(`آیا از حذف ردیف ${rowNum || ''} از دیتابیس اطمینان دارید؟`)) {
      try {
        setIsDeletingId(id);
        await deleteKilnRecord(id);
      } catch (err: any) {
        alert('خطا در حذف ردیف: ' + err.message);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  // Filter and Sort
  const processedRecords = useMemo(() => {
    let result = [...records];

    if (selectedOperator !== 'ALL') {
      result = result.filter((r) => r.operator === selectedOperator);
    }

    if (selectedProduct !== 'ALL') {
      result = result.filter((r) => r.productType === selectedProduct);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          (r.operator && r.operator.toLowerCase().includes(q)) ||
          (r.productType && r.productType.toLowerCase().includes(q)) ||
          (r.productCode && r.productCode.toLowerCase().includes(q)) ||
          (r.inputCar && r.inputCar.toLowerCase().includes(q)) ||
          (r.outputCar && r.outputCar.toLowerCase().includes(q)) ||
          (r.date && r.date.toLowerCase().includes(q)) ||
          (r.rowNumber && String(r.rowNumber).includes(q))
      );
    }

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
  }, [records, selectedOperator, selectedProduct, search, sortKey, sortOrder]);

  const totalPages = Math.ceil(processedRecords.length / pageSize) || 1;
  const paginated = processedRecords.slice((page - 1) * pageSize, page * pageSize);

  const exportCsv = () => {
    const headers = [
      'ردیف',
      'تاریخ',
      'کد اپراتور',
      'اپراتور',
      'ساعت',
      'خام',
      'واگن ورودی',
      'کد محصول',
      'نوع محصول',
      'دمای اگزوز',
      'پیش گرما1',
      'پیش گرما2',
      'ترموستات',
      'زون0',
      'زون1',
      'زون2',
      'زون3',
      'زون4',
      'زون5',
      'زون6',
      'زون7',
      'رپید1',
      'رپید2',
      'باتوم A',
      'باتوم1',
      'باتوم B',
      'باتوم 2',
      'دمای واگن 44',
      'دمای لوله باتوم',
      'دمای لوله خشک کن',
      'زمان پوشینگ',
      'شماره واگن خروجی',
      'توضیحات',
    ];

    const rows = processedRecords.map((r) =>
      [
        r.rowNumber || '',
        `"${r.date || ''}"`,
        `"${r.operatorCode || ''}"`,
        `"${(r.operator || '').replace(/"/g, '""')}"`,
        `"${r.time || ''}"`,
        `"${(r.raw || '').replace(/"/g, '""')}"`,
        `"${r.inputCar || ''}"`,
        `"${r.productCode || ''}"`,
        `"${(r.productType || '').replace(/"/g, '""')}"`,
        r.exhaustTemp || 0,
        r.preHeat1 || 0,
        r.preHeat2 || 0,
        r.thermostat || 0,
        r.zone0 || 0,
        r.zone1 || 0,
        r.zone2 || 0,
        r.zone3 || 0,
        r.zone4 || 0,
        r.zone5 || 0,
        r.zone6 || 0,
        r.zone7 || 0,
        r.rapid1 || 0,
        r.rapid2 || 0,
        r.bottomA || 0,
        r.bottom1 || 0,
        r.bottomB || 0,
        r.bottom2 || 0,
        r.car44Temp || 0,
        r.bottomPipeTemp || 0,
        r.dryerPipeTemp || 0,
        `"${r.pushingTime || ''}"`,
        `"${r.outputCar || ''}"`,
        `"${(r.notes || '').replace(/"/g, '""')}"`,
      ].join(',')
    );

    const blob = new Blob(['\uFEFF' + [headers.join(','), ...rows].join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kiln_1400_database_export_${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs mb-6" dir="rtl">
      
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجو در اپراتور، محصول، واگن..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pr-9 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <select
            value={selectedOperator}
            onChange={(e) => {
              setSelectedOperator(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">همه اپراتورها</option>
            {operators.map((op) => (
              <option key={op} value={op}>
                {op}
              </option>
            ))}
          </select>

          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
          >
            <option value="ALL">همه محصولات</option>
            {products.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <span className="text-xs text-slate-500 mr-2">
            تعداد ردیف‌ها: <strong className="text-slate-800 font-mono">{processedRecords.length}</strong>
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewForm}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>ثبت ردیف جدید</span>
          </button>

          {onOpenImportModal && (
            <button
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
              title="ایمپورت مستقیم از شیت گوگل به دیتابیس"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>ایمپورت از شیت گوگل</span>
            </button>
          )}

          {records.length === 0 && (
            <button
              onClick={onSeedDatabase}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>ایجاد داده‌های نمونه کوره</span>
            </button>
          )}

          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            title="دانلود فایل خروجی اکسل / CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span>خروجی اکسل/CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-3 overflow-x-auto border border-slate-200 rounded-xl max-h-[550px] overflow-y-auto">
        <table className="min-w-full divide-y divide-slate-200 text-xs text-right">
          <thead className="bg-slate-50 text-slate-700 sticky top-0 z-10 select-none">
            <tr>
              <th onClick={() => handleSort('rowNumber')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                ردیف
              </th>
              <th onClick={() => handleSort('date')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                تاریخ / ساعت
              </th>
              <th onClick={() => handleSort('operator')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                اپراتور
              </th>
              <th onClick={() => handleSort('inputCar')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                واگن ورودی
              </th>
              <th onClick={() => handleSort('productType')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                محصول
              </th>
              <th onClick={() => handleSort('exhaustTemp')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                اگزوز
              </th>
              <th onClick={() => handleSort('preHeat1')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                پیش‌گرما ۱
              </th>
              <th onClick={() => handleSort('preHeat2')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                پیش‌گرما ۲
              </th>
              <th onClick={() => handleSort('zone0')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap bg-amber-50/70 text-amber-900">
                زون ۰
              </th>
              <th onClick={() => handleSort('zone2')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap bg-amber-50/70 text-amber-900">
                زون ۲
              </th>
              <th onClick={() => handleSort('zone4')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap bg-amber-100/70 text-amber-950">
                زون ۴
              </th>
              <th onClick={() => handleSort('zone5')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap bg-amber-100/70 text-amber-950">
                زون ۵
              </th>
              <th onClick={() => handleSort('zone7')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap bg-amber-50/70 text-amber-900">
                زون ۷
              </th>
              <th onClick={() => handleSort('rapid1')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                رپید ۱
              </th>
              <th onClick={() => handleSort('bottom1')} className="px-2 py-3 text-center font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                باتوم ۱
              </th>
              <th onClick={() => handleSort('outputCar')} className="px-3 py-3 font-bold cursor-pointer hover:bg-slate-100 whitespace-nowrap">
                واگن خروجی
              </th>
              <th className="px-3 py-3 text-center font-bold text-slate-400 whitespace-nowrap">
                عملیات
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={17} className="py-12 text-center text-slate-400 text-xs">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Flame className="w-8 h-8 text-amber-300" />
                    <span>هیچ ردیفی در دیتابیس کوره یافت نشد.</span>
                    <button
                      onClick={onOpenNewForm}
                      className="mt-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      + ثبت اولین داده در دیتابیس
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              paginated.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-3 py-2.5 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {r.rowNumber}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-mono text-slate-800">{r.date}</span>
                    <span className="block text-[10px] text-slate-400 font-mono">{r.time}</span>
                  </td>
                  <td className="px-3 py-2.5 font-medium text-slate-800 whitespace-nowrap">
                    {r.operator}
                    {r.operatorCode && (
                      <span className="text-[10px] text-slate-400 block font-mono">کد: {r.operatorCode}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 font-mono font-semibold text-slate-700 whitespace-nowrap">
                    {r.inputCar}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className="font-medium text-slate-900 block">{r.productType}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{r.productCode}</span>
                  </td>
                  <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.exhaustTemp}°</td>
                  <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.preHeat1}°</td>
                  <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.preHeat2}°</td>
                  <td className="px-2 py-2.5 text-center font-mono font-semibold bg-amber-50/40 text-amber-900">
                    {r.zone0}°
                  </td>
                  <td className="px-2 py-2.5 text-center font-mono font-semibold bg-amber-50/40 text-amber-900">
                    {r.zone2}°
                  </td>
                  <td className="px-2 py-2.5 text-center font-mono font-bold bg-amber-100/50 text-amber-900">
                    {r.zone4}°
                  </td>
                  <td className="px-2 py-2.5 text-center font-mono font-bold bg-amber-100/50 text-amber-900">
                    {r.zone5}°
                  </td>
                  <td className="px-2 py-2.5 text-center font-mono font-semibold bg-amber-50/40 text-amber-900">
                    {r.zone7}°
                  </td>
                  <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.rapid1}°</td>
                  <td className="px-2 py-2.5 text-center font-mono text-slate-600">{r.bottom1}°</td>
                  <td className="px-3 py-2.5 font-mono text-slate-700 whitespace-nowrap">{r.outputCar}</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditRecord(r)}
                        className="p-1 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                        title="ویرایش ردیف"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(r.id, r.rowNumber)}
                        disabled={isDeletingId === r.id}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                        title="حذف ردیف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500">تعداد ردیف در صفحه:</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1"
          >
            <option value={10}>10</option>
            <option value={15}>15</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono">
            صفحه {page} از {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
