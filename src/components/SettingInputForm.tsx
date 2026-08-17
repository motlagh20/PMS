import React, { useState, useEffect } from 'react';
import { SettingRecord } from '../types';
import {
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Truck,
  Layers,
  Calendar,
  User,
  Clock,
  Gauge,
  Percent,
  CheckSquare,
} from 'lucide-react';

interface SettingInputFormProps {
  onSave: (record: Omit<SettingRecord, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editingRecord?: SettingRecord | null;
  onCancelEdit?: () => void;
  nextRowNumber?: number;
}

const MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const DAYS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

const SHIFTS = ['صبح', 'عصر', 'شب'];

const GLAZE_TYPES = ['لعاب‌دار', 'خودرنگ', 'مات', 'براق', 'پرسلانی'];

export const SettingInputForm: React.FC<SettingInputFormProps> = ({
  onSave,
  editingRecord,
  onCancelEdit,
  nextRowNumber = 1,
}) => {
  const [formData, setFormData] = useState<Omit<SettingRecord, 'id' | 'createdAt' | 'updatedAt'>>({
    rowNumber: nextRowNumber,
    date: '1400/01/01',
    month: 'فروردین',
    day: 'شنبه',
    shift: 'صبح',
    shiftSupervisor: 'مهندس رضایی',
    operatorName: 'حسین محمدی',
    personnelCount: 4,
    chamberNumber: '1',
    product: 'پرسلان 60*60',
    fingerCount: 480,
    columnCount: 16,

    car1_number: 'W-101',
    car1_glazeType: 'لعاب‌دار',
    car1_startTime: '07:30',
    car1_endTime: '09:00',
    car1_packageCount: 40,
    car1_brickCount: 800,
    car1_totalTileCount: 800,

    car2_number: 'W-102',
    car2_glazeType: 'لعاب‌دار',
    car2_startTime: '09:00',
    car2_endTime: '10:30',
    car2_packageCount: 40,
    car2_brickCount: 800,
    car2_totalTileCount: 800,

    car3_number: 'W-103',
    car3_glazeType: 'خودرنگ',
    car3_startTime: '10:30',
    car3_endTime: '12:00',
    car3_packageCount: 40,
    car3_brickCount: 800,
    car3_totalTileCount: 800,

    car4_number: 'W-104',
    car4_glazeType: 'خودرنگ',
    car4_startTime: '12:00',
    car4_endTime: '13:30',
    car4_packageCount: 40,
    car4_brickCount: 800,
    car4_totalTileCount: 3200,

    machineWaste: 10,
    dryerWaste: 8,
    validationStatus: 'تایید شده',
    totalPackagedBricks: 3200,
    totalBricksInChamber: 3220,
    pressSettingEfficiency: '98.5%',
    dryerEfficiency: '97.2%',
    chamberFinalEfficiency: '96.8%',
    pressDryerStatus: 'عادی',
    dryerPerformanceStatus: 'مطلوب',
    overallKilnInletPerformance: 'عالی',
    chamberUnloadTimeEfficiency: '95%',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeCarTab, setActiveCarTab] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (editingRecord) {
      const { id, createdAt, updatedAt, ...rest } = editingRecord;
      setFormData(rest);
    } else {
      setFormData((prev) => ({ ...prev, rowNumber: nextRowNumber }));
    }
  }, [editingRecord, nextRowNumber]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value) || 0) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSaveStatus('idle');

    try {
      await onSave(formData);
      setSaveStatus('success');
      setStatusMessage(editingRecord ? 'رکورد ستینگ با موفقیت ویرایش شد' : 'رکورد جدید ستینگ با موفقیت ثبت شد');

      if (!editingRecord) {
        setFormData((prev) => ({
          ...prev,
          rowNumber: (prev.rowNumber || 0) + 1,
        }));
      }

      setTimeout(() => {
        setSaveStatus('idle');
        setStatusMessage('');
      }, 4000);
    } catch (err: any) {
      console.error('Save failed:', err);
      setSaveStatus('error');
      setStatusMessage(`خطا در ذخیره‌سازی داده‌ها: ${err?.message || 'مشکل در برقراری ارتباط'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden text-right" dir="rtl">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 px-6 py-4 text-white flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-400" />
            <span>{editingRecord ? 'ویرایش اطلاعات ستینگ و بارگیری واگن‌ها' : 'فرم ثبت اطلاعات شیت Data (Set_1400)'}</span>
          </h2>
          <p className="text-xs text-teal-200/80 mt-0.5">
            ثبت مشخصات بارگیری واگن‌ها، چمبر، بسته‌ها، خشت‌ها و راندمان خط
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-mono font-bold">
            ردیف: {formData.rowNumber}
          </span>
          {editingRecord && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg text-slate-200 transition-all"
            >
              انصراف
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Status Message */}
        {saveStatus !== 'idle' && (
          <div
            className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all ${
              saveStatus === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            {saveStatus === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Section 1: General Info */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>۱. مشخصات عمومی و نوبت کاری (شیت Data)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ردیف</label>
              <input
                type="number"
                name="rowNumber"
                value={formData.rowNumber}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 focus:bg-white focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">تاریخ</label>
              <input
                type="text"
                name="date"
                value={formData.date}
                onChange={handleChange}
                placeholder="1400/02/15"
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ماه</label>
              <select
                name="month"
                value={formData.month}
                onChange={handleChange}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:border-teal-500 outline-hidden"
              >
                {MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">روز</label>
              <select
                name="day"
                value={formData.day}
                onChange={handleChange}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:border-teal-500 outline-hidden"
              >
                {DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">شیفت</label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:border-teal-500 outline-hidden"
              >
                {SHIFTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">سرشیفت</label>
              <input
                type="text"
                name="shiftSupervisor"
                value={formData.shiftSupervisor}
                onChange={handleChange}
                placeholder="نام سرشیفت"
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Operator & Production & Chamber */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <User className="w-4 h-4 text-teal-600" />
            <span>۲. مشخصات پرسنل، چمبر و محصول</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">نام اپراتور</label>
              <input
                type="text"
                name="operatorName"
                value={formData.operatorName}
                onChange={handleChange}
                placeholder="نام اپراتور"
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد پرسنل</label>
              <input
                type="number"
                name="personnelCount"
                value={formData.personnelCount}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">شماره چمبر</label>
              <input
                type="text"
                name="chamberNumber"
                value={formData.chamberNumber}
                onChange={handleChange}
                placeholder="مثلاً 1"
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">محصول</label>
              <input
                type="text"
                name="product"
                value={formData.product}
                onChange={handleChange}
                placeholder="پرسلان 60*60"
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد فینگر</label>
              <input
                type="number"
                name="fingerCount"
                value={formData.fingerCount}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد ستون</label>
              <input
                type="number"
                name="columnCount"
                value={formData.columnCount}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Car Loading (4 Wagons) */}
        <div>
          <div className="flex items-center justify-between mb-3 pb-1.5 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-teal-600" />
              <span>۳. اطلاعات بارگیری واگن‌ها (واگن ۱ تا ۴)</span>
            </h3>

            {/* Car Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              {([1, 2, 3, 4] as const).map((num) => (
                <button
                  type="button"
                  key={num}
                  onClick={() => setActiveCarTab(num)}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    activeCarTab === num
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  واگن شماره {num}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
            {activeCarTab === 1 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">شماره واگن ۱</label>
                  <input
                    type="text"
                    name="car1_number"
                    value={formData.car1_number}
                    onChange={handleChange}
                    placeholder="W-101"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">لعاب/خودرنگ</label>
                  <select
                    name="car1_glazeType"
                    value={formData.car1_glazeType}
                    onChange={handleChange}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  >
                    {GLAZE_TYPES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان شروع</label>
                  <input
                    type="text"
                    name="car1_startTime"
                    value={formData.car1_startTime}
                    onChange={handleChange}
                    placeholder="07:30"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان پایان</label>
                  <input
                    type="text"
                    name="car1_endTime"
                    value={formData.car1_endTime}
                    onChange={handleChange}
                    placeholder="09:00"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد بسته</label>
                  <input
                    type="number"
                    name="car1_packageCount"
                    value={formData.car1_packageCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد خشت</label>
                  <input
                    type="number"
                    name="car1_brickCount"
                    value={formData.car1_brickCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد کل سفال</label>
                  <input
                    type="number"
                    name="car1_totalTileCount"
                    value={formData.car1_totalTileCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>
            )}

            {activeCarTab === 2 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">شماره واگن ۲</label>
                  <input
                    type="text"
                    name="car2_number"
                    value={formData.car2_number}
                    onChange={handleChange}
                    placeholder="W-102"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">لعاب/خودرنگ</label>
                  <select
                    name="car2_glazeType"
                    value={formData.car2_glazeType}
                    onChange={handleChange}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  >
                    {GLAZE_TYPES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان شروع</label>
                  <input
                    type="text"
                    name="car2_startTime"
                    value={formData.car2_startTime}
                    onChange={handleChange}
                    placeholder="09:00"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان پایان</label>
                  <input
                    type="text"
                    name="car2_endTime"
                    value={formData.car2_endTime}
                    onChange={handleChange}
                    placeholder="10:30"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد بسته</label>
                  <input
                    type="number"
                    name="car2_packageCount"
                    value={formData.car2_packageCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد خشت</label>
                  <input
                    type="number"
                    name="car2_brickCount"
                    value={formData.car2_brickCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد کل سفال</label>
                  <input
                    type="number"
                    name="car2_totalTileCount"
                    value={formData.car2_totalTileCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>
            )}

            {activeCarTab === 3 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">شماره واگن ۳</label>
                  <input
                    type="text"
                    name="car3_number"
                    value={formData.car3_number}
                    onChange={handleChange}
                    placeholder="W-103"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">لعاب/خودرنگ</label>
                  <select
                    name="car3_glazeType"
                    value={formData.car3_glazeType}
                    onChange={handleChange}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  >
                    {GLAZE_TYPES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان شروع</label>
                  <input
                    type="text"
                    name="car3_startTime"
                    value={formData.car3_startTime}
                    onChange={handleChange}
                    placeholder="10:30"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان پایان</label>
                  <input
                    type="text"
                    name="car3_endTime"
                    value={formData.car3_endTime}
                    onChange={handleChange}
                    placeholder="12:00"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد بسته</label>
                  <input
                    type="number"
                    name="car3_packageCount"
                    value={formData.car3_packageCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد خشت</label>
                  <input
                    type="number"
                    name="car3_brickCount"
                    value={formData.car3_brickCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد کل سفال</label>
                  <input
                    type="number"
                    name="car3_totalTileCount"
                    value={formData.car3_totalTileCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>
            )}

            {activeCarTab === 4 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">شماره واگن ۴</label>
                  <input
                    type="text"
                    name="car4_number"
                    value={formData.car4_number}
                    onChange={handleChange}
                    placeholder="W-104"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">لعاب/خودرنگ</label>
                  <select
                    name="car4_glazeType"
                    value={formData.car4_glazeType}
                    onChange={handleChange}
                    className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  >
                    {GLAZE_TYPES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان شروع</label>
                  <input
                    type="text"
                    name="car4_startTime"
                    value={formData.car4_startTime}
                    onChange={handleChange}
                    placeholder="12:00"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">زمان پایان</label>
                  <input
                    type="text"
                    name="car4_endTime"
                    value={formData.car4_endTime}
                    onChange={handleChange}
                    placeholder="13:30"
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد بسته</label>
                  <input
                    type="number"
                    name="car4_packageCount"
                    value={formData.car4_packageCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد خشت</label>
                  <input
                    type="number"
                    name="car4_brickCount"
                    value={formData.car4_brickCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">تعداد کل سفال</label>
                  <input
                    type="number"
                    name="car4_totalTileCount"
                    value={formData.car4_totalTileCount}
                    onChange={handleChange}
                    className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:border-teal-500 outline-hidden"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Waste, Totals & Efficiencies */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-2 pb-1.5 border-b border-slate-100">
            <Percent className="w-4 h-4 text-teal-600" />
            <span>۴. ضایعات، راندمان و صحت مقادیر</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ضایعات ماشین‌آلات</label>
              <input
                type="number"
                name="machineWaste"
                value={formData.machineWaste}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">ضایعات خشک‌کن</label>
              <input
                type="number"
                name="dryerWaste"
                value={formData.dryerWaste}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">صحت اعداد بسته/فینگر</label>
              <input
                type="text"
                name="validationStatus"
                value={formData.validationStatus}
                onChange={handleChange}
                placeholder="تایید شده / خطا"
                className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">کل خشت بسته‌بندی</label>
              <input
                type="number"
                name="totalPackagedBricks"
                value={formData.totalPackagedBricks}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">خشت داخل چمبر</label>
              <input
                type="number"
                name="totalBricksInChamber"
                value={formData.totalBricksInChamber}
                onChange={handleChange}
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">راندمان پرس و ستینگ</label>
              <input
                type="text"
                name="pressSettingEfficiency"
                value={formData.pressSettingEfficiency}
                onChange={handleChange}
                placeholder="98.5%"
                className="w-full text-xs font-mono border border-slate-200 rounded-lg px-2.5 py-1.5 focus:border-teal-500 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Section 5: Notes */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">توضیحات و یادداشت</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={2}
            placeholder="یادداشت‌های شیفت، عملکرد پرسنل یا گزارش توقف..."
            className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 focus:border-teal-500 outline-hidden resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'در حال ثبت...' : editingRecord ? 'ویرایش رکورد ستینگ' : 'ذخیره در پایگاه داده'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
