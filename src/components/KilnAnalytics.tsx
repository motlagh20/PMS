import React, { useMemo } from 'react';
import { KilnRecord } from '../types';
import {
  Flame,
  Thermometer,
  Gauge,
  Layers,
  Activity,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
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
} from 'recharts';

interface KilnAnalyticsProps {
  records: KilnRecord[];
}

export const KilnAnalytics: React.FC<KilnAnalyticsProps> = ({ records }) => {
  // Compute Averages for Zone 0 to Zone 7
  const zoneProfile = useMemo(() => {
    if (records.length === 0) return [];

    const zoneKeys = [
      { key: 'zone0', label: 'زون ۰' },
      { key: 'zone1', label: 'زون ۱' },
      { key: 'zone2', label: 'زون ۲' },
      { key: 'zone3', label: 'زون ۳' },
      { key: 'zone4', label: 'زون ۴ (پخت)' },
      { key: 'zone5', label: 'زون ۵ (ماکزیمم)' },
      { key: 'zone6', label: 'زون ۶' },
      { key: 'zone7', label: 'زون ۷' },
    ];

    return zoneKeys.map((z) => {
      const sum = records.reduce((acc, curr) => acc + (Number(curr[z.key]) || 0), 0);
      const avg = Math.round(sum / records.length);
      return {
        zone: z.label,
        avgTemp: avg,
      };
    });
  }, [records]);

  // Exhaust & PreHeat Trend over time/records
  const trendData = useMemo(() => {
    return records
      .slice(0, 20)
      .reverse()
      .map((r) => ({
        name: `ردیف ${r.rowNumber || r.id.slice(0, 4)}`,
        exhaust: r.exhaustTemp,
        preHeat1: r.preHeat1,
        preHeat2: r.preHeat2,
        zone5Max: r.zone5,
        rapid1: r.rapid1,
      }));
  }, [records]);

  // Overall Statistics
  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        avgMaxZone: 0,
        avgExhaust: 0,
        avgThermostat: 0,
        totalCars: 0,
      };
    }

    const totalZone5 = records.reduce((acc, r) => acc + (Number(r.zone5) || 0), 0);
    const totalExhaust = records.reduce((acc, r) => acc + (Number(r.exhaustTemp) || 0), 0);
    const totalThermostat = records.reduce((acc, r) => acc + (Number(r.thermostat) || 0), 0);

    return {
      avgMaxZone: Math.round(totalZone5 / records.length),
      avgExhaust: Math.round(totalExhaust / records.length),
      avgThermostat: Math.round(totalThermostat / records.length),
      totalCars: records.length,
    };
  }, [records]);

  return (
    <div className="space-y-6" dir="rtl">
      
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>میانگین دمای پخت (زون ۵)</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-700">{stats.avgMaxZone} °C</div>
          <p className="text-[10px] text-slate-400 mt-1">حداکثر دمای ناحیه پخت کوره</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>میانگین دمای اگزوز</span>
            <Thermometer className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-blue-700">{stats.avgExhaust} °C</div>
          <p className="text-[10px] text-slate-400 mt-1">گازهای خروجی انتهای کوره</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>تنظیم ترموستات کوره</span>
            <Gauge className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700">{stats.avgThermostat} °C</div>
          <p className="text-[10px] text-slate-400 mt-1">Set-point میانگین</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>کل ردیف‌های ثبت‌شده</span>
            <Layers className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">{stats.totalCars}</div>
          <p className="text-[10px] text-slate-400 mt-1">داده‌های پایگاه داده Firestore</p>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Thermal Profile (Zone 0 to 7) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900">پروفایل منحنی دمای زون‌های کوره (Zone Curve)</h4>
              <p className="text-[11px] text-slate-500">میانگین دما از زون ۰ تا زون ۷ (°C)</p>
            </div>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={zoneProfile} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="zone" tick={{ fontSize: 11 }} />
                <YAxis domain={['dataMin - 50', 'dataMax + 50']} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [`${value} °C`, 'میانگین دما']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="avgTemp"
                  stroke="#d97706"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#d97706' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Trends of Max Zone vs Exhaust */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
            <div>
              <h4 className="text-xs font-bold text-slate-900">روند تغییرات دمای پیش‌گرما و زون ماکزیمم</h4>
              <p className="text-[11px] text-slate-500">بررسی ۲۰ ردیف اخیر ثبت‌شده</p>
            </div>
            <Activity className="w-4 h-4 text-indigo-500" />
          </div>

          <div className="h-64 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" name="زون ۵ (پخت)" dataKey="zone5Max" stroke="#dc2626" strokeWidth={2} dot={false} />
                <Line type="monotone" name="پیش‌گرما ۲" dataKey="preHeat2" stroke="#4f46e5" strokeWidth={2} dot={false} />
                <Line type="monotone" name="پیش‌گرما ۱" dataKey="preHeat1" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                <Line type="monotone" name="اگزوز" dataKey="exhaust" stroke="#64748b" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
