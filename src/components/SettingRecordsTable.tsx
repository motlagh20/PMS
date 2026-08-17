import React, { useState, useMemo } from 'react';
import { SettingRecord } from '../types';
import {
  Search,
  Download,
  Filter,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Truck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SettingRecordsTableProps {
  records: SettingRecord[];
  onEdit: (record: SettingRecord) => void;
  onDelete: (id: string) => Promise<void>;
}

export const SettingRecordsTable: React.FC<SettingRecordsTableProps> = ({
  records,
  onEdit,
  onDelete,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedChamber, setSelectedChamber] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (selectedMonth !== 'all' && r.month !== selectedMonth) return false;
      if (selectedChamber !== 'all' && String(r.chamberNumber) !== selectedChamber) return false;
      if (selectedShift !== 'all' && r.shift !== selectedShift) return false;

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const str = `${r.rowNumber || ''} ${r.date || ''} ${r.operatorName || ''} ${r.shiftSupervisor || ''} ${r.product || ''} ${r.chamberNumber || ''} ${r.car1_number || ''} ${r.car2_number || ''}`.toLowerCase();
        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [records, selectedMonth, selectedChamber, selectedShift, searchTerm]);

  const totalPages = Math.ceil(filteredRecords.length / pageSize) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  const handleExportExcel = () => {
    const exportData = filteredRecords.map((r, i) => ({
      ردیف: r.rowNumber || i + 1,
      تاریخ: r.date,
      ماه: r.month,
      روز: r.day,
      شیفت: r.shift,
      سرشیفت: r.shiftSupervisor,
      'نام اپراتور': r.operatorName,
      'تعداد پرسنل': r.personnelCount,
      'شماره چمبر': r.chamberNumber,
      محصول: r.product,
      'تعداد فینگر': r.fingerCount,
      'تعداد ستون': r.columnCount,

      'شماره واگن ۱': r.car1_number,
      'لعاب/خودرنگ ۱': r.car1_glazeType,
      'زمان شروع ۱': r.car1_startTime,
      'زمان پایان ۱': r.car1_endTime,
      'تعداد بسته ۱': r.car1_packageCount,
      'تعداد خشت ۱': r.car1_brickCount,
      'تعداد کل سفال ۱': r.car1_totalTileCount,

      'شماره واگن ۲': r.car2_number,
      'لعاب/خودرنگ ۲': r.car2_glazeType,
      'زمان شروع ۲': r.car2_startTime,
      'زمان پایان ۲': r.car2_endTime,
      'تعداد بسته ۲': r.car2_packageCount,
      'تعداد خشت ۲': r.car2_brickCount,
      'تعداد کل سفال ۲': r.car2_totalTileCount,

      'شماره واگن ۳': r.car3_number,
      'لعاب/خودرنگ ۳': r.car3_glazeType,
      'زمان شروع ۳': r.car3_startTime,
      'زمان پایان ۳': r.car3_endTime,
      'تعداد بسته ۳': r.car3_packageCount,
      'تعداد خشت ۳': r.car3_brickCount,
      'تعداد کل سفال ۳': r.car3_totalTileCount,

      'شماره واگن ۴': r.car4_number,
      'لعاب/خودرنگ ۴': r.car4_glazeType,
      'زمان شروع ۴': r.car4_startTime,
      'زمان پایان ۴': r.car4_endTime,
      'تعداد بسته ۴': r.car4_packageCount,
      'تعداد خشت ۴': r.car4_brickCount,
      'تعداد کل سفال ۴': r.car4_totalTileCount,

      'ضایعات ماشین آلات': r.machineWaste,
      'ضایعات خشک کن': r.dryerWaste,
      'صحت اعداد': r.validationStatus,
      'تعداد کل خشت بسته بندی شده': r.totalPackagedBricks,
      'تعداد خشت داخل چمبر': r.totalBricksInChamber,
      'راندمان پرس و ستینگ': r.pressSettingEfficiency,
      'راندمان خشک کن': r.dryerEfficiency,
      'راندمان نهایی چمبر': r.chamberFinalEfficiency,
      'وضعیت راندمان': r.pressDryerStatus,
      'وضعیت عملکرد خشک کن': r.dryerPerformanceStatus,
      'عملکرد کلی تا ورودی کوره': r.overallKilnInletPerformance,
      'بازده زمانی تخلیه': r.chamberUnloadTimeEfficiency,
      یادداشت: r.notes,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    XLSX.writeFile(wb, `Set_1400_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleDeleteClick = async (id: string) => {
    if (window.confirm('آیا از حذف این رکورد ستینگ اطمینان دارید؟')) {
      setDeletingId(id);
      try {
        await onDelete(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-right" dir="rtl">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search */}
          <div className="relative min-w-[200px] max-w-xs">
            <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در اپراتور، محصول، واگن، چمبر..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl focus:border-teal-500 outline-hidden"
            />
          </div>

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-teal-500 outline-hidden"
          >
            <option value="all">همه ماه‌ها</option>
            {months.map((m) => (
              <option key={m} value={m}>
                ماه: {m}
              </option>
            ))}
          </select>

          {/* Chamber Filter */}
          <select
            value={selectedChamber}
            onChange={(e) => {
              setSelectedChamber(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-teal-500 outline-hidden"
          >
            <option value="all">همه چمبرها</option>
            {chambers.map((c) => (
              <option key={c} value={c}>
                چمبر {c}
              </option>
            ))}
          </select>

          {/* Shift Filter */}
          <select
            value={selectedShift}
            onChange={(e) => {
              setSelectedShift(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-teal-500 outline-hidden"
          >
            <option value="all">همه شیفت‌ها</option>
            <option value="صبح">صبح</option>
            <option value="عصر">عصر</option>
            <option value="شب">شب</option>
          </select>
        </div>

        {/* Export & Count */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            تعداد رکوردها: <strong className="text-slate-800 font-mono">{filteredRecords.length.toLocaleString('fa-IR')}</strong>
          </span>
          <button
            onClick={handleExportExcel}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>خروجی اکسل (Set_1400)</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-right whitespace-nowrap">
          <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
            <tr>
              <th className="p-3 text-center">ردیف</th>
              <th className="p-3">تاریخ / روز</th>
              <th className="p-3">ماه</th>
              <th className="p-3">شیفت</th>
              <th className="p-3">اپراتور / سرشیفت</th>
              <th className="p-3">چمبر</th>
              <th className="p-3">محصول</th>
              <th className="p-3 text-center">تعداد فینگر</th>
              <th className="p-3">واگن ۱</th>
              <th className="p-3">واگن ۲</th>
              <th className="p-3">واگن ۳</th>
              <th className="p-3">واگن ۴</th>
              <th className="p-3 text-center">کل خشت بسته‌بندی</th>
              <th className="p-3 text-center">ضایعات</th>
              <th className="p-3 text-center">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-600">
            {paginatedRecords.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-8 text-center text-slate-400">
                  هیچ رکوردی یافت نشد. می‌توانید داده‌های جدید ثبت کنید یا از فایل اکسل/شیت ایمپورت فرمایید.
                </td>
              </tr>
            ) : (
              paginatedRecords.map((r, idx) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center font-mono font-bold text-slate-700 bg-slate-50/50">
                    {r.rowNumber || (currentPage - 1) * pageSize + idx + 1}
                  </td>
                  <td className="p-3 font-mono">
                    <div>{r.date}</div>
                    <div className="text-[10px] text-slate-400">{r.day}</div>
                  </td>
                  <td className="p-3 font-medium text-slate-800">{r.month}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        r.shift === 'صبح'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : r.shift === 'عصر'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}
                    >
                      {r.shift}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-800">{r.operatorName}</div>
                    {r.shiftSupervisor && <div className="text-[10px] text-slate-400">سرشیفت: {r.shiftSupervisor}</div>}
                  </td>
                  <td className="p-3">
                    <span className="bg-teal-50 text-teal-800 border border-teal-200 font-mono font-bold px-2 py-0.5 rounded-md text-xs">
                      چمبر {r.chamberNumber}
                    </span>
                  </td>
                  <td className="p-3 max-w-[140px] truncate text-slate-700">{r.product}</td>
                  <td className="p-3 text-center font-mono font-bold text-teal-700">
                    {Number(r.fingerCount || 0).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <div>{r.car1_number || '-'}</div>
                    <div className="text-[10px] text-slate-400">{r.car1_packageCount ? `${r.car1_packageCount} بسته` : ''}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <div>{r.car2_number || '-'}</div>
                    <div className="text-[10px] text-slate-400">{r.car2_packageCount ? `${r.car2_packageCount} بسته` : ''}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <div>{r.car3_number || '-'}</div>
                    <div className="text-[10px] text-slate-400">{r.car3_packageCount ? `${r.car3_packageCount} بسته` : ''}</div>
                  </td>
                  <td className="p-3 font-mono text-[11px]">
                    <div>{r.car4_number || '-'}</div>
                    <div className="text-[10px] text-slate-400">{r.car4_packageCount ? `${r.car4_packageCount} بسته` : ''}</div>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-800">
                    {Number(r.totalPackagedBricks || 0).toLocaleString('fa-IR')}
                  </td>
                  <td className="p-3 text-center font-mono text-[11px] text-rose-600">
                    {r.machineWaste || r.dryerWaste ? `${(r.machineWaste || 0) + (r.dryerWaste || 0)}` : '0'}
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onEdit(r)}
                        className="p-1.5 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all"
                        title="ویرایش رکورد"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(r.id)}
                        disabled={deletingId === r.id}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all disabled:opacity-50"
                        title="حذف رکورد"
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
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 bg-slate-50/50">
          <div>
            صفحه <strong className="font-mono">{currentPage}</strong> از{' '}
            <strong className="font-mono">{totalPages}</strong>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-40 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
