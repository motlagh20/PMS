import React from 'react';
import { Flame, Database, Download, LogIn, LogOut, PlusCircle, Layers, Droplets, FileSpreadsheet, Truck } from 'lucide-react';
import { User } from 'firebase/auth';

export type AppPage = 'kiln' | 'dryer' | 'setting';

interface HeaderProps {
  user: User | null;
  activePage: AppPage;
  onSelectPage: (page: AppPage) => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenNewForm: () => void;
  onOpenImportModal: () => void;
  onExportCsv: () => void;
  totalDbRecords: number;
  totalDryerRecords?: number;
  totalSettingRecords?: number;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activePage,
  onSelectPage,
  onLogin,
  onLogout,
  onOpenNewForm,
  onOpenImportModal,
  onExportCsv,
  totalDbRecords,
  totalDryerRecords = 0,
  totalSettingRecords = 0,
}) => {
  const getPageTitle = () => {
    switch (activePage) {
      case 'kiln':
        return 'سامانه کوره پخت (Kiln-1400)';
      case 'dryer':
        return 'سامانه خشک‌کن چمبر (Dryer-1400)';
      case 'setting':
        return 'سامانه ستینگ و بارگیری واگن‌ها (Set_1400)';
      default:
        return 'سامانه مدیریت داده‌های تولید';
    }
  };

  const getRecordCountText = () => {
    switch (activePage) {
      case 'kiln':
        return `${totalDbRecords} رکورد در دیتابیس کوره`;
      case 'dryer':
        return `${totalDryerRecords} رکورد در دیتابیس خشک‌کن`;
      case 'setting':
        return `${totalSettingRecords} رکورد در دیتابیس ستینگ`;
      default:
        return '';
    }
  };

  const getPageIcon = () => {
    switch (activePage) {
      case 'kiln':
        return <Flame className="w-5 h-5" />;
      case 'dryer':
        return <Droplets className="w-5 h-5" />;
      case 'setting':
        return <Truck className="w-5 h-5" />;
    }
  };

  const getIconBg = () => {
    switch (activePage) {
      case 'kiln':
        return 'bg-amber-600';
      case 'dryer':
        return 'bg-orange-600';
      case 'setting':
        return 'bg-teal-700';
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand & Identification */}
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs transition-colors ${getIconBg()}`}>
              {getPageIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {getPageTitle()}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Firestore Live
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {getRecordCountText()} • همگام‌سازی ابری لحظه‌ای
              </p>
            </div>
          </div>

          {/* Page Navigation Tabs */}
          <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl gap-1">
            <button
              onClick={() => onSelectPage('kiln')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePage === 'kiln'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Flame className={`w-3.5 h-3.5 ${activePage === 'kiln' ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>کوره پخت (Kiln-1400)</span>
            </button>
            <button
              onClick={() => onSelectPage('dryer')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePage === 'dryer'
                  ? 'bg-white text-orange-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Droplets className={`w-3.5 h-3.5 ${activePage === 'dryer' ? 'text-orange-600' : 'text-slate-400'}`} />
              <span>خشک‌کن (Dryer-1400)</span>
            </button>
            <button
              onClick={() => onSelectPage('setting')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activePage === 'setting'
                  ? 'bg-white text-teal-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className={`w-3.5 h-3.5 ${activePage === 'setting' ? 'text-teal-600' : 'text-slate-400'}`} />
              <span>ستینگ و بارگیری (Set_1400)</span>
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="header-add-record-btn"
              onClick={onOpenNewForm}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              <span>+ ثبت ردیف جدید</span>
            </button>

            <button
              id="header-import-sheet-btn"
              onClick={onOpenImportModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-xs"
              title="ایمپورت مستقیم از اکسل یا شیت گوگل"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">ایمپورت اکسل / شیت</span>
            </button>

            {/* Auth */}
            {user ? (
              <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 font-semibold flex items-center justify-center text-xs">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  id="header-signout-btn"
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  title="خروج از حساب"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="header-signin-btn"
                onClick={onLogin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ورود گوگل</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden items-center justify-center border-t border-slate-100 py-2 gap-1 overflow-x-auto">
          <button
            onClick={() => onSelectPage('kiln')}
            className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activePage === 'kiln'
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>کوره پخت</span>
          </button>
          <button
            onClick={() => onSelectPage('dryer')}
            className={`flex-1 min-w-[100px] inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activePage === 'dryer'
                ? 'bg-orange-100 text-orange-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-orange-600" />
            <span>خشک‌کن</span>
          </button>
          <button
            onClick={() => onSelectPage('setting')}
            className={`flex-1 min-w-[110px] inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activePage === 'setting'
                ? 'bg-teal-100 text-teal-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-teal-600" />
            <span>ستینگ و بارگیری</span>
          </button>
        </div>

      </div>
    </header>
  );
};
