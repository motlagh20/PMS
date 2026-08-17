import React, { useMemo, useState } from 'react';
import { DryerRecord } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Boxes,
  Calendar,
  Building2,
  TrendingUp,
  User,
  Clock,
  Flame,
  Droplets,
  Layers,
} from 'lucide-react';

interface DryerAnalyticsProps {
  records: DryerRecord[];
}

const COLORS = ['#d97706', '#2563eb', '#059669', '#7c3aed', '#db2777', '#ea580c', '#0891b2', '#4b5563'];

export const DryerAnalytics: React.FC<DryerAnalyticsProps> = ({ records }) => {
  const [metricView, setMetricView] = useState<'chambers' | 'months' | 'operators' | 'thermal'>('chambers');

  // Chamber-level production aggregation
  const chamberStats = useMemo(() => {
    const map: Record<string, { chamber: string; totalFingers: number; count: number; avgFingers: number }> = {};
    records.forEach((r) => {
      const ch = String(r.chamberNumber || '1');
      const fingers = Number(r.fingerCount) || Number(r.inputQuantity) || 0;
      if (!map[ch]) {
        map[ch] = { chamber: `چمبر ${ch}`, totalFingers: 0, count: 0, avgFingers: 0 };
      }
      map[ch].totalFingers += fingers;
      map[ch].count += 1;
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        avgFingers: Math.round(item.totalFingers / (item.count || 1)),
      }))
      .sort((a, b) => b.totalFingers - a.totalFingers);
  }, [records]);

  // Month-level aggregation
  const monthStats = useMemo(() => {
    const map: Record<string, { month: string; totalFingers: number; loadCount: number }> = {};
    records.forEach((r) => {
      const m = r.month || 'مرداد';
      const fingers = Number(r.fingerCount) || Number(r.inputQuantity) || 0;
      if (!map[m]) {
        map[m] = { month: m, totalFingers: 0, loadCount: 0 };
      }
      map[m].totalFingers += fingers;
      map[m].loadCount += 1;
    });
    return Object.values(map);
  }, [records]);

  // Operator-level aggregation
  const operatorStats = useMemo(() => {
    const map: Record<string, { operator: string; loadedFingers: number; runsCount: number }> = {};
    records.forEach((r) => {
      const op = r.loadingOperator || r.operator || 'نامشخص';
      const fingers = Number(r.fingerCount) || Number(r.inputQuantity) || 0;
      if (!map[op]) {
        map[op] = { operator: op, loadedFingers: 0, runsCount: 0 };
      }
      map[op].loadedFingers += fingers;
      map[op].runsCount += 1;
    });
    return Object.values(map).sort((a, b) => b.loadedFingers - a.loadedFingers);
  }, [records]);

  // Product type distribution
  const productDistribution = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {};
    records.forEach((r) => {
      const p = r.productionType || r.productType || 'سایر';
      const fingers = Number(r.fingerCount) || Number(r.inputQuantity) || 0;
      if (!map[p]) {
        map[p] = { name: p, value: 0 };
      }
      map[p].value += fingers;
    });
    return Object.values(map);
  }, [records]);

  // Chronological Data for Time Trend
  const chronData = useMemo(() => {
    return [...records]
      .slice(0, 30)
      .map((r, i) => ({
        index: r.rowNumber || i + 1,
        label: `ردیف ${r.rowNumber || i + 1}`,
        fingers: Number(r.fingerCount) || Number(r.inputQuantity) || 0,
        chamber: r.chamberNumber,
        operator: r.loadingOperator,
      }))
      .reverse();
  }, [records]);

  const totalFingersAll = useMemo(() => {
    return records.reduce((acc, r) => acc + (Number(r.fingerCount) || Number(r.inputQuantity) || 0), 0);
  }, [records]);

  const avgFingersPerRun = records.length > 0 ? Math.round(totalFingersAll / records.length) : 0;

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Top Stat Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>مجموع فینگر کل تولید</span>
            <Boxes className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalFingersAll.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">قطعه بارگیری‌شده در چمبرها</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>میانگین بارگیری در هر چمبر</span>
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-900">{avgFingersPerRun.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">فینگر در هر نوبت بارگیری</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>تعداد کل نوبت‌های بارگیری</span>
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-800">{records.length.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">رکورد در شیت Data Entry</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>چمبرهای تحت بارگیری</span>
            <Building2 className="w-5 h-5 text-sky-600" />
          </div>
          <div className="text-2xl font-bold text-sky-900">{chamberStats.length.toLocaleString('fa-IR')}</div>
          <div className="text-[11px] text-sky-600 font-semibold mt-1">چمبر فعال صنعتی</div>
        </div>
      </div>

      {/* Metric View Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMetricView('chambers')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              metricView === 'chambers'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            تولید به تفکیک شماره چمبرها
          </button>
          <button
            onClick={() => setMetricView('months')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              metricView === 'months'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            حجم تولید در ماه‌ها
          </button>
          <button
            onClick={() => setMetricView('operators')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              metricView === 'operators'
                ? 'bg-white text-amber-800 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            عملکرد اپراتورهای بارگیری
          </button>
        </div>

        <span className="text-xs text-slate-500">پایش تحلیلی شیت Data Entry خشک‌کن</span>
      </div>

      {/* Main Chart Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {metricView === 'chambers' && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-600" />
              <span>مجموع و میانگین فینگرهای تولیدی به تفکیک شماره چمبر</span>
            </h3>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chamberStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="chamber" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', direction: 'rtl' }}
                    formatter={(val: any, name: string) => [
                      Number(val).toLocaleString('fa-IR'),
                      name === 'totalFingers' ? 'مجموع فینگر' : 'میانگین در هر نوبت',
                    ]}
                  />
                  <Legend
                    formatter={(value) => (value === 'totalFingers' ? 'مجموع فینگر تولیدی' : 'میانگین هر نوبت')}
                  />
                  <Bar dataKey="totalFingers" fill="#d97706" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="avgFingers" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {metricView === 'months' && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>روند و حجم تولید بر اساس ماه‌های سال</span>
            </h3>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', direction: 'rtl' }}
                    formatter={(val: any, name: string) => [
                      Number(val).toLocaleString('fa-IR'),
                      name === 'totalFingers' ? 'کل فینگر تولیدی' : 'تعداد نوبت بارگیری',
                    ]}
                  />
                  <Legend
                    formatter={(value) => (value === 'totalFingers' ? 'کل فینگر تولیدی' : 'تعداد نوبت بارگیری')}
                  />
                  <Bar dataKey="totalFingers" fill="#059669" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="loadCount" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {metricView === 'operators' && (
          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>فینگرهای بارگیری‌شده به تفکیک اپراتورهای شیفت</span>
            </h3>
            <div className="h-80 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={operatorStats} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis type="category" dataKey="operator" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', direction: 'rtl' }}
                    formatter={(val: any, name: string) => [
                      Number(val).toLocaleString('fa-IR'),
                      name === 'loadedFingers' ? 'فینگر بارگیری‌شده' : 'تعداد نوبت',
                    ]}
                  />
                  <Legend
                    formatter={(value) => (value === 'loadedFingers' ? 'فینگر بارگیری‌شده' : 'تعداد نوبت بارگیری')}
                  />
                  <Bar dataKey="loadedFingers" fill="#4f46e5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Grid: Product Types Distribution & Recent Runs Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-amber-600" />
            <span>توزیع انواع محصول بر اساس تعداد فینگر</span>
          </h4>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {productDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [Number(val).toLocaleString('fa-IR') + ' فینگر', 'حجم تولید']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600" />
            <span>روند بارگیری ردیف‌های اخیر</span>
          </h4>
          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chronData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(val: any) => [Number(val).toLocaleString('fa-IR') + ' فینگر', 'تعداد فینگر']}
                />
                <Area type="monotone" dataKey="fingers" stroke="#d97706" fill="#fef3c7" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
