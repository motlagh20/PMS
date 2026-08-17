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
  Truck,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { User } from 'firebase/auth';
import {
  extractSpreadsheetId,
  fetchSpreadsheetMetadata,
  fetchSheetValues,
  fetchDriveSpreadsheets,
} from '../services/sheetsApi';
import { importSettingRecordsBatch, SETTING_SPREADSHEET_ID } from '../services/dbService';
import { SheetMetadata, DriveFileItem, SettingRecord } from '../types';

export const DEFAULT_SETTING_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${SETTING_SPREADSHEET_ID}/edit?usp=sharing`;

interface SettingImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onImportSuccess: (importedCount: number) => void;
}

export const SettingImportModal: React.FC<SettingImportModalProps> = ({
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
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_SETTING_SPREADSHEET_URL);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(SETTING_SPREADSHEET_ID);
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('Data');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Google Drive Browser State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [driveSearch, setDriveSearch] = useState<string>('');
  const [showDrivePicker, setShowDrivePicker] = useState<boolean>(false);

  // Preview Data
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [mappedRecords, setMappedRecords] = useState<Omit<SettingRecord, 'id'>[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState<boolean>(false);

  // Import State
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    if (isOpen && activeTab === 'gsheet') {
      loadGSheetInfo(spreadsheetId);
    }
  }, [isOpen, activeTab, accessToken, spreadsheetId]);

  if (!isOpen) return null;

  // Helper to find column value by matching aliases
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

  const parseNum = (val: any, fallback = 0): number => {
    if (typeof val === 'number') return isNaN(val) ? fallback : val;
    if (!val) return fallback;
    const cleaned = String(val).replace(/[^0-9.-]+/g, '');
    const n = parseFloat(cleaned);
    return isNaN(n) ? fallback : n;
  };

  const parseStr = (val: any, fallback = ''): string => {
    if (val === null || val === undefined) return fallback;
    return String(val).trim();
  };

  // Map 43-column Set_1400 / Data format
  const mapRawDataToSettingRecords = (headers: string[], rows: any[][]): Omit<SettingRecord, 'id'>[] => {
    return rows
      .filter((r) => r && r.length > 0 && r.some((c) => c !== '' && c !== null && c !== undefined))
      .map((row, idx) => {
        const rowNumberRaw = findColValue(row, headers, ['ردیف', 'شماره', 'row', 'no', '#']);
        const dateRaw = findColValue(row, headers, ['تاریخ', 'date', 'تاریخ شمسی']);
        const monthRaw = findColValue(row, headers, ['ماه', 'month']);
        const shiftRaw = findColValue(row, headers, ['شیفت', 'shift']);
        const opRaw = findColValue(row, headers, ['اپراتور', 'نام اپراتور', 'operator', 'operator name']);
        const chamberRaw = findColValue(row, headers, ['شماره چمبر', 'چمبر', 'chamber', 'chamber number']);
        const productRaw = findColValue(row, headers, ['نوع تولید', 'تولید', 'نوع محصول', 'محصول', 'product']);
        const fingerRaw = findColValue(row, headers, ['تعداد فینگر', 'فینگر', 'finger', 'تعداد تولید']);

        const car1Num = findColValue(row, headers, ['شماره واگن ۱', 'شماره واگن 1', 'واگن ۱', 'واگن 1', 'car1']);
        const car1Fing = findColValue(row, headers, ['تعداد فینگر ۱', 'تعداد فینگر 1', 'فینگر ۱', 'فینگر 1']);
        const car1Time = findColValue(row, headers, ['زمان بارگیری ۱', 'زمان بارگیری 1', 'ساعت ۱', 'ساعت 1']);
        const car1Notes = findColValue(row, headers, ['توضیحات ۱', 'توضیحات 1']);

        const car2Num = findColValue(row, headers, ['شماره واگن ۲', 'شماره واگن 2', 'واگن ۲', 'واگن 2', 'car2']);
        const car2Fing = findColValue(row, headers, ['تعداد فینگر ۲', 'تعداد فینگر 2', 'فینگر ۲', 'فینگر 2']);
        const car2Time = findColValue(row, headers, ['زمان بارگیری ۲', 'زمان بارگیری 2', 'ساعت ۲', 'ساعت 2']);
        const car2Notes = findColValue(row, headers, ['توضیحات ۲', 'توضیحات 2']);

        const car3Num = findColValue(row, headers, ['شماره واگن ۳', 'شماره واگن 3', 'واگن ۳', 'واگن 3', 'car3']);
        const car3Fing = findColValue(row, headers, ['تعداد فینگر ۳', 'تعداد فینگر 3', 'فینگر ۳', 'فینگر 3']);
        const car3Time = findColValue(row, headers, ['زمان بارگیری ۳', 'زمان بارگیری 3', 'ساعت ۳', 'ساعت 3']);
        const car3Notes = findColValue(row, headers, ['توضیحات ۳', 'توضیحات 3']);

        const car4Num = findColValue(row, headers, ['شماره واگن ۴', 'شماره واگن 4', 'واگن ۴', 'واگن 4', 'car4']);
        const car4Fing = findColValue(row, headers, ['تعداد فینگر ۴', 'تعداد فینگر 4', 'فینگر ۴', 'فینگر 4']);
        const car4Time = findColValue(row, headers, ['زمان بارگیری ۴', 'زمان بارگیری 4', 'ساعت ۴', 'ساعت 4']);
        const car4Notes = findColValue(row, headers, ['توضیحات ۴', 'توضیحات 4']);

        const car5Num = findColValue(row, headers, ['شماره واگن ۵', 'شماره واگن 5', 'واگن ۵', 'واگن 5', 'car5']);
        const car5Fing = findColValue(row, headers, ['تعداد فینگر ۵', 'تعداد فینگر 5', 'فینگر ۵', 'فینگر 5']);
        const car5Time = findColValue(row, headers, ['زمان بارگیری ۵', 'زمان بارگیری 5', 'ساعت ۵', 'ساعت 5']);
        const car5Notes = findColValue(row, headers, ['توضیحات ۵', 'توضیحات 5']);

        const car6Num = findColValue(row, headers, ['شماره واگن ۶', 'شماره واگن 6', 'واگن ۶', 'واگن 6', 'car6']);
        const car6Fing = findColValue(row, headers, ['تعداد فینگر ۶', 'تعداد فینگر 6', 'فینگر ۶', 'فینگر 6']);
        const car6Time = findColValue(row, headers, ['زمان بارگیری ۶', 'زمان بارگیری 6', 'ساعت ۶', 'ساعت 6']);
        const car6Notes = findColValue(row, headers, ['توضیحات ۶', 'توضیحات 6']);

        const car7Num = findColValue(row, headers, ['شماره واگن ۷', 'شماره واگن 7', 'واگن ۷', 'واگن 7', 'car7']);
        const car7Fing = findColValue(row, headers, ['تعداد فینگر ۷', 'تعداد فینگر 7', 'فینگر ۷', 'فینگر 7']);
        const car7Time = findColValue(row, headers, ['زمان بارگیری ۷', 'زمان بارگیری 7', 'ساعت ۷', 'ساعت 7']);
        const car7Notes = findColValue(row, headers, ['توضیحات ۷', 'توضیحات 7']);

        const car8Num = findColValue(row, headers, ['شماره واگن ۸', 'شماره واگن 8', 'واگن ۸', 'واگن 8', 'car8']);
        const car8Fing = findColValue(row, headers, ['تعداد فینگر ۸', 'تعداد فینگر 8', 'فینگر ۸', 'فینگر 8']);
        const car8Time = findColValue(row, headers, ['زمان بارگیری ۸', 'زمان بارگیری 8', 'ساعت ۸', 'ساعت 8']);
        const car8Notes = findColValue(row, headers, ['توضیحات ۸', 'توضیحات 8']);

        const genNotes = findColValue(row, headers, ['توضیحات', 'یادداشت', 'شرح', 'notes', 'remarks']);

        return {
          rowNumber: parseNum(rowNumberRaw, idx + 1),
          date: parseStr(dateRaw, '1400/01/01'),
          month: parseStr(monthRaw, 'فروردین'),
          shift: parseStr(shiftRaw, 'صبح'),
          operatorName: parseStr(opRaw, 'اپراتور'),
          chamberNumber: parseStr(chamberRaw, `${1 + (idx % 8)}`),
          product: parseStr(productRaw, 'پرسلان پولیشی 60*60'),
          fingerCount: parseNum(fingerRaw, 480),

          car1_number: parseStr(car1Num, `${10 + idx}`),
          car1_fingerCount: parseNum(car1Fing, 60),
          car1_time: parseStr(car1Time, '08:30'),
          car1_notes: parseStr(car1Notes, ''),

          car2_number: parseStr(car2Num, ''),
          car2_fingerCount: parseNum(car2Fing, 0),
          car2_time: parseStr(car2Time, ''),
          car2_notes: parseStr(car2Notes, ''),

          car3_number: parseStr(car3Num, ''),
          car3_fingerCount: parseNum(car3Fing, 0),
          car3_time: parseStr(car3Time, ''),
          car3_notes: parseStr(car3Notes, ''),

          car4_number: parseStr(car4Num, ''),
          car4_fingerCount: parseNum(car4Fing, 0),
          car4_time: parseStr(car4Time, ''),
          car4_notes: parseStr(car4Notes, ''),

          car5_number: parseStr(car5Num, ''),
          car5_fingerCount: parseNum(car5Fing, 0),
          car5_time: parseStr(car5Time, ''),
          car5_notes: parseStr(car5Notes, ''),

          car6_number: parseStr(car6Num, ''),
          car6_fingerCount: parseNum(car6Fing, 0),
          car6_time: parseStr(car6Time, ''),
          car6_notes: parseStr(car6Notes, ''),

          car7_number: parseStr(car7Num, ''),
          car7_fingerCount: parseNum(car7Fing, 0),
          car7_time: parseStr(car7Time, ''),
          car7_notes: parseStr(car7Notes, ''),

          car8_number: parseStr(car8Num, ''),
          car8_fingerCount: parseNum(car8Fing, 0),
          car8_time: parseStr(car8Time, ''),
          car8_notes: parseStr(car8Notes, ''),

          notes: parseStr(genNotes, ''),
        };
      });
  };

  // Local Excel & CSV handling
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
              const mapped = mapRawDataToSettingRecords(headers, rows);
              setMappedRecords(mapped);
              setStatusMessage({
                type: 'info',
                text: `فایل CSV با موفقیت خوانده شد (${mapped.length} رکورد ستینگ آماده ذخیره)`,
              });
            }
            setIsParsingFile(false);
          },
          error: (err) => {
            setStatusMessage({ type: 'error', text: 'خطا در خواندن فایل CSV: ' + err.message });
            setIsParsingFile(false);
          },
        });
      } else {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        setParsedWorkbook(workbook);
        setExcelSheets(workbook.SheetNames);

        if (workbook.SheetNames.length > 0) {
          const targetSheet = workbook.SheetNames.includes('Data') ? 'Data' : workbook.SheetNames[0];
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

  const loadExcelSheetData = (workbook: XLSX.WorkBook, sheetName: string) => {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) return;

    const data = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
    if (data && data.length > 0) {
      const headers = (data[0] || []).map((h: any) => String(h || ''));
      const rows = data.slice(1);
      setPreviewHeaders(headers);
      setPreviewRows(rows);
      const mapped = mapRawDataToSettingRecords(headers, rows);
      setMappedRecords(mapped);
      setStatusMessage({
        type: 'info',
        text: `شیت "${sheetName}" بارگذاری شد (${mapped.length} رکورد آماده ایمپورت)`,
      });
    }
  };

  // Google Sheets Fetch
  const loadGSheetInfo = async (sheetId: string) => {
    setIsLoadingMetadata(true);
    setStatusMessage(null);

    try {
      const meta = await fetchSpreadsheetMetadata(sheetId, accessToken);
      setMetadata(meta);
      const targetSheet = meta.sheets.find((s) => s.title === 'Data') || meta.sheets[0];
      if (targetSheet) {
        setSelectedSheetName(targetSheet.title);
        await loadGSheetValues(sheetId, targetSheet.title);
      }
    } catch (err: any) {
      console.error('Failed to load GSheet info:', err);
      setStatusMessage({
        type: 'error',
        text: 'خطا در دسترسی به شیت گوگل: ' + (err.message || 'لطفاً دسترسی به فایل را بررسی کنید.'),
      });
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const loadGSheetValues = async (sheetId: string, sheetTitle: string) => {
    setIsLoadingPreview(true);

    try {
      const { headers, rows } = await fetchSheetValues(sheetId, sheetTitle, accessToken);
      if (headers && headers.length > 0) {
        setPreviewHeaders(headers);
        setPreviewRows(rows);
        const mapped = mapRawDataToSettingRecords(headers, rows);
        setMappedRecords(mapped);
        setStatusMessage({
          type: 'info',
          text: `اطلاعات شیت گوگل "${sheetTitle}" خوانده شد (${mapped.length} رکورد آماده ایمپورت)`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `داده‌ای در شیت "${sheetTitle}" یافت نشد.`,
        });
      }
    } catch (err: any) {
      console.error('Failed to load sheet values:', err);
      setStatusMessage({ type: 'error', text: 'خطا در دریافت داده‌ها: ' + err.message });
    } finally {
      setIsLoadingPreview(false);
    }
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
    loadGSheetInfo(file.id);
  };

  // Execute Batch Import to Firestore
  const handleExecuteImport = async () => {
    if (mappedRecords.length === 0) {
      setStatusMessage({ type: 'error', text: 'هیچ رکوردی برای ایمپورت یافت نشد.' });
      return;
    }

    setIsImporting(true);
    setImportProgress({ current: 0, total: mappedRecords.length });

    try {
      const totalImported = await importSettingRecordsBatch(mappedRecords, (current, total) => {
        setImportProgress({ current, total });
      });

      setStatusMessage({
        type: 'success',
        text: `تعداد ${totalImported.toLocaleString('fa-IR')} رکورد ستینگ با موفقیت در پایگاه داده ذخیره شد!`,
      });

      setTimeout(() => {
        onImportSuccess(totalImported);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Batch import failed:', err);
      setStatusMessage({ type: 'error', text: 'خطا در ذخیره‌سازی داده‌ها: ' + err.message });
    } finally {
      setIsImporting(false);
    }
  };

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs text-right" dir="rtl">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-teal-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 border border-teal-400/30 rounded-xl">
              <Truck className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base font-bold">ایمپورت داده‌های ستینگ و بارگیری (Set_1400 / Data)</h2>
              <p className="text-xs text-teal-200/80 mt-0.5">
                ورود دسته‌ای اطلاعات سال‌های مختلف از اکسل، CSV یا شیت گوگل
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-300 hover:text-white rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="px-6 border-b border-slate-200 flex items-center bg-slate-50 shrink-0">
          <button
            onClick={() => setActiveTab('gsheet')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'gsheet'
                ? 'border-teal-600 text-teal-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DownloadCloud className="w-4 h-4 text-teal-600" />
            <span>اتصال آنلاین به Google Sheets (Google Drive)</span>
          </button>
          <button
            onClick={() => setActiveTab('excel')}
            className={`py-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'excel'
                ? 'border-teal-600 text-teal-800 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileUp className="w-4 h-4 text-teal-600" />
            <span>آپلود فایل اکسل یا CSV لوکال (.xlsx, .csv)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Status Alert */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-rose-50 text-rose-800 border border-rose-200'
                  : 'bg-teal-50 text-teal-800 border border-teal-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'gsheet' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                  <span>اتصال به Google Sheets (پشتیبانی از لینک عمومی و حساب کاربری)</span>
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
                      className="flex items-center gap-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 transition-all"
                    >
                      <Search className="w-3.5 h-3.5 text-teal-600" />
                      <span>انتخاب از Drive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drive Picker Section */}
              {showDrivePicker && (
                <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-900">فایل‌های Google Sheets حساب شما:</span>
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
                    className="w-full text-xs px-3 py-1.5 border border-teal-200 rounded-lg bg-white"
                  />
                  {isLoadingDrive ? (
                    <div className="text-center py-4 text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                      <span>در حال دریافت لیست فایل‌ها...</span>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {filteredDriveFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectDriveFile(file)}
                          className="flex items-center justify-between p-2 bg-white hover:bg-teal-100 rounded-lg text-xs cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{file.id.substring(0, 10)}...</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    آدرس یا شناسه فایل شیت گوگل (Set_1400):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        const id = extractSpreadsheetId(e.target.value);
                        if (id) setSpreadsheetId(id);
                      }}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="flex-1 text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:border-teal-500 outline-hidden font-mono"
                    />
                    <button
                      onClick={() => loadGSheetInfo(spreadsheetId)}
                      disabled={isLoadingMetadata || isLoadingPreview}
                      className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shrink-0 shadow-xs"
                    >
                      {isLoadingMetadata || isLoadingPreview ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>بارگذاری اطلاعات شیت</span>
                    </button>
                  </div>
                </div>

                {metadata && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 bg-teal-50/50 p-3 rounded-xl border border-teal-100">
                    <span className="text-xs font-bold text-teal-900">انتخاب برگه/تب:</span>
                    <select
                      value={selectedSheetName}
                      onChange={(e) => {
                        setSelectedSheetName(e.target.value);
                        loadGSheetValues(spreadsheetId, e.target.value);
                      }}
                      className="text-xs bg-white border border-teal-200 rounded-lg px-3 py-1.5 focus:border-teal-500 outline-hidden font-medium text-slate-800"
                    >
                      {metadata.sheets.map((s) => (
                        <option key={s.title} value={s.title}>
                          {s.title} {s.rowCount ? `(${s.rowCount} ردیف)` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => loadGSheetValues(spreadsheetId, selectedSheetName)}
                      disabled={isLoadingPreview}
                      className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                      <span>بازخوانی مجدد تب</span>
                    </button>
                  </div>
                )}
              </div>
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
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    processExcelFile(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-teal-500 bg-teal-50/50'
                    : 'border-slate-300 hover:border-teal-400 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      processExcelFile(e.target.files[0]);
                    }
                  }}
                />
                <div className="w-12 h-12 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : 'انتخاب فایل Set_1400 (اکسل یا CSV)'}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  فایل را اینجا بکشید یا برای انتخاب کلیک کنید (.xlsx, .xls, .csv)
                </p>
              </div>

              {/* Sheet selector if multiple */}
              {excelSheets.length > 1 && parsedWorkbook && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">انتخاب شیت:</span>
                  <select
                    value={selectedExcelSheet}
                    onChange={(e) => {
                      setSelectedExcelSheet(e.target.value);
                      loadExcelSheetData(parsedWorkbook, e.target.value);
                    }}
                    className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-1.5 focus:border-teal-500 outline-hidden"
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

          {/* Data Preview Table */}
          {mappedRecords.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  پیش‌نمایش رکوردهای تطبیق‌یافته ({mappedRecords.length} ردیف)
                </span>
                <span className="text-teal-700 font-semibold text-[11px]">
                  تطبیق خودکار با ستون‌های شیت Data (Set_1400)
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-[11px] text-right whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                    <tr>
                      <th className="p-2 text-center">ردیف</th>
                      <th className="p-2">تاریخ</th>
                      <th className="p-2">ماه</th>
                      <th className="p-2">شیفت</th>
                      <th className="p-2">اپراتور</th>
                      <th className="p-2">چمبر</th>
                      <th className="p-2">محصول</th>
                      <th className="p-2 text-center">تعداد فینگر</th>
                      <th className="p-2">واگن ۱</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mappedRecords.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono">{r.rowNumber || i + 1}</td>
                        <td className="p-2 font-mono">{r.date}</td>
                        <td className="p-2">{r.month}</td>
                        <td className="p-2">{r.shift}</td>
                        <td className="p-2">{r.operatorName}</td>
                        <td className="p-2 font-mono">چمبر {r.chamberNumber}</td>
                        <td className="p-2">{r.product}</td>
                        <td className="p-2 text-center font-mono font-bold text-teal-700">
                          {r.fingerCount}
                        </td>
                        <td className="p-2 font-mono">{r.car1_number}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            {isImporting && (
              <span className="flex items-center gap-2 text-teal-700 font-bold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                در حال ذخیره: {importProgress.current} از {importProgress.total} رکورد...
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isImporting}
              className="text-xs font-semibold px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 transition-all"
            >
              انصراف
            </button>
            <button
              onClick={handleExecuteImport}
              disabled={isImporting || mappedRecords.length === 0}
              className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold px-6 py-2 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <FileUp className="w-4 h-4" />
              <span>
                {isImporting
                  ? 'در حال ذخیره‌سازی...'
                  : `ذخیره ${mappedRecords.length.toLocaleString('fa-IR')} رکورد در دیتابیس`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
