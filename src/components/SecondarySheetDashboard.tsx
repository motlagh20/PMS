import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  FileSpreadsheet,
  RefreshCw,
  PlusCircle,
  Download,
  Search,
  ExternalLink,
  Table as TableIcon,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Database,
  Trash2,
  Edit2,
  Filter,
  Eye,
  Layers,
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Hash,
  LogIn,
} from 'lucide-react';
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  fetchSpreadsheetMetadata,
  fetchSheetValues,
} from '../services/sheetsApi';
import {
  SECONDARY_SPREADSHEET_ID,
  SECONDARY_COLLECTION_NAME,
  subscribeToGenericCollection,
  addGenericRecord,
  updateGenericRecord,
  deleteGenericRecord,
  importGenericRecordsBatch,
} from '../services/dbService';
import { SheetMetadata, ColumnInfo, ChartType, AggregationType } from '../types';
import { processRawSheetData, formatValue, aggregateChartData } from '../utils/dataProcessor';

interface SecondarySheetDashboardProps {
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  showToast: (msg: string) => void;
}

const COLOR_PALETTE = ['#059669', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#6366f1'];

export const SecondarySheetDashboard: React.FC<SecondarySheetDashboardProps> = ({
  user,
  accessToken,
  onSignIn,
  showToast,
}) => {
  const spreadsheetId = SECONDARY_SPREADSHEET_ID;
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit?usp=sharing`;

  // Firestore Database Records
  const [dbRecords, setDbRecords] = useState<(Record<string, any> & { id: string })[]>([]);
  const [isDbLoading, setIsDbLoading] = useState<boolean>(true);

  // Google Sheets Metadata & Tabs
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [selectedSheetTab, setSelectedSheetTab] = useState<string>('');
  const [isSheetLoading, setIsSheetLoading] = useState<boolean>(false);
  const [sheetError, setSheetError] = useState<string | null>(null);

  // Raw Google Sheet Data
  const [sheetColumns, setSheetColumns] = useState<ColumnInfo[]>([]);
  const [sheetRawRows, setSheetRawRows] = useState<any[][]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);

  // UI Active View: 'table' | 'analytics' | 'form'
  const [currentView, setCurrentView] = useState<'table' | 'analytics'>('table');

  // Search, Sort & Pagination for Table
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortKey, setSortKey] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);

  // Modal / Form state for Add/Edit Record
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingDoc, setEditingDoc] = useState<(Record<string, any> & { id: string }) | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Chart configuration
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [xAxisKey, setXAxisKey] = useState<string>('');
  const [yAxisKey, setYAxisKey] = useState<string>('');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');

  // Import Progress
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // 1. Subscribe to Firestore collection for this secondary sheet
  useEffect(() => {
    setIsDbLoading(true);
    const unsubscribe = subscribeToGenericCollection(
      SECONDARY_COLLECTION_NAME,
      (records) => {
        setDbRecords(records);
        setIsDbLoading(false);
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setIsDbLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Fetch Google Sheet structure when accessToken is available
  useEffect(() => {
    if (accessToken) {
      loadSheetMetadata();
    }
  }, [accessToken]);

  const loadSheetMetadata = async () => {
    if (!accessToken) return;
    setIsSheetLoading(true);
    setSheetError(null);
    try {
      const meta = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
      setMetadata(meta);
      if (meta.sheets && meta.sheets.length > 0) {
        const firstTab = meta.sheets[0].title;
        setSelectedSheetTab(firstTab);
        await loadSheetData(firstTab);
      }
    } catch (err: any) {
      console.error('Failed to load metadata for sheet 2:', err);
      setSheetError(err.message || 'عدم دسترسی به شیت گوگل. لطفاً وارد حساب شوید.');
    } finally {
      setIsSheetLoading(false);
    }
  };

  const loadSheetData = async (tabName: string) => {
    if (!accessToken) return;
    setIsSheetLoading(true);
    try {
      const data = await fetchSheetValues(spreadsheetId, tabName, accessToken);
      setSheetHeaders(data.headers);
      setSheetRawRows(data.rows);

      // Parse columns
      const parsed = processRawSheetData(data.headers, data.rows, tabName, spreadsheetId, metadata?.title || 'Sheet 2');
      setSheetColumns(parsed.columns);

      // Default charts keys
      if (parsed.columns.length > 0) {
        const catCol = parsed.columns.find((c) => c.type === 'category' || c.type === 'text' || c.type === 'date') || parsed.columns[0];
        const numCol = parsed.columns.find((c) => c.type === 'number') || parsed.columns[1] || parsed.columns[0];
        setXAxisKey(catCol.key);
        setYAxisKey(numCol.key);
      }
    } catch (err: any) {
      console.error('Failed to load sheet rows:', err);
      setSheetError(err.message);
    } finally {
      setIsSheetLoading(false);
    }
  };

  // Derive all active columns (either from Google Sheet or inferred from Firestore documents)
  const columns: ColumnInfo[] = useMemo(() => {
    if (sheetColumns.length > 0) {
      return sheetColumns;
    }
    // Fallback: Infer columns from Firestore records if any
    if (dbRecords.length > 0) {
      const sample = dbRecords[0];
      const keys = Object.keys(sample).filter((k) => k !== 'id' && k !== 'createdAt' && k !== 'updatedAt');
      return keys.map((k) => ({
        key: k,
        name: k.replace(/_/g, ' '),
        type: typeof sample[k] === 'number' ? 'number' : 'text',
        sampleValues: dbRecords.slice(0, 3).map((r) => r[k]),
        distinctCount: new Set(dbRecords.map((r) => r[k])).size,
        nullCount: 0,
      }));
    }
    // Default initial template columns
    return [
      { key: 'item_code', name: 'کد آیتم', type: 'text', sampleValues: ['ITM-01'], distinctCount: 1, nullCount: 0 },
      { key: 'title', name: 'عنوان / شرح', type: 'text', sampleValues: ['محصول نمونه'], distinctCount: 1, nullCount: 0 },
      { key: 'quantity', name: 'تعداد / مقدار', type: 'number', sum: 100, avg: 50, sampleValues: [100], distinctCount: 1, nullCount: 0 },
      { key: 'status', name: 'وضعیت', type: 'category', categories: ['فعال', 'در حال پردازش'], sampleValues: ['فعال'], distinctCount: 1, nullCount: 0 },
      { key: 'date', name: 'تاریخ', type: 'date', sampleValues: ['1403/05/20'], distinctCount: 1, nullCount: 0 },
      { key: 'notes', name: 'توضیحات', type: 'text', sampleValues: ['توضیحات رکورد'], distinctCount: 1, nullCount: 0 },
    ];
  }, [sheetColumns, dbRecords]);

  // Combine rows to display:
  // Prefer database records (durable Firestore), or sheet raw rows if DB is empty
  const displayRows = useMemo(() => {
    if (dbRecords.length > 0) {
      return dbRecords;
    }
    // If DB is empty, show parsed sheet raw rows
    if (sheetRawRows.length > 0 && sheetHeaders.length > 0) {
      return sheetRawRows.map((row, idx) => {
        const obj: Record<string, any> = { id: `sheet_row_${idx + 1}` };
        sheetHeaders.forEach((h, hIdx) => {
          const colKey = columns[hIdx]?.key || `col_${hIdx}`;
          obj[colKey] = row[hIdx];
        });
        return obj;
      });
    }
    return [];
  }, [dbRecords, sheetRawRows, sheetHeaders, columns]);

  // Filter & Sort
  const filteredRows = useMemo(() => {
    let result = [...displayRows];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        Object.values(row).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(q)
        )
      );
    }
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA === valB) return 0;
        if (valA === null || valA === undefined) return 1;
        if (valB === null || valB === undefined) return -1;
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        }
        return sortOrder === 'asc'
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }
    return result;
  }, [displayRows, searchQuery, sortKey, sortOrder]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);

  // Handle Add/Edit Record Submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingDoc) {
        await updateGenericRecord(SECONDARY_COLLECTION_NAME, editingDoc.id, formData);
        showToast('رکورد با موفقیت در دیتابیس بروزرسانی شد.');
      } else {
        await addGenericRecord(SECONDARY_COLLECTION_NAME, formData);
        showToast('رکورد جدید با موفقیت در دیتابیس ذخیره شد.');
      }
      setIsFormOpen(false);
      setEditingDoc(null);
      setFormData({});
    } catch (err: any) {
      console.error('Save error:', err);
      showToast(`خطا در ذخیره رکورد: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!window.confirm('آیا از حذف این رکورد از دیتابیس اطمینان دارید؟')) return;
    try {
      await deleteGenericRecord(SECONDARY_COLLECTION_NAME, id);
      showToast('رکورد با موفقیت از دیتابیس حذف گردید.');
    } catch (err: any) {
      console.error('Delete error:', err);
      showToast(`خطا در حذف: ${err.message}`);
    }
  };

  // Batch import all rows from Google Sheet directly to Firestore
  const handleImportAllFromSheet = async () => {
    if (sheetRawRows.length === 0 || sheetHeaders.length === 0) {
      showToast('ابتدا باید شیت گوگل بازخوانی شود.');
      return;
    }
    setIsImporting(true);
    setImportProgress({ current: 0, total: sheetRawRows.length });
    try {
      const recordsToInsert = sheetRawRows.map((row, idx) => {
        const obj: Record<string, any> = {};
        sheetHeaders.forEach((h, hIdx) => {
          const colKey = columns[hIdx]?.key || `col_${hIdx}`;
          const rawVal = row[hIdx];
          const num = Number(rawVal);
          obj[colKey] = !isNaN(num) && rawVal !== '' && typeof rawVal !== 'boolean' ? num : rawVal;
        });
        return obj;
      });

      const count = await importGenericRecordsBatch(
        SECONDARY_COLLECTION_NAME,
        recordsToInsert,
        (current, total) => {
          setImportProgress({ current, total });
        }
      );
      showToast(`${count} رکورد با موفقیت از شیت گوگل به پایگاه داده اضافه شد.`);
    } catch (err: any) {
      console.error('Batch import error:', err);
      showToast(`خطا در ایمپورت دسته‌ای: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Quick Seed Sample Data
  const handleSeedDemoData = async () => {
    const demoItems = [
      { item_code: 'PRD-101', title: 'کاشی گرانیتی ۶۰×۶۰', quantity: 450, status: 'تایید نهایی', date: '1403/05/18', notes: 'درجه ۱ صادراتی' },
      { item_code: 'PRD-102', title: 'کاشی پرسلان ۸۰×۸۰', quantity: 320, status: 'در حال پخت', date: '1403/05/19', notes: 'لعاب پولیش' },
      { item_code: 'PRD-103', title: 'سرامیک بدنه ۳۰×۹۰', quantity: 600, status: 'تایید نهایی', date: '1403/05/20', notes: 'رنگ کرم متالیک' },
      { item_code: 'PRD-104', title: 'سرامیک کف ۴۰×۴۰', quantity: 280, status: 'بررسی کیفی', date: '1403/05/21', notes: 'لعاب مات' },
      { item_code: 'PRD-105', title: 'کاشی دکور ۳۰×۶۰', quantity: 150, status: 'تایید نهایی', date: '1403/05/22', notes: 'چاپ دیجیتال' },
    ];
    try {
      await importGenericRecordsBatch(SECONDARY_COLLECTION_NAME, demoItems);
      showToast('داده‌های نمونه با موفقیت در دیتابیس بارگذاری شد.');
    } catch (err: any) {
      showToast(`خطا در ایجاد نمونه: ${err.message}`);
    }
  };

  // CSV Export
  const handleExportCsv = () => {
    if (displayRows.length === 0) return;
    const exportCols = columns.map((c) => c.name);
    const rowsCsv = displayRows.map((r) =>
      columns.map((c) => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = '\uFEFF' + [exportCols.join(','), ...rowsCsv].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sheet2_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('فایل CSV با موفقیت دانلود شد.');
  };

  // Analytics Chart Data
  const chartData = useMemo(() => {
    if (!xAxisKey || !yAxisKey || displayRows.length === 0) return [];
    return aggregateChartData(displayRows, xAxisKey, [yAxisKey], aggregation);
  }, [displayRows, xAxisKey, yAxisKey, aggregation]);

  const numericCols = columns.filter((c) => c.type === 'number');
  const catCols = columns.filter((c) => c.type !== 'number');

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Top Banner & Header */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-slate-900">
                {metadata?.title || 'داشبورد اختصاصی شیت دوم (Google Sheet #2)'}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Database className="w-3 h-3" />
                <span>همگام با Firestore</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
              <span>شناسه شیت: <code className="font-mono text-slate-700">{spreadsheetId}</code></span>
              <span>•</span>
              <a
                href={sheetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1"
              >
                <span>مشاهده در Google Sheets</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {accessToken ? (
            <button
              onClick={loadSheetMetadata}
              disabled={isSheetLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSheetLoading ? 'animate-spin text-indigo-600' : ''}`} />
              <span>بازخوانی شیت گوگل</span>
            </button>
          ) : (
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>ورود با حساب گوگل جهت همگام‌سازی</span>
            </button>
          )}

          {sheetRawRows.length > 0 && (
            <button
              onClick={handleImportAllFromSheet}
              disabled={isImporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              {isImporting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Layers className="w-3.5 h-3.5" />
              )}
              <span>ایمپورت کامل به دیتابیس ({sheetRawRows.length} ردیف)</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingDoc(null);
              setFormData({});
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span>ثبت رکورد جدید</span>
          </button>
        </div>
      </div>

      {/* Tabs / Sub-sheets selector (if Google Sheet has multiple sheets) */}
      {metadata && metadata.sheets && metadata.sheets.length > 1 && (
        <div className="bg-white rounded-xl p-3 border border-slate-200 flex items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-slate-500 shrink-0">تب‌های شیت:</span>
          <div className="flex items-center gap-1.5">
            {metadata.sheets.map((sheet) => (
              <button
                key={sheet.sheetId}
                onClick={() => {
                  setSelectedSheetTab(sheet.title);
                  loadSheetData(sheet.title);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  selectedSheetTab === sheet.title
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {sheet.title} ({sheet.rowCount || 0} ردیف)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sheet Error Alert if any */}
      {sheetError && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-900 text-xs">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold">پیام اتصال به شیت گوگل:</h4>
            <p className="mt-0.5 text-amber-800">{sheetError}</p>
            <p className="mt-1 text-[11px] text-amber-700">
              داده‌های ذخیره شده در پایگاه داده Firestore به صورت کامل قابل مشاهده و ویرایش هستند.
            </p>
          </div>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">کل رکوردهای ذخیره شده</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{dbRecords.length.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">در دیتابیس ابری Firestore</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ردیف‌های شیت گوگل</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{sheetRawRows.length.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">خوانده شده از Google Sheet</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">ستون‌های شناسایی‌شده</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Hash className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{columns.length}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">{numericCols.length} ستون عددی</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">وضعیت پایگاه داده</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-sm font-bold text-emerald-700">اتصال آنلاین فعال</div>
            <p className="text-[11px] text-slate-400 mt-0.5">همگام‌سازی بی‌درنگ</p>
          </div>
        </div>
      </div>

      {/* View Switcher: Table vs Analytics */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentView('table')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              currentView === 'table'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>جدول و مدیریت رکوردهای دیتابیس ({displayRows.length})</span>
          </button>

          <button
            onClick={() => setCurrentView('analytics')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              currentView === 'analytics'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>نمودارها و تحلیل بصری</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            disabled={displayRows.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>خروجی CSV</span>
          </button>
          
          {dbRecords.length === 0 && (
            <button
              onClick={handleSeedDemoData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>بارگذاری داده آزمایشی</span>
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: DATA TABLE */}
      {currentView === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          
          {/* Table Search & Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
              <input
                type="text"
                placeholder="جستجو در تمام ستون‌ها..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-hidden"
              />
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 self-end sm:self-center">
              <span>تعداد در صفحه:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700"
              >
                <option value={10}>۱۰</option>
                <option value={15}>۱۵</option>
                <option value={25}>۲۵</option>
                <option value={50}>۵۰</option>
              </select>
              <span>(نمایش {filteredRows.length} رکورد)</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="min-w-full divide-y divide-slate-200 text-xs text-right">
              <thead className="bg-slate-100 text-slate-700 font-bold select-none">
                <tr>
                  <th className="px-3.5 py-3 w-12 text-center">#</th>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => {
                        if (sortKey === col.key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortKey(col.key);
                          setSortOrder('asc');
                        }
                      }}
                      className="px-3.5 py-3 cursor-pointer hover:bg-slate-200 transition-colors whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <span>{col.name}</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                  ))}
                  <th className="px-3.5 py-3 text-center w-24">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 2} className="py-12 text-center text-slate-400">
                      هیچ رکوردی برای نمایش وجود ندارد.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, rIdx) => (
                    <tr key={row.id || rIdx} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-3.5 py-2.5 text-center text-slate-400 font-mono text-[11px]">
                        {(page - 1) * pageSize + rIdx + 1}
                      </td>
                      {columns.map((col) => (
                        <td key={col.key} className="px-3.5 py-2.5 text-slate-800 whitespace-nowrap">
                          {col.type === 'number' && typeof row[col.key] === 'number'
                            ? row[col.key].toLocaleString()
                            : row[col.key] !== null && row[col.key] !== undefined
                            ? String(row[col.key])
                            : '-'}
                        </td>
                      ))}
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingDoc(row);
                              setFormData({ ...row });
                              setIsFormOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                            title="ویرایش در دیتابیس"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {row.id && !row.id.startsWith('sheet_row_') && (
                            <button
                              onClick={() => handleDeleteRecord(row.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors"
                              title="حذف از دیتابیس"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              صفحه {page} از {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-slate-100 font-bold inline-flex items-center gap-1"
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>قبلی</span>
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 hover:bg-slate-100 font-bold inline-flex items-center gap-1"
              >
                <span>بعدی</span>
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* VIEW 2: VISUAL ANALYTICS */}
      {currentView === 'analytics' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">تحلیل بصری و نمودارهای هوشمند</h3>
              <p className="text-xs text-slate-500 mt-0.5">نمایش توزیع و تغییرات مقادیر شیت بر اساس ستون‌های انتخابی</p>
            </div>

            {/* Chart Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Chart Type */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'bar' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ستونی
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'line' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  خطی
                </button>
                <button
                  onClick={() => setChartType('area')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'area' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  ناحیه‌ای
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    chartType === 'pie' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  دایره‌ای
                </button>
              </div>

              {/* X Axis */}
              <select
                value={xAxisKey}
                onChange={(e) => setXAxisKey(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="">محور افقی (دسته‌بندی)...</option>
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    محور X: {c.name}
                  </option>
                ))}
              </select>

              {/* Y Axis */}
              <select
                value={yAxisKey}
                onChange={(e) => setYAxisKey(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="">محور عمودی (مقدار عددی)...</option>
                {columns.map((c) => (
                  <option key={c.key} value={c.key}>
                    محور Y: {c.name}
                  </option>
                ))}
              </select>

              {/* Aggregation */}
              <select
                value={aggregation}
                onChange={(e) => setAggregation(e.target.value as AggregationType)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="sum">مجموع (Sum)</option>
                <option value="avg">میانگین (Avg)</option>
                <option value="count">تعداد (Count)</option>
              </select>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="h-80 w-full" dir="ltr">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                لطفاً ستون‌های معتبر برای محورهای نمودار انتخاب فرمایید.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartType === 'bar' ? (
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey={yAxisKey} name={columns.find((c) => c.key === yAxisKey)?.name || yAxisKey} fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                ) : chartType === 'line' ? (
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey={yAxisKey} stroke="#4f46e5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 7 }} />
                  </LineChart>
                ) : chartType === 'area' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey={yAxisKey} stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.25} />
                  </AreaChart>
                ) : (
                  <PieChart>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', color: '#fff', borderRadius: '8px', border: 'none' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Pie data={chartData} dataKey={yAxisKey} nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLOR_PALETTE[index % COLOR_PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT RECORD IN FIRESTORE */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {editingDoc ? 'ویرایش رکورد در دیتابیس Firestore' : 'افزودن رکورد جدید به پایگاه داده'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {columns.map((col) => (
                <div key={col.key} className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">{col.name}:</label>
                  <input
                    type={col.type === 'number' ? 'number' : 'text'}
                    value={formData[col.key] !== undefined ? formData[col.key] : ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        [col.key]: col.type === 'number' ? Number(e.target.value) : e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
                  />
                </div>
              ))}

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  {isSaving ? 'در حال ذخیره...' : editingDoc ? 'بروزرسانی در دیتابیس' : 'ذخیره در دیتابیس'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
