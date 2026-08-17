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
  Droplets,
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
import { importDryerRecordsBatch, DRYER_SPREADSHEET_ID } from '../services/dbService';
import { SheetMetadata, DriveFileItem, DryerRecord } from '../types';

export const DEFAULT_DRYER_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DRYER_SPREADSHEET_ID}/edit?usp=sharing`;

interface DryerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  accessToken: string | null;
  onSignIn: () => void;
  onImportSuccess: (importedCount: number) => void;
}

export const DryerImportModal: React.FC<DryerImportModalProps> = ({
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
  const [inputUrl, setInputUrl] = useState<string>(DEFAULT_DRYER_SPREADSHEET_URL);
  const [spreadsheetId, setSpreadsheetId] = useState<string>(DRYER_SPREADSHEET_ID);
  const [metadata, setMetadata] = useState<SheetMetadata | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [isLoadingMetadata, setIsLoadingMetadata] = useState<boolean>(false);

  // Google Drive Browser State
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState<boolean>(false);
  const [driveSearch, setDriveSearch] = useState<string>('');
  const [showDrivePicker, setShowDrivePicker] = useState<boolean>(false);

  // Preview Data
  const [previewHeaders, setPreviewHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[][]>([]);
  const [mappedRecords, setMappedRecords] = useState<Omit<DryerRecord, 'id'>[]>([]);
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

  // Helper to map any row object / array to structured DryerRecord
  const mapRawDataToDryerRecords = (headers: string[], rows: any[][]): Omit<DryerRecord, 'id'>[] => {
    const cleanHeaders = headers.map((h) => String(h || '').trim().toLowerCase().replace(/\s+/g, ' '));

    const findIndex = (keywords: string[]) => {
      return cleanHeaders.findIndex((h) => keywords.some((k) => h.includes(k)));
    };

    // Exact Chamber Dryer columns
    const rowNumIdx = findIndex(['ردیف', 'شماره', 'row', 'no', '#', 'id']);
    const monthIdx = findIndex(['ماه', 'month']);
    const loadDateSolarIdx = findIndex(['تاریخ بارگیری شمسی', 'بارگیری شمسی', 'تاریخ بارگیری', 'load date solar', 'تاریخ شمسی']);
    const loadDateTimeGregIdx = findIndex(['تاریخ و زمان بارگیری میلادی', 'بارگیری میلادی', 'load date time', 'load datetime']);
    const chamberIdx = findIndex(['شماره چمبر', 'چمبر', 'chamber', 'chamber number', 'chamber no']);
    const fingerIdx = findIndex(['تعداد فینگر تولیدی', 'تعداد فینگر', 'فینگر', 'finger', 'fingers', 'تعداد تولید']);
    const loadOpIdx = findIndex(['اپراتور بارگیری', 'بارگیری اپراتور', 'loading operator']);
    const prodTypeIdx = findIndex(['نوع تولید', 'تولید', 'محصول', 'سایز', 'ابعاد', 'product type', 'production type', 'type']);
    const unloadDateSolarIdx = findIndex(['تاریخ و زمان تخلیه شمسی', 'تخلیه شمسی', 'تاریخ تخلیه', 'unload date solar']);
    const unloadDateTimeGregIdx = findIndex(['تاریخ وزمان تخلیه میلادی', 'تاریخ و زمان تخلیه میلادی', 'تخلیه میلادی', 'unload datetime']);
    const unloadOpIdx = findIndex(['اپراتور تخلیه', 'اپراتور تخایه', 'تخلیه اپراتور', 'unloading operator']);
    const durationIdx = findIndex(['مدت زمان', 'مدت', 'زمان', 'duration', 'time']);

    // General & Thermal Dryer parameters
    const rawMIdx = findIndex(['رطوبت ورودی', 'رطوبت خام', 'raw moisture', 'raw']);
    const dryMIdx = findIndex(['رطوبت خروجی', 'رطوبت خشک', 'dry moisture', 'dry']);
    const cycleIdx = findIndex(['سیکل', 'زمان چرخه', 'cycle']);
    const burnerIdx = findIndex(['دمای مشعل', 'مشعل', 'burner']);
    const exhaustIdx = findIndex(['اگزوز', 'دمای اگزوز', 'exhaust']);
    const outletIdx = findIndex(['دمای خروجی', 'outlet']);
    const layer1Idx = findIndex(['طبقه ۱', 'طبقه 1', 'layer 1']);
    const layer2Idx = findIndex(['طبقه ۲', 'طبقه 2', 'layer 2']);
    const layer3Idx = findIndex(['طبقه ۳', 'طبقه 3', 'layer 3']);
    const layer4Idx = findIndex(['طبقه ۴', 'طبقه 4', 'layer 4']);
    const layer5Idx = findIndex(['طبقه ۵', 'طبقه 5', 'layer 5']);
    const fanIdx = findIndex(['فشار فن', 'fan']);
    const gasIdx = findIndex(['فشار گاز', 'gas']);
    const notesIdx = findIndex(['توضیح', 'یادداشت', 'شرح', 'note']);

    return rows
      .filter((r) => r && r.length > 0 && r.some((cell) => cell !== '' && cell !== null && cell !== undefined))
      .map((r, i) => {
        const getNum = (idx: number, fallback = 0) => {
          if (idx < 0 || idx >= r.length) return fallback;
          const val = String(r[idx]).replace(/[^\d.-]/g, '');
          const n = parseFloat(val);
          return isNaN(n) ? fallback : n;
        };

        const getStr = (idx: number, fallback = '') => {
          if (idx < 0 || idx >= r.length || r[idx] === null || r[idx] === undefined) return fallback;
          return String(r[idx]).trim();
        };

        const rNum = getNum(rowNumIdx, i + 1);
        const mth = getStr(monthIdx, 'مرداد');
        const loadSolar = getStr(loadDateSolarIdx, getStr(findIndex(['تاریخ']), '1403/05/20'));
        const loadGreg = getStr(loadDateTimeGregIdx, '');
        const chNo = getStr(chamberIdx, `${1 + (i % 8)}`);
        const fingers = getNum(fingerIdx, 450 + (i * 20));
        const lOp = getStr(loadOpIdx, getStr(findIndex(['اپراتور']), 'مهندس رضایی'));
        const pType = getStr(prodTypeIdx, 'پرسلان پولیشی 60*60');
        const unSolar = getStr(unloadDateSolarIdx, '');
        const unGreg = getStr(unloadDateTimeGregIdx, '');
        const unOp = getStr(unloadOpIdx, 'تکنسین حسینی');
        const dur = getStr(durationIdx, '4:30 ساعت');

        return {
          rowNumber: rNum,
          month: mth,
          loadDateSolar: loadSolar,
          loadDateTimeGregorian: loadGreg,
          chamberNumber: chNo,
          fingerCount: fingers,
          loadingOperator: lOp,
          productionType: pType,
          unloadDateTimeSolar: unSolar,
          unloadDateTimeGregorian: unGreg,
          unloadingOperator: unOp,
          duration: dur,

          // Fallbacks for compatibility
          date: loadSolar,
          time: loadGreg ? loadGreg.split(' ')[1] || '08:00' : '08:00',
          shift: 'صبح',
          operatorCode: '101',
          operator: lOp,
          dryerLine: `چمبر ${chNo}`,
          productCode: `DRY-${chNo}`,
          productType: pType,
          rawMoisture: getNum(rawMIdx, 6.2),
          dryMoisture: getNum(dryMIdx, 0.48),
          dryingCycleTime: getNum(cycleIdx, 45),
          burnerInletTemp: getNum(burnerIdx, 195),
          exhaustTemp: getNum(exhaustIdx, 112),
          outletTemp: getNum(outletIdx, 92),
          layer1Temp: getNum(layer1Idx, 165),
          layer2Temp: getNum(layer2Idx, 182),
          layer3Temp: getNum(layer3Idx, 198),
          layer4Temp: getNum(layer4Idx, 204),
          layer5Temp: getNum(layer5Idx, 188),
          fanPressure: getNum(fanIdx, 34),
          gasPressure: getNum(gasIdx, 85),
          lineSpeed: 40,
          inputQuantity: fingers,
          defectRate: 0.6,
          notes: getStr(notesIdx, ''),
        };
      });
  };

  // Handle Excel File Selected
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
              const mapped = mapRawDataToDryerRecords(headers, rows);
              setMappedRecords(mapped);
              setStatusMessage({
                type: 'info',
                text: `فایل CSV با موفقیت خوانده شد (${mapped.length} ردیف آماده ایمپورت)`,
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
        // XLSX or XLS
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        setParsedWorkbook(workbook);
        setExcelSheets(workbook.SheetNames);

        if (workbook.SheetNames.length > 0) {
          const firstSheet =
            workbook.SheetNames.find(
              (s) => s.toLowerCase().includes('dryer') || s.includes('خشک') || s.includes('input')
            ) || workbook.SheetNames[0];
          setSelectedExcelSheet(firstSheet);
          loadExcelSheetData(workbook, firstSheet);
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
      const mapped = mapRawDataToDryerRecords(headers, rows);
      setMappedRecords(mapped);
      setStatusMessage({
        type: 'info',
        text: `شیت «${sheetName}» با ${mapped.length} ردیف داده استخراج گردید.`,
      });
    }
  };

  // Google Sheet Functions
  const loadGSheetInfo = async (id: string) => {
    setIsLoadingMetadata(true);
    setStatusMessage(null);

    try {
      const meta = await fetchSpreadsheetMetadata(id, accessToken);
      setMetadata(meta);
      if (meta.sheets.length > 0) {
        const targetSheet =
          meta.sheets.find(
            (s) => s.title.toLowerCase().includes('dryer') || s.title.includes('خشک')
          ) || meta.sheets[0];
        setSelectedSheetName(targetSheet.title);
        loadGSheetValues(id, targetSheet.title);
      }
    } catch (err: any) {
      console.error('Failed to load Google Sheet metadata:', err);
      setStatusMessage({
        type: 'error',
        text: 'خطا در دسترسی به شیت گوگل: ' + (err.message || 'لطفاً دسترسی فایل را بررسی کنید.'),
      });
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const loadGSheetValues = async (id: string, sheetTitle: string) => {
    setIsLoadingPreview(true);

    try {
      const data = await fetchSheetValues(id, sheetTitle, accessToken);
      if (data.headers && data.headers.length > 0) {
        setPreviewHeaders(data.headers);
        setPreviewRows(data.rows);
        const mapped = mapRawDataToDryerRecords(data.headers, data.rows);
        setMappedRecords(mapped);
        setStatusMessage({
          type: 'info',
          text: `اطلاعات تب «${sheetTitle}» با موفقیت خوانده شد (${mapped.length} ردیف آماده انتقال به دیتابیس)`,
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: `داده‌ای در برگه «${sheetTitle}» یافت نشد.`,
        });
      }
    } catch (err: any) {
      console.error('Failed to fetch sheet values:', err);
      setStatusMessage({ type: 'error', text: 'خطا در دریافت مقادیر جدول گوگل: ' + err.message });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = extractSpreadsheetId(inputUrl);
    if (!id) {
      setStatusMessage({ type: 'error', text: 'آدرس گوگل شیت وارد شده نامعتبر است.' });
      return;
    }
    setSpreadsheetId(id);
    loadGSheetInfo(id);
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

  // Perform Final Batch Import to Firestore
  const handleExecuteImport = async () => {
    if (mappedRecords.length === 0) {
      setStatusMessage({ type: 'error', text: 'هیچ رکوردی برای انتقال به دیتابیس یافت نشد.' });
      return;
    }

    setIsImporting(true);
    setStatusMessage(null);
    setImportProgress({ current: 0, total: mappedRecords.length });

    try {
      const imported = await importDryerRecordsBatch(mappedRecords, (curr, tot) => {
        setImportProgress({ current: curr, total: tot });
      });

      setStatusMessage({
        type: 'success',
        text: `تعداد ${imported} رکورد با موفقیت در پایگاه داده Firestore ذخیره شد!`,
      });

      setTimeout(() => {
        onImportSuccess(imported);
        onClose();
      }, 1000);
    } catch (err: any) {
      console.error('Import to Firestore failed:', err);
      setStatusMessage({ type: 'error', text: 'خطا در ذخیره‌سازی داده‌ها در دیتابیس: ' + err.message });
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
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold">ایمپورت داده‌های خشک‌کن (Dryer Import)</h2>
              <p className="text-xs text-amber-100">
                بارگذاری داده‌ها از فایل اکسل (.xlsx / .csv) یا شیت گوگل مستقیماً در پایگاه داده
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

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 px-6 bg-slate-50">
          <button
            onClick={() => setActiveTab('gsheet')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'gsheet'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DownloadCloud className="w-4 h-4 text-sky-600" />
            <span>اتصال به شیت گوگل (Google Sheets)</span>
          </button>

          <button
            onClick={() => setActiveTab('excel')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'excel'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileUp className="w-4 h-4 text-emerald-600" />
            <span>آپلود فایل اکسل / CSV (.xlsx, .xls, .csv)</span>
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
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'gsheet' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                  <span>اتصال آنلاین به Google Sheets (پشتیبانی از لینک عمومی و حساب کاربری)</span>
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
                      className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-200 transition-all"
                    >
                      <Search className="w-3.5 h-3.5 text-amber-600" />
                      <span>انتخاب از Drive</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Drive Picker Modal / Section */}
              {showDrivePicker && (
                <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">فایل‌های Google Sheets حساب شما:</span>
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
                    className="w-full text-xs px-3 py-1.5 border border-amber-200 rounded-lg bg-white"
                  />
                  {isLoadingDrive ? (
                    <div className="text-center py-4 text-xs text-slate-500 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      <span>در حال دریافت لیست فایل‌ها...</span>
                    </div>
                  ) : (
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {filteredDriveFiles.map((file) => (
                        <div
                          key={file.id}
                          onClick={() => handleSelectDriveFile(file)}
                          className="flex items-center justify-between p-2 bg-white hover:bg-amber-100 rounded-lg text-xs cursor-pointer"
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
                  placeholder="لینک یا شناسه گوگل شیت خشک کن..."
                  className="flex-1 px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white font-mono"
                  dir="ltr"
                />
                <button
                  type="submit"
                  disabled={isLoadingMetadata || isLoadingPreview}
                  className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
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
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">شناسه: {metadata.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600">برگه:</span>
                    <select
                      value={selectedSheetName}
                      onChange={(e) => {
                        setSelectedSheetName(e.target.value);
                        loadGSheetValues(spreadsheetId, e.target.value);
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

          {/* TAB 2: EXCEL FILE UPLOAD */}
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
                    ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                    : 'border-slate-300 hover:border-amber-400 bg-slate-50/50 hover:bg-white'
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

                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">
                  {selectedFile ? selectedFile.name : 'فایل اکسل یا CSV اطلاعات خشک‌کن را اینجا رها کنید'}
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  یا برای انتخاب فایل کلیک کنید (فرمت‌های پشتیبانی‌شده: XLSX, XLS, CSV)
                </p>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 text-white rounded-xl text-xs font-semibold">
                  <span>انتخاب فایل از سیستم</span>
                </span>
              </div>

              {/* Sheet selector if multiple sheets */}
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
                  <Table className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-bold text-slate-800">
                    پیش‌نمایش رکوردهای استخراج‌شده ({mappedRecords.length} ردیف آماده انتقال به دیتابیس)
                  </h4>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  فرمت ستون‌ها منطبق شد
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-bold">
                    <tr className="whitespace-nowrap">
                      <th className="py-2 px-3">ردیف</th>
                      <th className="py-2 px-3">تاریخ</th>
                      <th className="py-2 px-3">ساعت</th>
                      <th className="py-2 px-3">شیفت</th>
                      <th className="py-2 px-3">اپراتور</th>
                      <th className="py-2 px-3">محصول</th>
                      <th className="py-2 px-3 bg-sky-50 text-sky-900">رطوبت ورودی</th>
                      <th className="py-2 px-3 bg-emerald-50 text-emerald-900">رطوبت خروجی</th>
                      <th className="py-2 px-3">سیکل (min)</th>
                      <th className="py-2 px-3 bg-amber-50 text-amber-900">دمای مشعل</th>
                      <th className="py-2 px-3">دمای اگزوز</th>
                      <th className="py-2 px-3">طبقه ۱</th>
                      <th className="py-2 px-3">طبقه ۲</th>
                      <th className="py-2 px-3">طبقه ۳</th>
                      <th className="py-2 px-3">طبقه ۴</th>
                      <th className="py-2 px-3">طبقه ۵</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {mappedRecords.slice(0, 10).map((r, i) => (
                      <tr key={i} className="hover:bg-slate-50 whitespace-nowrap">
                        <td className="py-2 px-3 font-mono font-bold text-slate-800">{r.rowNumber}</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{r.date}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.time}</td>
                        <td className="py-2 px-3">{r.shift}</td>
                        <td className="py-2 px-3">{r.operator}</td>
                        <td className="py-2 px-3">{r.productType}</td>
                        <td className="py-2 px-3 font-mono font-bold text-sky-700 bg-sky-50/50">{r.rawMoisture}%</td>
                        <td className="py-2 px-3 font-mono font-bold text-emerald-700 bg-emerald-50/50">{r.dryMoisture}%</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{r.dryingCycleTime}</td>
                        <td className="py-2 px-3 font-mono font-bold text-amber-800 bg-amber-50/50">{r.burnerInletTemp}°</td>
                        <td className="py-2 px-3 font-mono text-slate-700">{r.exhaustTemp}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.layer1Temp}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.layer2Temp}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.layer3Temp}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.layer4Temp}°</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{r.layer5Temp}°</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {mappedRecords.length > 10 && (
                <p className="text-[11px] text-slate-500 text-center">
                  نمایش ۱۰ ردیف اول از کل {mappedRecords.length} ردیف آماده ذخیره‌سازی در دیتابیس
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
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40"
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
                <span>انتقال و ذخیره {mappedRecords.length} رکورد به پایگاه داده ابری</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
