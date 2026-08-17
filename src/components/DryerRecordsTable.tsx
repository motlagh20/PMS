import React, { useState, useMemo } from 'react';
import { DryerRecord } from '../types';
import { deleteDryerRecord } from '../services/dbService';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Trash2,
  Edit3,
  Download,
  Plus,
  Filter,
  FileSpreadsheet,
  Building2,
  Boxes,
  Clock,
  User,
  Calendar,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DryerRecordsTableProps {
  records: DryerRecord[];
  onEditRecord: (record: DryerRecord) => void;
  onOpenNewForm: () => void;
  onOpenImportModal?: () => void;
  onSeedDatabase: () => void;
}

export const DryerRecordsTable: React.FC<DryerRecordsTableProps> = ({
  records,
  onEditRecord,
  onOpenNewForm,
  onOpenImportModal,
  onSeedDatabase,
}) => {
  const [search, setSearch] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('ALL');
  const [selectedChamber, setSelectedChamber] = useState<string>('ALL');
  const [selectedProduction, setSelectedProduction] = useState<string>('ALL');
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [sortKey, setSortKey] = useState<keyof DryerRecord>('rowNumber');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(20);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Filter options
  const months = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.month) set.add(r.month);
    });
    return Array.from(set);
  }, [records]);

  const chambers = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.chamberNumber) set.add(String(r.chamberNumber));
    });
    return Array.from(set).sort((a, b) => Number(a) - Number(b));
  }, [records]);

  const productions = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      const prod = r.productionType || r.productType;
      if (prod) set.add(prod);
    });
    return Array.from(set);
  }, [records]);

  const operators = useMemo(() => {
    const set = new Set<string>();
    records.forEach((r) => {
      if (r.loadingOperator) set.add(r.loadingOperator);
      if (r.unloadingOperator) set.add(r.unloadingOperator);
      if (r.operator) set.add(r.operator);
    });
    return Array.from(set);
  }, [records]);

  const handleSort = (key: keyof DryerRecord) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string, rowNum?: number) => {
    if (window.confirm(`آیا از حذف رکورد ردیف ${rowNum || ''} چمبر خشک‌کن از دیتابیس اطمینان دارید؟`)) {
      try {
        setIsDeletingId(id);
        await deleteDryerRecord(id);
      } catch (err: any) {
        alert('خطا در حذف ردیف: ' + err.message);
      } finally {
        setIsDeletingId(null);
      }
    }
  };

  // Filtered and Sorted Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        search === '' ||
        String(r.rowNumber).includes(search) ||
        (r.month && r.month.includes(search)) ||
        (r.loadDateSolar && r.loadDateSolar.includes(search)) ||
        (r.loadDateTimeGregorian && r.loadDateTimeGregorian.toLowerCase().includes(search.toLowerCase())) ||
        String(r.chamberNumber).includes(search) ||
        String(r.fingerCount).includes(search) ||
        (r.loadingOperator && r.loadingOperator.includes(search)) ||
        (r.productionType && r.productionType.includes(search)) ||
        (r.unloadDateTimeSolar && r.unloadDateTimeSolar.includes(search)) ||
        (r.unloadDateTimeGregorian && r.unloadDateTimeGregorian.toLowerCase().includes(search.toLowerCase())) ||
        (r.unloadingOperator && r.unloadingOperator.includes(search)) ||
        (r.duration && r.duration.includes(search));

      const matchMonth = selectedMonth === 'ALL' || r.month === selectedMonth;
      const matchChamber = selectedChamber === 'ALL' || String(r.chamberNumber) === selectedChamber;
      const matchProduction =
        selectedProduction === 'ALL' || (r.productionType || r.productType) === selectedProduction;
      const matchOperator =
        selectedOperator === 'ALL' ||
        r.loadingOperator === selectedOperator ||
        r.unloadingOperator === selectedOperator ||
        r.operator === selectedOperator;

      return matchSearch && matchMonth && matchChamber && matchProduction && matchOperator;
    });
  }, [records, search, selectedMonth, selectedChamber, selectedProduction, selectedOperator]);

  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      let valA: any = a[sortKey];
      let valB: any = b[sortKey];

      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return sortOrder === 'asc'
        ? String(valA).localeCompare(String(valB), 'fa')
        : String(valB).localeCompare(String(valA), 'fa');
    });
  }, [filteredRecords, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedRecords.slice(start, start + pageSize);
  }, [sortedRecords, page, pageSize]);

  // Export to Excel matching exact column layout
  const handleExportExcel = () => {
    const exportData = sortedRecords.map((r) => ({
      ردیف: r.rowNumber || '',
      ماه: r.month || '',
      'تاریخ بارگیری شمسی': r.loadDateSolar || r.date || '',
      'تاریخ و زمان بارگیری میلادی': r.loadDateTimeGregorian || '',
      'شماره چمبر': r.chamberNumber || '',
      'تعداد فینگر تولیدی': r.fingerCount || r.inputQuantity || 0,
      'اپراتور بارگیری': r.loadingOperator || r.operator || '',
      'نوع تولید': r.productionType || r.productType || '',
      'تاریخ و زمان تخلیه شمسی': r.unloadDateTimeSolar || '',
      'تاریخ وزمان تخلیه میلادی': r.unloadDateTimeGregorian || '',
      'اپراتور تخلیه': r.unloadingOperator || '',
      'مدت زمان': r.duration || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Entry');
    XLSX.writeFile(wb, `dryer-1400_Data_Entry_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // KPIs
  const totalFingers = useMemo(() => {
    return records.reduce((sum, r) => sum + (Number(r.fingerCount) || Number(r.inputQuantity) || 0), 0);
  }, [records]);

  const activeChambersCount = useMemo(() => {
    return new Set(records.map((r) => String(r.chamberNumber))).size;
  }, [records]);

  return (
    <div className="space-y-4 text-right" dir="rtl">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>کل رکوردهای ثبت‌شده</span>
            <Building2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-slate-900">{records.length.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">شیت Data Entry</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>مجموع فینگر تولیدی</span>
            <Boxes className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-bold text-indigo-900">{totalFingers.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-indigo-600 mt-0.5">قطعه کاشی بارگیری‌شده</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>چمبرهای فعال</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-emerald-800">{activeChambersCount.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-emerald-600 mt-0.5">شماره چمبر ثبت‌شده</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>اپراتورهای شیفت</span>
            <User className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-bold text-sky-900">{operators.length.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-sky-600 mt-0.5">بارگیری و تخلیه</div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, and Buttons */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="جستجو بر اساس ردیف، ماه، چمبر، اپراتور، نوع تولید..."
              className="w-full pr-9 pl-4 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50/50"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            {onOpenImportModal && (
              <button
                onClick={onOpenImportModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                <span>ایمپورت از شیت گوگل / اکسل</span>
              </button>
            )}

            <button
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>خروجی اکسل</span>
            </button>

            <button
              onClick={onOpenNewForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 rounded-xl shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>ثبت ردیف جدید چمبر</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">فیلتر ماه:</label>
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="ALL">تمام ماه‌ها ({records.length})</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">فیلتر چمبر:</label>
            <select
              value={selectedChamber}
              onChange={(e) => {
                setSelectedChamber(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="ALL">همه چمبرها</option>
              {chambers.map((c) => (
                <option key={c} value={c}>
                  چمبر {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">نوع تولید:</label>
            <select
              value={selectedProduction}
              onChange={(e) => {
                setSelectedProduction(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="ALL">همه انواع تولید</option>
              {productions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">اپراتور:</label>
            <select
              value={selectedOperator}
              onChange={(e) => {
                setSelectedOperator(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
            >
              <option value="ALL">همه اپراتورها</option>
              {operators.map((op) => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200 select-none">
              <tr>
                <th
                  onClick={() => handleSort('rowNumber')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors w-14 text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>ردیف</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('month')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>ماه</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('loadDateSolar')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>تاریخ بارگیری شمسی</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">
                  <span>تاریخ و زمان بارگیری میلادی</span>
                </th>
                <th
                  onClick={() => handleSort('chamberNumber')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>شماره چمبر</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fingerCount')}
                  className="py-3 px-3 cursor-pointer hover:bg-slate-200/60 transition-colors text-center font-extrabold text-indigo-950"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>تعداد فینگر</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">
                  <span>اپراتور بارگیری</span>
                </th>
                <th className="py-3 px-3">
                  <span>نوع تولید</span>
                </th>
                <th className="py-3 px-3">
                  <span>تخلیه شمسی</span>
                </th>
                <th className="py-3 px-3">
                  <span>تخلیه میلادی</span>
                </th>
                <th className="py-3 px-3">
                  <span>اپراتور تخلیه</span>
                </th>
                <th className="py-3 px-3">
                  <span>مدت زمان</span>
                </th>
                <th className="py-3 px-3 text-center w-20">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {paginatedRecords.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    {records.length === 0 ? (
                      <div className="space-y-3">
                        <p className="text-sm">هیچ داده‌ای در جدول چمبر خشک‌کن موجود نیست.</p>
                        <button
                          onClick={onSeedDatabase}
                          className="px-4 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl"
                        >
                          بارگذاری داده‌های نمونه چمبر خشک‌کن
                        </button>
                      </div>
                    ) : (
                      'هیچ رکوردی مطابق با فیلترها و عبارت جستجو شده یافت نشد.'
                    )}
                  </td>
                </tr>
              ) : (
                paginatedRecords.map((r, index) => (
                  <tr key={r.id || index} className="hover:bg-amber-50/30 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-700">{r.rowNumber || index + 1}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{r.month || 'مرداد'}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{r.loadDateSolar || r.date || '—'}</td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {r.loadDateTimeGregorian || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold text-[11px] border border-amber-200">
                        چمبر {r.chamberNumber}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center font-extrabold text-indigo-900">
                      {(r.fingerCount || r.inputQuantity || 0).toLocaleString('fa-IR')}
                    </td>
                    <td className="py-2.5 px-3 text-slate-900">{r.loadingOperator || r.operator || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">{r.productionType || r.productType || '—'}</span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                      {r.unloadDateTimeSolar || '—'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {r.unloadDateTimeGregorian || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{r.unloadingOperator || '—'}</td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {r.duration || '—'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditRecord(r)}
                          title="ویرایش ردیف"
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={isDeletingId === r.id}
                          onClick={() => handleDelete(r.id, r.rowNumber)}
                          title="حذف ردیف"
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors disabled:opacity-30"
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

        {/* Pagination Bar */}
        {sortedRecords.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              نمایش {(page - 1) * pageSize + 1} تا {Math.min(page * pageSize, sortedRecords.length)} از{' '}
              {sortedRecords.length} ردیف
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <span className="font-bold px-2">
                صفحه {page} از {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
