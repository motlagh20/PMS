import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Table,
  Sparkles,
  LogIn,
  Layers,
  ArrowRight,
  FileUp,
  Flame,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { User } from 'firebase/auth';
import {
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_SPREADSHEET_URL,
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
  fetchSheetValues,
  fetchDriveSpreadsheets,
} from '../services/sheetsApi';
import { importKilnRecordsBatch } from '../services/dbService';
import { SheetMetadata, DriveFileItem, KilnRecord } from '../types';

interface GoogleSheetImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onImportSuccess: (importedCount: number) => void;
}

export const GoogleSheetImportModal: React.FC<GoogleSheetImportModalProps> = ({
  isOpen,
  onClose,
  user,
  accessToken,
  onSignIn,
  onImportSuccess,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'gsheet'>('gsheet');

  // Excel File State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsingFile, setIsParsingFile] = useState<boolean>(false);
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedExcelSheet, setSelectedExcelSheet] = useState<string>('');
  const [parsedWorkbook, setParsedWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Google Sheet State
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_SPREADSHEET_URL);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(DEFAULT_SPREADSHEET_ID);
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('Kiln-1400 (input)');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Google Drive Browser State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [driveSearch, setDriveSearch] = useState<string>('');
  const [showDrivePicker, setShowDrivePicker] = useState<boolean>(false);

  // Preview Data
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [mappedRecords, setMappedRecords] = useState<Omit<KilnRecord, 'id'>[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Import Execution State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'gsheet') {
      loadSpreadsheetInfo(spreadsheetId);
    }
  }, [isOpen, activeTab, accessToken, spreadsheetId]);

  if (!isOpen) return null;

  const findColValue = (row: any[], headers: string[], aliases: string[]): any => {
    for (let i = 0; i < headers.length; i++) {
      const h = (headers[i] || '').trim().toLowerCase();
      for (const alias of aliases) {
        if (h === alias.toLowerCase() || h.includes(alias.toLowerCase())) {
          return row[i];
        }
      }
    }
    return undefined;
  };

  const transformRowsToKilnRecords = (headers: string[], rows: any[][]): Omit<KilnRecord, 'id'>[] => {
    const parseNum = (val: any, fallback = 0): number => {
      if (typeof val === 'number') return isNaN(val) ? fallback : val;
      if (!val) return fallback;
      const cleaned = String(val).replace(/[^0-9.-]+/g, '');
      const n = parseFloat(cleaned);
      return isNaN(n) ? fallback : n;
    };

    return rows
      .filter((r) => r && r.length > 0 && r.some((cell) => cell !== '' && cell !== null && cell !== undefined))
      .map((row, idx) => {
        const rowNumberRaw = findColValue(row, headers, ['ردیف', 'row', 'radif', 'شماره']);
        const dateRaw = findColValue(row, headers, ['تاریخ', 'date', 'tarikh']);
        const opCodeRaw = findColValue(row, headers, ['کد اپراتور', 'کد اپراتور:', 'operator code', 'operator_code', 'code']);
        const operatorRaw = findColValue(row, headers, ['اپراتور', 'نام اپراتور', 'operator', 'operator name']);
        const timeRaw = findColValue(row, headers, ['ساعت', 'زمان', 'time', 'hour']);
        const rawField = findColValue(row, headers, ['خام', 'raw', 'status']);
        const inputCarRaw = findColValue(row, headers, ['واگن ورودی', 'input car', 'inputcar', 'واگن ورود']);
        const productCodeRaw = findColValue(row, headers, ['کد محصول', 'product code', 'product_code']);
        const productTypeRaw = findColValue(row, headers, ['نوع محصول', 'محصول', 'product type', 'product']);

        const exhaustRaw = findColValue(row, headers, ['دمای اگزوز', 'اگزوز', 'exhaust', 'exhaust temp']);
        const preHeat1Raw = findColValue(row, headers, ['پیش گرما1', 'پیش گرما ۱', 'پیشگرما 1', 'preheat1', 'preheat 1', 'pre heat 1']);
        const preHeat2Raw = findColValue(row, headers, ['پیش گرما2', 'پیش گرما ۲', 'پیشگرما 2', 'preheat2', 'preheat 2', 'pre heat 2']);
        const thermostatRaw = findColValue(row, headers, ['ترموستات', 'ترموستات کوره', 'thermostat', 'setpoint']);

        const zone0Raw = findColValue(row, headers, ['زون0', 'زون 0', 'زون ۰', 'zone0', 'zone 0']);
        const zone1Raw = findColValue(row, headers, ['زون1', 'زون 1', 'زون ۱', 'zone1', 'zone 1']);
        const zone2Raw = findColValue(row, headers, ['زون2', 'زون 2', 'زون ۲', 'zone2', 'zone 2']);
        const zone3Raw = findColValue(row, headers, ['زون3', 'زون 3', 'زون ۳', 'zone3', 'zone 3']);
        const zone4Raw = findColValue(row, headers, ['زون4', 'زون 4', 'زون ۴', 'zone4', 'zone 4']);
        const zone5Raw = findColValue(row, headers, ['زون5', 'زون 5', 'زون ۵', 'zone5', 'zone 5']);
        const zone6Raw = findColValue(row, headers, ['زون6', 'زون 6', 'زون ۶', 'zone6', 'zone 6']);
        const zone7Raw = findColValue(row, headers, ['زون7', 'زون 7', 'زون ۷', 'zone7', 'zone 7']);

        const rapid1Raw = findColValue(row, headers, ['رپید1', 'رپید 1', 'رپید ۱', 'rapid1', 'rapid 1']);
        const rapid2Raw = findColValue(row, headers, ['رپید2', 'رپید 2', 'رپید ۲', 'rapid2', 'rapid 2']);
        const bottomARaw = findColValue(row, headers, ['باتوم A', 'باتومA', 'bottom a', 'bottomA']);
        const bottom1Raw = findColValue(row, headers, ['باتوم1', 'باتوم 1', 'باتوم ۱', 'bottom1', 'bottom 1']);
        const bottomBRaw = findColValue(row, headers, ['باتوم B', 'باتومB', 'bottom b', 'bottomB']);
        const bottom2Raw = findColValue(row, headers, ['باتوم 2', 'باتوم2', 'باتوم ۲', 'bottom2', 'bottom 2']);

        const car44Raw = findColValue(row, headers, ['دمای واگن 44', 'واگن 44', 'car 44', 'car44']);
        const bottomPipeRaw = findColValue(row, headers, ['دمای لوله باتوم', 'لوله باتوم', 'bottom pipe', 'bottompipe']);
        const dryerPipeRaw = findColValue(row, headers, ['دمای لوله خشک کن', 'لوله خشک کن', 'dryer pipe', 'dryerpipe']);

        const pushingTimeRaw = findColValue(row, headers, ['زمان پوشینگ', 'پوشینگ', 'pushing time', 'pushing']);
        const outputCarRaw = findColValue(row, headers, ['شماره واگن خروجی', 'واگن خروجی', 'output car', 'outputcar']);
        const notesRaw = findColValue(row, headers, ['توضیحات', 'یادداشت', 'notes', 'description', 'remarks']);

        return {
          rowNumber: parseNum(rowNumberRaw, idx + 1),
          date: dateRaw ? String(dateRaw).trim() : new Date().toISOString().split('T')[0],
          operatorCode: opCodeRaw ? String(opCodeRaw).trim() : '',
          operator: operatorRaw ? String(operatorRaw).trim() : '',
          time: timeRaw ? String(timeRaw).trim() : '',
          raw: rawField ? String(rawField).trim() : 'خام',
          inputCar: inputCarRaw ? String(inputCarRaw).trim() : '',
          productCode: productCodeRaw ? String(productCodeRaw).trim() : '',
          productType: productTypeRaw ? String(productTypeRaw).trim() : '',
          exhaustTemp: parseNum(exhaustRaw, 115),
          preHeat1: parseNum(preHeat1Raw, 680),
          preHeat2: parseNum(preHeat2Raw, 850),
          thermostat: parseNum(thermostatRaw, 1205),
          zone0: parseNum(zone0Raw, 980),
          zone1: parseNum(zone1Raw, 1120),
          zone2: parseNum(zone2Raw, 1180),
          zone3: parseNum(zone3Raw, 1200),
          zone4: parseNum(zone4Raw, 1205),
          zone5: parseNum(zone5Raw, 1195),
          zone6: parseNum(zone6Raw, 1170),
          zone7: parseNum(zone7Raw, 1050),
          rapid1: parseNum(rapid1Raw, 720),
          rapid2: parseNum(rapid2Raw, 610),
          bottomA: parseNum(bottomARaw, 840),
          bottom1: parseNum(bottom1Raw, 890),
          bottomB: parseNum(bottomBRaw, 910),
          bottom2: parseNum(bottom2Raw, 870),
          car44Temp: parseNum(car44Raw, 45),
          bottomPipeTemp: parseNum(bottomPipeRaw, 75),
          dryerPipeTemp: parseNum(dryerPipeRaw, 65),
          pushingTime: pushingTimeRaw ? String(pushingTimeRaw).trim() : '28 min',
          outputCar: outputCarRaw ? String(outputCarRaw).trim() : '',
          notes: notesRaw ? String(notesRaw).trim() : '',
        };
      });
  };

  // Google Sheet metadata & fetch
  const loadSpreadsheetInfo = async (id: string) => {
    setIsLoadingMetadata(true);
    setStatusMessage(null);
    try {
      const meta = await fetchSpreadsheetMetadata(id, accessToken);
      setMetadata(meta);

      const targetSheet =
        meta.sheets.find(
          (s) =>
            s.title.toLowerCase().includes('kiln') ||
            s.title.includes('کوره') ||
            s.title.includes('input')
        ) || meta.sheets[0];

      const sheetName = targetSheet ? targetSheet.title : 'Kiln-1400 (input)';
      setSelectedSheetName(sheetName);
      await loadSheetPreview(id, sheetName);
    } catch (err: any) {
      console.error('Metadata error:', err);
      setStatusMessage({
        type: 'error',
        text: `خطا در باز کردن شیت: ${err.message || 'لطفاً دسترسی فایل را بررسی کنید.'}`,
      });
      setMetadata(null);
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const loadSheetPreview = async (id: string, sheetName: string) => {
    setIsLoadingPreview(true);
    try {
      const data = await fetchSheetValues(id, sheetName, accessToken);
      if (data.headers && data.headers.length > 0) {
        setPreviewHeaders(data.headers);
        setPreviewRows(data.rows);
        const mapped = transformRowsToKilnRecords(data.headers, data.rows);
        setMappedRecords(mapped);
        setStatusMessage({
          type: 'info',
          text: `اطلاعات برگه «${sheetName}» خوانده شد (${mapped.length} ردیف آماده ایمپورت)`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `داده‌ای در برگه «${sheetName}» یافت نشد.`,
        });
      }
    } catch (err: any) {
      console.error('Preview fetch error:', err);
      setStatusMessage({
        type: 'error',
        text: `خطا در خواندن ردیف‌های برگه ${sheetName}: ${err.message}`,
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const extracted = extractSpreadsheetId(inputUrl);
    if (!extracted) {
      setStatusMessage({ type: 'error', text: 'آدرس گوگل شیت نامعتبر است.' });
      return;
    }
    setSpreadsheetId(extracted);
    loadSpreadsheetInfo(extracted);
  };

  // Google Drive Browser
  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoadingDrive(true);
    try {
      const files = await fetchDriveSpreadsheets(accessToken);
      setDriveFiles(files);
      setShowDrivePicker(true);
    } catch (err: any) {
      console.error('Failed to load Google Drive spreadsheets:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleSelectDriveFile = (file: DriveFileItem) => {
    setSpreadsheetId(file.id);
    setInputUrl(`https://docs.google.com/spreadsheets/d/${file.id}/edit`);
    setShowDrivePicker(false);
    loadSpreadsheetInfo(file.id);
  };

  // Local Excel / CSV File processing
  const processExcelFile = async (file: File) => {
    setSelectedFile(file);
    setIsParsingFile(true);
    setStatusMessage(null);

    try {
      if (file.name.endsWith('.csv')) {
        Papa.parse(file, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
            const data = results.data as any[][];
            if (data.length > 0) {
              const headers = data[0].map((h) => String(h || ''));
              const rows = data.slice(1);
              setPreviewHeaders(headers);
              setPreviewRows(rows);
              const mapped = transformRowsToKilnRecords(headers, rows);
              setMappedRecords(mapped);
              setStatusMessage({
                type: 'info',
                text: `فایل CSV کوره با موفقیت خوانده شد (${mapped.length} ردیف آماده ایمپورت)`,
              });
            }
            setIsParsingFile(false);
          },
          error: (err) => {
            setStatusMessage({ type: 'error', text: 'خطا در پردازش فایل CSV: ' + err.message });
            setIsParsingFile(false);
          },
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        setParsedWorkbook(workbook);
        setExcelSheets(workbook.SheetNames);

        if (workbook.SheetNames.length > 0) {
          const targetSheet =
            workbook.SheetNames.find(
              (s) => s.toLowerCase().includes('kiln') || s.includes('کوره') || s.includes('input')
            ) || workbook.SheetNames[0];
          setSelectedExcelSheet(targetSheet);
          loadExcelSheetData(workbook, targetSheet);
        }
        setIsParsingFile(false);
      }
    } catch (err: any) {
      console.error('Failed to parse Excel file:', err);
      setStatusMessage({ type: 'error', text: 'خطا در بارگذاری فایل اکسل: ' + err.message });
      setIsParsingFile(false);
    }
  };

  const loadExcelSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) return;

    const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
    if (jsonData.length > 0) {
      const headers = (jsonData[0] || []).map((h) => String(h || ''));
      const rows = jsonData.slice(1);
      setPreviewHeaders(headers);
      setPreviewRows(rows);
      const mapped = transformRowsToKilnRecords(headers, rows);
      setMappedRecords(mapped);
      setStatusMessage({
        type: 'info',
        text: `برگه «${sheetName}» با ${mapped.length} ردیف استخراج شد.`,
      });
    }
  };

  // Perform Final Batch Import into Firestore
  const handleExecuteImport = async () => {
    if (mappedRecords.length === 0) {
      setStatusMessage({ type: 'error', text: 'هیچ ردیفی برای ایمپورت به دیتابیس کوره یافت نشد.' });
      return;
    }

    try {
      setIsImporting(true);
      setStatusMessage(null);
      setImportProgress({ current: 0, total: mappedRecords.length });

      const importedCount = await importKilnRecordsBatch(mappedRecords, (current, total) => {
        setImportProgress({ current, total });
      });

      setStatusMessage({
        type: 'success',
        text: `با موفقیت ${importedCount.toLocaleString('fa-IR')} ردیف در پایگاه داده کوره ذخیره گردید!`,
      });

      setTimeout(() => {
        onImportSuccess(importedCount);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Import execution error:', err);
      setStatusMessage({
        type: 'error',
        text: `خطا در ذخیره‌سازی داده‌ها در دیتابیس: ${err.message}`,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-700 to-teal-800 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <Flame className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">ایمپورت داده‌های کوره پخت (Kiln-1400)</h2>
              <p className="text-xs text-emerald-100">
                بارگذاری اطلاعات خط کوره از Google Sheets یا فایل‌های محلی Excel / CSV مستقیماً به دیتابیس ابری
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50">
          <button
            onClick={() => setActiveTab('gsheet')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'gsheet'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DownloadCloud className="w-4 h-4 text-emerald-600" />
            <span>اتصال آنلاین به Google Sheets (پیش‌فرض / درایو)</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'excel'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileUp className="w-4 h-4 text-teal-600" />
            <span>آپلود فایل اکسل یا CSV (.xlsx, .csv)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl flex items-center gap-3 text-xs font-semibold ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-teal-50 text-teal-900 border border-teal-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-teal-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'gsheet' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>اتصال به Google Sheets (پشتیبانی از شیت عمومی و حساب شخصی)</span>
                </div>
                <div className="flex items-center gap-2">
                  {user ? (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>متصل: {user.email || 'گوگل'}</span>
                    </div>
                  ) : (
                    <button
                      onClick={onSignIn}
                      className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>ورود با گوگل (اختیاری)</span>
                    </button>
                  )}
                  {accessToken && (
                    <button
                      onClick={loadDriveFiles}
                      className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-emerald-200 transition-all"
                    >
                      <Search className="w-3.5 h-3.5 text-emerald-600" />
                      <span>انتخاب از Drive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drive Picker Modal / Section */}
              {showDrivePicker && (
                <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900">فایل‌های Google Sheets حساب شما:</span>
                    <button
                      onClick={() => setShowDrivePicker(false)}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      بستن
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="جستجو در نام فایل‌ها..."
                    value={driveSearch}
                    onChange={(e) => setDriveSearch(e.target.value)}
                    className="w-full text-xs px-3 py-1.5 border border-emerald-200 rounded-lg bg-white"
                  />
                  {isLoadingDrive ? (
                    <div className="text-center py-4 text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                      <span>در حال دریافت لیست فایل‌ها...</span>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {filteredDriveFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectDriveFile(file)}
                          className="flex items-center justify-between p-2 bg-white hover:bg-emerald-100 rounded-lg text-xs cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{file.id.substring(0, 10)}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleUrlSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="لینک یا شناسه گوگل شیت کوره..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white font-mono"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={isLoadingMetadata || isLoadingPreview}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
                >
                  {isLoadingMetadata || isLoadingPreview ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  <span>بارگذاری اطلاعات شیت</span>
                </button>
              </form>

              {/* Sheet Selector */}
              {metadata && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">{metadata.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">ID: {metadata.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">انتخاب برگه:</span>
                    <select
                      value={selectedSheetName}
                      onChange={(e) => {
                        setSelectedSheetName(e.target.value);
                        loadSheetPreview(spreadsheetId, e.target.value);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 font-medium"
                    >
                      {metadata.sheets.map((s) => (
                        <option key={s.sheetId} value={s.title}>
                          {s.title} {s.rowCount ? `(${s.rowCount} سطر)` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LOCAL EXCEL FILE */}
          {activeTab === 'excel' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    processExcelFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-emerald-400 bg-slate-50/50 hover:bg-white'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      processExcelFile(e.target.files[0]);
                    }
                  }}
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  {selectedFile ? selectedFile.name : 'فایل اکسل یا CSV اطلاعات کوره را اینجا رها کنید'}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  فرمت‌های مجاز: XLSX, XLS, CSV (با تطبیق خودکار ستون‌های دمایی و زون‌ها)
                </p>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold">
                  <span>انتخاب فایل از کامپیوتر</span>
                </span>
              </div>

              {/* Sheet selector if multiple */}
              {excelSheets.length > 1 && parsedWorkbook && (
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">انتخاب برگه‌ی اکسل (Sheet):</span>
                  <select
                    value={selectedExcelSheet}
                    onChange={(e) => {
                      setSelectedExcelSheet(e.target.value);
                      loadExcelSheetData(parsedWorkbook, e.target.value);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
                  >
                    {excelSheets.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* TABLE PREVIEW */}
          {mappedRecords.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    پیش‌نمایش داده‌های کوره ({mappedRecords.length} ردیف آماده انتقال به Firestore)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  تطبیق موفق پارامترهای کوره
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold">
                    <tr className="whitespace-nowrap">
                      <th className="py-2 px-3">ردیف</th>
                      <th className="py-2 px-3">تاریخ</th>
                      <th className="py-2 px-3">اپراتور</th>
                      <th className="py-2 px-3">محصول</th>
                      <th className="py-2 px-3">واگن ورودی</th>
                      <th className="py-2 px-3 bg-emerald-50 text-emerald-900">دمای اگزوز</th>
                      <th className="py-2 px-3 bg-amber-50 text-amber-900">ترموستات</th>
                      <th className="py-2 px-3">زون ۴</th>
                      <th className="py-2 px-3">زون ۵</th>
                      <th className="py-2 px-3">رپید ۱</th>
                      <th className="py-2 px-3">باتوم ۱</th>
                      <th className="py-2 px-3">زمان پوشینگ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {mappedRecords.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 whitespace-nowrap">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.rowNumber}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{r.date}</td>
                        <td className="py-2 px-3">{r.operator || '-'}</td>
                        <td className="py-2 px-3">{r.productType || '-'}</td>
                        <td className="py-2 px-3 font-mono">{r.inputCar || '-'}</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700 bg-emerald-50/50">{r.exhaustTemp}°</td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-800 bg-amber-50/50">{r.thermostat}°</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{r.zone4}°</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{r.zone5}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.rapid1}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.bottom1}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.pushingTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedRecords.length > 10 && (
                <p className="text-[11px] text-slate-500 text-center">
                  نمایش ۱۰ ردیف اول از مجموع {mappedRecords.length} ردیف آماده انتقال
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
          >
            بستن
          </button>

          <button
            onClick={handleExecuteImport}
            disabled={mappedRecords.length === 0 || isImporting}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40"
          >
            {isImporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>
                  در حال ثبت در پایگاه داده ({importProgress.current} از {importProgress.total})...
                </span>
              </>
            ) : (
              <>
                <DownloadCloud className="w-4 h-4" />
                <span>انتقال و ذخیره {mappedRecords.length} ردیف به پایگاه داده کوره</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
