import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { initAuth, googleSignIn, logout } from './lib/firebase';
import {
  subscribeToKilnRecords,
  seedInitialKilnRecordsIfEmpty,
  subscribeToDryerRecords,
  seedInitialDryerRecordsIfEmpty,
  subscribeToSettingRecords,
  seedInitialSettingRecordsIfEmpty,
  addSettingRecord,
  updateSettingRecord,
  deleteSettingRecord,
} from './services/dbService';
import { KilnRecord, DryerRecord, SettingRecord } from './types';

import { Header, AppPage } from './components/Header';
import { KilnInputForm } from './components/KilnInputForm';
import { KilnRecordsTable } from './components/KilnRecordsTable';
import { KilnAnalytics } from './components/KilnAnalytics';
import { GoogleSheetImportModal } from './components/GoogleSheetImportModal';

import { DryerInputForm } from './components/DryerInputForm';
import { DryerRecordsTable } from './components/DryerRecordsTable';
import { DryerAnalytics } from './components/DryerAnalytics';
import { DryerImportModal } from './components/DryerImportModal';

import { SettingInputForm } from './components/SettingInputForm';
import { SettingRecordsTable } from './components/SettingRecordsTable';
import { SettingImportModal } from './components/SettingImportModal';

import {
  PlusCircle,
  Table as TableIcon,
  BarChart3,
  Flame,
  Droplets,
  Truck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Kiln State
  const [kilnRecords, setKilnRecords] = useState<KilnRecord[]>([]);
  const [isKilnLoading, setIsKilnLoading] = useState<boolean>(true);
  const [kilnError, setKilnError] = useState<string | null>(null);

  // Dryer State
  const [dryerRecords, setDryerRecords] = useState<DryerRecord[]>([]);
  const [isDryerLoading, setIsDryerLoading] = useState<boolean>(true);
  const [dryerError, setDryerError] = useState<string | null>(null);

  // Setting State (Set_1400 / Data)
  const [settingRecords, setSettingRecords] = useState<SettingRecord[]>([]);
  const [isSettingLoading, setIsSettingLoading] = useState<boolean>(true);
  const [settingError, setSettingError] = useState<string | null>(null);

  // Active Page: 'kiln' | 'dryer' | 'setting'
  const [activePage, setActivePage] = useState<AppPage>('setting');

  // Sub-tabs for Kiln, Dryer, and Setting
  const [kilnTab, setKilnTab] = useState<'form' | 'records' | 'analytics'>('form');
  const [dryerTab, setDryerTab] = useState<'form' | 'records' | 'analytics'>('form');
  const [settingTab, setSettingTab] = useState<'form' | 'records'>('form');

  // Modals & Editing States
  const [editingKilnRecord, setEditingKilnRecord] = useState<KilnRecord | null>(null);
  const [isKilnFormModalOpen, setIsKilnFormModalOpen] = useState<boolean>(false);
  const [isKilnImportModalOpen, setIsKilnImportModalOpen] = useState<boolean>(false);

  const [editingDryerRecord, setEditingDryerRecord] = useState<DryerRecord | null>(null);
  const [isDryerFormModalOpen, setIsDryerFormModalOpen] = useState<boolean>(false);
  const [isDryerImportModalOpen, setIsDryerImportModalOpen] = useState<boolean>(false);

  const [editingSettingRecord, setEditingSettingRecord] = useState<SettingRecord | null>(null);
  const [isSettingImportModalOpen, setIsSettingImportModalOpen] = useState<boolean>(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to real-time Firestore database for Kiln, Dryer, and Setting
  useEffect(() => {
    setIsKilnLoading(true);
    const unsubscribeKiln = subscribeToKilnRecords(
      (data) => {
        setKilnRecords(data);
        setIsKilnLoading(false);
        setKilnError(null);
      },
      (err) => {
        console.error('Kiln Firestore error:', err);
        setKilnError('خطا در ارتباط با دیتابیس کوره: ' + err.message);
        setIsKilnLoading(false);
      }
    );

    setIsDryerLoading(true);
    const unsubscribeDryer = subscribeToDryerRecords(
      (data) => {
        setDryerRecords(data);
        setIsDryerLoading(false);
        setDryerError(null);
      },
      (err) => {
        console.error('Dryer Firestore error:', err);
        setDryerError('خطا در ارتباط با دیتابیس خشک‌کن: ' + err.message);
        setIsDryerLoading(false);
      }
    );

    setIsSettingLoading(true);
    const unsubscribeSetting = subscribeToSettingRecords(
      (data) => {
        setSettingRecords(data);
        setIsSettingLoading(false);
        setSettingError(null);
      },
      (err) => {
        console.error('Setting Firestore error:', err);
        setSettingError('خطا در ارتباط با دیتابیس ستینگ: ' + err.message);
        setIsSettingLoading(false);
      }
    );

    const unsubscribeAuth = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );

    return () => {
      if (typeof unsubscribeKiln === 'function') unsubscribeKiln();
      if (typeof unsubscribeDryer === 'function') unsubscribeDryer();
      if (typeof unsubscribeSetting === 'function') unsubscribeSetting();
      if (typeof unsubscribeAuth === 'function') unsubscribeAuth();
    };
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        if (result.accessToken) setAccessToken(result.accessToken);
        showToast('با موفقیت وارد حساب شدید.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('خطا در ورود: ' + (err?.message || 'خطای نامشخص'));
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    showToast('از حساب کاربری خارج شدید.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Seed Kiln
  const handleSeedKiln = async () => {
    try {
      setIsKilnLoading(true);
      const count = await seedInitialKilnRecordsIfEmpty();
      showToast(`${count} ردیف نمونه کوره با موفقیت ثبت شد.`);
    } catch (err: any) {
      console.error('Kiln seed error:', err);
      showToast('خطا در درج داده‌های نمونه کوره');
    } finally {
      setIsKilnLoading(false);
    }
  };

  // Seed Dryer
  const handleSeedDryer = async () => {
    try {
      setIsDryerLoading(true);
      const count = await seedInitialDryerRecordsIfEmpty();
      showToast(`${count} ردیف نمونه خشک‌کن با موفقیت در دیتابیس ثبت شد.`);
    } catch (err: any) {
      console.error('Dryer seed error:', err);
      showToast('خطا در درج داده‌های نمونه خشک‌کن');
    } finally {
      setIsDryerLoading(false);
    }
  };

  // Seed Setting
  const handleSeedSetting = async () => {
    try {
      setIsSettingLoading(true);
      const count = await seedInitialSettingRecordsIfEmpty();
      showToast(`${count} ردیف نمونه ستینگ و بارگیری (Set_1400) با موفقیت در دیتابیس ثبت شد.`);
    } catch (err: any) {
      console.error('Setting seed error:', err);
      showToast('خطا در درج داده‌های نمونه ستینگ');
    } finally {
      setIsSettingLoading(false);
    }
  };

  // Setting CRUD Handlers
  const handleSaveSettingRecord = async (
    recordData: Omit<SettingRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    if (editingSettingRecord) {
      await updateSettingRecord(editingSettingRecord.id, recordData);
      setEditingSettingRecord(null);
      showToast('تغییرات رکورد ستینگ با موفقیت ذخیره شد!');
    } else {
      await addSettingRecord(recordData);
      showToast('رکورد جدید ستینگ در پایگاه داده ثبت شد!');
    }
  };

  const handleDeleteSettingRecord = async (id: string) => {
    try {
      await deleteSettingRecord(id);
      showToast('رکورد ستینگ حذف شد.');
    } catch (err: any) {
      console.error('Delete setting record failed:', err);
      showToast('خطا در حذف رکورد ستینگ');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activePage === 'kiln') {
      if (kilnRecords.length === 0) return;
      const headers = ['ردیف', 'تاریخ', 'اپراتور', 'ساعت', 'واگن ورودی', 'نوع محصول', 'دمای اگزوز', 'دمای خروجی'];
      const csvRows = kilnRecords.map((r) => [r.rowNumber || '', r.date || '', r.operator || '', r.time || '', r.inputCar || '', r.productType || '', r.exhaustTemp || 0, r.outputCar || '']);
      const csv = '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kiln_records_${Date.now()}.csv`;
      a.click();
    } else if (activePage === 'dryer') {
      if (dryerRecords.length === 0) return;
      const headers = ['ردیف', 'تاریخ', 'ساعت', 'شیفت', 'اپراتور', 'خط خشک‌کن', 'محصول', 'رطوبت ورودی', 'رطوبت خروجی', 'دمای مشعل', 'دمای اگزوز', 'درصد ضایعات'];
      const csvRows = dryerRecords.map((r) => [r.rowNumber || '', r.date || '', r.time || '', r.shift || '', r.operator || '', r.dryerLine || '', r.productType || '', r.rawMoisture || 0, r.dryMoisture || 0, r.burnerInletTemp || 0, r.exhaustTemp || 0, r.defectRate || 0]);
      const csv = '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dryer_records_${Date.now()}.csv`;
      a.click();
    } else {
      if (settingRecords.length === 0) return;
      const headers = ['ردیف', 'تاریخ', 'ماه', 'شیفت', 'اپراتور', 'شماره چمبر', 'محصول', 'تعداد فینگر', 'واگن ۱', 'واگن ۲', 'واگن ۳', 'واگن ۴', 'کل خشت بسته بندی'];
      const csvRows = settingRecords.map((r) => [r.rowNumber || '', r.date || '', r.month || '', r.shift || '', r.operatorName || '', r.chamberNumber || '', r.product || '', r.fingerCount || 0, r.car1_number || '', r.car2_number || '', r.car3_number || '', r.car4_number || '', r.totalPackagedBricks || 0]);
      const csv = '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `setting_records_${Date.now()}.csv`;
      a.click();
    }
  };

  const latestKilnRowNumber = kilnRecords.length > 0
    ? Math.max(...kilnRecords.map((r) => r.rowNumber || 0))
    : 0;

  const latestDryerRowNumber = dryerRecords.length > 0
    ? Math.max(...dryerRecords.map((r) => r.rowNumber || 0))
    : 0;

  const latestSettingRowNumber = settingRecords.length > 0
    ? Math.max(...settingRecords.map((r) => r.rowNumber || 0))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-teal-100 selection:text-teal-900" dir="rtl">
      {/* Header */}
      <Header
        user={user}
        activePage={activePage}
        onSelectPage={setActivePage}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenNewForm={() => {
          if (activePage === 'kiln') {
            setEditingKilnRecord(null);
            setIsKilnFormModalOpen(true);
          } else if (activePage === 'dryer') {
            setEditingDryerRecord(null);
            setIsDryerFormModalOpen(true);
          } else {
            setEditingSettingRecord(null);
            setSettingTab('form');
          }
        }}
        onOpenImportModal={() => {
          if (activePage === 'kiln') {
            setIsKilnImportModalOpen(true);
          } else if (activePage === 'dryer') {
            setIsDryerImportModalOpen(true);
          } else {
            setIsSettingImportModalOpen(true);
          }
        }}
        onExportCsv={handleExportCsv}
        totalDbRecords={kilnRecords.length}
        totalDryerRecords={dryerRecords.length}
        totalSettingRecords={settingRecords.length}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-medium animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ======================= PAGE 1: SETTING (ستینگ و بارگیری واگن‌ها - Set_1400) ======================= */}
        {activePage === 'setting' && (
          <>
            {settingError && (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-teal-900">وضعیت اتصال به دیتابیس ستینگ و بارگیری</h4>
                  <p className="text-teal-700 mt-0.5">{settingError}</p>
                </div>
                <button
                  onClick={handleSeedSetting}
                  className="px-3 py-1.5 bg-teal-800 text-white text-xs font-semibold rounded-lg hover:bg-teal-900 transition-colors"
                >
                  ایجاد داده‌های نمونه
                </button>
              </div>
            )}

            {/* Navigation Tabs for Setting Sub-views */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="setting-tab-form"
                  onClick={() => {
                    setSettingTab('form');
                    setEditingSettingRecord(null);
                  }}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    settingTab === 'form'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>فرم ثبت داده‌های شیت Data (Set_1400)</span>
                </button>

                <button
                  id="setting-tab-records"
                  onClick={() => setSettingTab('records')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    settingTab === 'records'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>جدول رکوردهای ستینگ ({settingRecords.length})</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSettingImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ایمپورت اکسل / شیت (Set_1400)</span>
                </button>
                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
            </div>

            {/* Empty State Banner if no setting records */}
            {!isSettingLoading && settingRecords.length === 0 && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs mb-6 text-center max-w-2xl mx-auto">
                <div className="w-14 h-14 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">دیتابیس ستینگ و بارگیری واگن‌ها (Set_1400) آماده است</h3>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  می‌توانید اطلاعات شیت Data (شامل نوبت کاری، پرسنل، چمبر، ۴ واگن بارگیری، خشت‌ها، ضایعات و راندمان خط) را وارد کنید یا مستقیماً از فایل اکسل/شیت گوگل ایمپورت نمایید.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setIsSettingImportModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>ایمپورت مستقیم فایل Set_1400</span>
                  </button>
                  <button
                    onClick={handleSeedSetting}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-teal-900 bg-teal-100 hover:bg-teal-200 border border-teal-300 rounded-xl transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>ایجاد داده‌های اولیه نمونه</span>
                  </button>
                </div>
              </div>
            )}

            {/* Setting Tab Content */}
            {settingTab === 'form' && (
              <div className="space-y-8">
                <SettingInputForm
                  onSave={handleSaveSettingRecord}
                  editingRecord={editingSettingRecord}
                  onCancelEdit={() => setEditingSettingRecord(null)}
                  nextRowNumber={latestSettingRowNumber + 1}
                />

                {settingRecords.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-600">
                        آخرین رکوردهای ستینگ و بارگیری ({settingRecords.length} ردیف کل)
                      </h4>
                      <button
                        onClick={() => setSettingTab('records')}
                        className="text-xs text-teal-700 hover:text-teal-900 font-bold"
                      >
                        مشاهده کل جدول &larr;
                      </button>
                    </div>
                    <SettingRecordsTable
                      records={settingRecords.slice(0, 5)}
                      onEdit={(record) => {
                        setEditingSettingRecord(record);
                        setSettingTab('form');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      onDelete={handleDeleteSettingRecord}
                    />
                  </div>
                )}
              </div>
            )}

            {settingTab === 'records' && (
              <SettingRecordsTable
                records={settingRecords}
                onEdit={(record) => {
                  setEditingSettingRecord(record);
                  setSettingTab('form');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onDelete={handleDeleteSettingRecord}
              />
            )}
          </>
        )}

        {/* ======================= PAGE 2: DRYER (اطلاعات خشک‌کن) ======================= */}
        {activePage === 'dryer' && (
          <>
            {dryerError && (
              <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-orange-900">وضعیت اتصال به دیتابیس خشک‌کن</h4>
                  <p className="text-orange-700 mt-0.5">{dryerError}</p>
                </div>
                <button
                  onClick={handleSeedDryer}
                  className="px-3 py-1.5 bg-orange-800 text-white text-xs font-semibold rounded-lg hover:bg-orange-900 transition-colors"
                >
                  ایجاد داده‌های اولیه
                </button>
              </div>
            )}

            {/* Navigation Tabs for Dryer Sub-views */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="dryer-tab-form"
                  onClick={() => setDryerTab('form')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    dryerTab === 'form'
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>فرم ورود اطلاعات خشک‌کن</span>
                </button>

                <button
                  id="dryer-tab-records"
                  onClick={() => setDryerTab('records')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    dryerTab === 'records'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>جدول رکوردهای خشک‌کن ({dryerRecords.length})</span>
                </button>

                <button
                  id="dryer-tab-analytics"
                  onClick={() => setDryerTab('analytics')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    dryerTab === 'analytics'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>تحلیل رطوبت و دمای طبقات</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsDryerImportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-xl transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ایمپورت اکسل / شیت</span>
                </button>

                <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
            </div>

            {/* Dryer Sub-tabs */}
            {dryerTab === 'form' && (
              <div>
                <DryerInputForm
                  latestRowNumber={latestDryerRowNumber}
                  onSuccess={() => showToast('اطلاعات خشک‌کن با موفقیت در دیتابیس ثبت شد!')}
                />

                {dryerRecords.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-600">
                        آخرین رکوردهای خشک‌کن ({dryerRecords.length} ردیف کل)
                      </h4>
                      <button
                        onClick={() => setDryerTab('records')}
                        className="text-xs text-amber-700 hover:text-amber-900 font-bold"
                      >
                        مشاهده کل جدول &larr;
                      </button>
                    </div>
                    <DryerRecordsTable
                      records={dryerRecords.slice(0, 5)}
                      onEditRecord={(record) => {
                        setEditingDryerRecord(record);
                        setIsDryerFormModalOpen(true);
                      }}
                      onOpenNewForm={() => {
                        setEditingDryerRecord(null);
                        setIsDryerFormModalOpen(true);
                      }}
                      onOpenImportModal={() => setIsDryerImportModalOpen(true)}
                      onSeedDatabase={handleSeedDryer}
                    />
                  </div>
                )}
              </div>
            )}

            {dryerTab === 'records' && (
              <DryerRecordsTable
                records={dryerRecords}
                onEditRecord={(record) => {
                  setEditingDryerRecord(record);
                  setIsDryerFormModalOpen(true);
                }}
                onOpenNewForm={() => {
                  setEditingDryerRecord(null);
                  setIsDryerFormModalOpen(true);
                }}
                onOpenImportModal={() => setIsDryerImportModalOpen(true)}
                onSeedDatabase={handleSeedDryer}
              />
            )}

            {dryerTab === 'analytics' && <DryerAnalytics records={dryerRecords} />}
          </>
        )}

        {/* ======================= PAGE 3: KILN (کوره پخت) ======================= */}
        {activePage === 'kiln' && (
          <>
            {kilnError && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-xs">
                  <h4 className="font-bold text-amber-900">وضعیت اتصال به دیتابیس کوره</h4>
                  <p className="text-amber-700 mt-0.5">{kilnError}</p>
                </div>
                <button
                  onClick={handleSeedKiln}
                  className="px-3 py-1.5 bg-amber-800 text-white text-xs font-semibold rounded-lg hover:bg-amber-900 transition-colors"
                >
                  ایجاد داده‌های اولیه
                </button>
              </div>
            )}

            {/* Navigation Tabs for Kiln Sub-views */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  id="kiln-tab-form"
                  onClick={() => setKilnTab('form')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    kilnTab === 'form'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>فرم ثبت داده‌های کوره</span>
                </button>

                <button
                  id="kiln-tab-records"
                  onClick={() => setKilnTab('records')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    kilnTab === 'records'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <TableIcon className="w-4 h-4" />
                  <span>جدول رکوردهای کوره ({kilnRecords.length})</span>
                </button>

                <button
                  id="kiln-tab-analytics"
                  onClick={() => setKilnTab('analytics')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    kilnTab === 'analytics'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>تحلیل و نمودارهای دمایی کوره</span>
                </button>
              </div>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Firestore Live</span>
              </div>
            </div>

            {/* Kiln Content Tabs */}
            {kilnTab === 'form' && (
              <div>
                <KilnInputForm
                  latestRowNumber={latestKilnRowNumber}
                  onSuccess={() => showToast('اطلاعات کوره با موفقیت ثبت شد!')}
                />

                {kilnRecords.length > 0 && (
                  <div className="mt-8">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-600">
                        آخرین رکوردهای کوره ({kilnRecords.length} ردیف کل)
                      </h4>
                      <button
                        onClick={() => setKilnTab('records')}
                        className="text-xs text-amber-700 hover:text-amber-900 font-bold"
                      >
                        مشاهده کل جدول &larr;
                      </button>
                    </div>
                    <KilnRecordsTable
                      records={kilnRecords.slice(0, 5)}
                      onEditRecord={(record) => {
                        setEditingKilnRecord(record);
                        setIsKilnFormModalOpen(true);
                      }}
                      onOpenNewForm={() => {
                        setEditingKilnRecord(null);
                        setIsKilnFormModalOpen(true);
                      }}
                      onOpenImportModal={() => setIsKilnImportModalOpen(true)}
                      onSeedDatabase={handleSeedKiln}
                    />
                  </div>
                )}
              </div>
            )}

            {kilnTab === 'records' && (
              <KilnRecordsTable
                records={kilnRecords}
                onEditRecord={(record) => {
                  setEditingKilnRecord(record);
                  setIsKilnFormModalOpen(true);
                }}
                onOpenNewForm={() => {
                  setEditingKilnRecord(null);
                  setIsKilnFormModalOpen(true);
                }}
                onOpenImportModal={() => setIsKilnImportModalOpen(true)}
                onSeedDatabase={handleSeedKiln}
              />
            )}

            {kilnTab === 'analytics' && <KilnAnalytics records={kilnRecords} />}
          </>
        )}

      </main>

      {/* ======================= MODALS ======================= */}

      {/* Setting Import Modal (Excel + CSV + Google Sheet for Set_1400 / Data) */}
      <SettingImportModal
        isOpen={isSettingImportModalOpen}
        onClose={() => setIsSettingImportModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleLogin}
        onImportSuccess={(count) => {
          showToast(`${count} رکورد ستینگ (Set_1400) با موفقیت به پایگاه داده اضافه شد.`);
        }}
      />

      {/* Kiln Edit Modal */}
      {isKilnFormModalOpen && (
        <KilnInputForm
          isModal
          editRecord={editingKilnRecord}
          latestRowNumber={latestKilnRowNumber}
          onSuccess={() => {
            setIsKilnFormModalOpen(false);
            setEditingKilnRecord(null);
            showToast(editingKilnRecord ? 'تغییرات کوره ذخیره شد!' : 'ردیف کوره در دیتابیس ثبت شد!');
          }}
          onCancel={() => {
            setIsKilnFormModalOpen(false);
            setEditingKilnRecord(null);
          }}
        />
      )}

      {/* Kiln Import Modal */}
      <GoogleSheetImportModal
        isOpen={isKilnImportModalOpen}
        onClose={() => setIsKilnImportModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleLogin}
        onImportSuccess={(count) => {
          showToast(`${count} ردیف با موفقیت به دیتابیس کوره افزوده شد.`);
        }}
      />

      {/* Dryer Edit Modal */}
      {isDryerFormModalOpen && (
        <DryerInputForm
          isModal
          editRecord={editingDryerRecord}
          latestRowNumber={latestDryerRowNumber}
          onSuccess={() => {
            setIsDryerFormModalOpen(false);
            setEditingDryerRecord(null);
            showToast(editingDryerRecord ? 'تغییرات خشک‌کن ذخیره شد!' : 'رکورد خشک‌کن با موفقیت در دیتابیس ثبت شد!');
          }}
          onCancel={() => {
            setIsDryerFormModalOpen(false);
            setEditingDryerRecord(null);
          }}
        />
      )}

      {/* Dryer Import Modal (Excel + Google Sheet) */}
      <DryerImportModal
        isOpen={isDryerImportModalOpen}
        onClose={() => setIsDryerImportModalOpen(false)}
        user={user}
        accessToken={accessToken}
        onSignIn={handleLogin}
        onImportSuccess={(count) => {
          showToast(`${count} رکورد خشک‌کن با موفقیت به پایگاه داده اضافه شد.`);
        }}
      />

    </div>
  );
}
