import React, { useState, useEffect } from 'react';
import { DryerRecord } from '../types';
import { addDryerRecord, updateDryerRecord } from '../services/dbService';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Package,
  Layers,
  Droplets,
  PlusCircle,
  RefreshCw,
  Percent,
  Calendar,
  Building2,
  Boxes,
  ChevronDown,
  Sparkles,
  Flame,
} from 'lucide-react';

interface DryerInputFormProps {
  editRecord?: DryerRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
  latestRowNumber?: number;
}

const MONTHS_LIST = [
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

export const DryerInputForm: React.FC<DryerInputFormProps> = ({
  editRecord,
  onSuccess,
  onCancel,
  isModal = false,
  latestRowNumber = 1,
}) => {
  // Primary Sheet Fields (dryer-1400: Data Entry)
  const [rowNumber, setRowNumber] = useState<number>(editRecord ? editRecord.rowNumber || 1 : latestRowNumber + 1);
  const [month, setMonth] = useState<string>(editRecord?.month || 'مرداد');
  const [loadDateSolar, setLoadDateSolar] = useState<string>(editRecord?.loadDateSolar || editRecord?.date || '1403/05/20');
  const [loadDateTimeGregorian, setLoadDateTimeGregorian] = useState<string>(
    editRecord?.loadDateTimeGregorian || '2024-08-10 08:30'
  );
  const [chamberNumber, setChamberNumber] = useState<string>(editRecord?.chamberNumber || '1');
  const [fingerCount, setFingerCount] = useState<number>(
    editRecord?.fingerCount || editRecord?.inputQuantity || 480
  );
  const [loadingOperator, setLoadingOperator] = useState<string>(
    editRecord?.loadingOperator || editRecord?.operator || 'مهندس رضایی'
  );
  const [productionType, setProductionType] = useState<string>(
    editRecord?.productionType || editRecord?.productType || 'پرسلان پولیشی 60*60'
  );
  const [unloadDateTimeSolar, setUnloadDateTimeSolar] = useState<string>(
    editRecord?.unloadDateTimeSolar || '1403/05/20 13:00'
  );
  const [unloadDateTimeGregorian, setUnloadDateTimeGregorian] = useState<string>(
    editRecord?.unloadDateTimeGregorian || '2024-08-10 13:00'
  );
  const [unloadingOperator, setUnloadingOperator] = useState<string>(
    editRecord?.unloadingOperator || 'تکنسین حسینی'
  );
  const [duration, setDuration] = useState<string>(editRecord?.duration || '4:30 ساعت');

  // Extended / Optional Technical Parameters
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [rawMoisture, setRawMoisture] = useState<number>(editRecord?.rawMoisture || 6.2);
  const [dryMoisture, setDryMoisture] = useState<number>(editRecord?.dryMoisture || 0.48);
  const [burnerInletTemp, setBurnerInletTemp] = useState<number>(editRecord?.burnerInletTemp || 195);
  const [exhaustTemp, setExhaustTemp] = useState<number>(editRecord?.exhaustTemp || 112);
  const [layer1Temp, setLayer1Temp] = useState<number>(editRecord?.layer1Temp || 165);
  const [layer2Temp, setLayer2Temp] = useState<number>(editRecord?.layer2Temp || 182);
  const [layer3Temp, setLayer3Temp] = useState<number>(editRecord?.layer3Temp || 198);
  const [layer4Temp, setLayer4Temp] = useState<number>(editRecord?.layer4Temp || 204);
  const [layer5Temp, setLayer5Temp] = useState<number>(editRecord?.layer5Temp || 188);
  const [fanPressure, setFanPressure] = useState<number>(editRecord?.fanPressure || 34);
  const [gasPressure, setGasPressure] = useState<number>(editRecord?.gasPressure || 85);
  const [defectRate, setDefectRate] = useState<number>(editRecord?.defectRate || 0.6);
  const [notes, setNotes] = useState<string>(editRecord?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (editRecord) {
      setRowNumber(editRecord.rowNumber || 1);
      setMonth(editRecord.month || 'مرداد');
      setLoadDateSolar(editRecord.loadDateSolar || editRecord.date || '');
      setLoadDateTimeGregorian(editRecord.loadDateTimeGregorian || '');
      setChamberNumber(String(editRecord.chamberNumber || '1'));
      setFingerCount(editRecord.fingerCount || editRecord.inputQuantity || 480);
      setLoadingOperator(editRecord.loadingOperator || editRecord.operator || '');
      setProductionType(editRecord.productionType || editRecord.productType || '');
      setUnloadDateTimeSolar(editRecord.unloadDateTimeSolar || '');
      setUnloadDateTimeGregorian(editRecord.unloadDateTimeGregorian || '');
      setUnloadingOperator(editRecord.unloadingOperator || '');
      setDuration(editRecord.duration || '');

      setRawMoisture(editRecord.rawMoisture || 6.2);
      setDryMoisture(editRecord.dryMoisture || 0.48);
      setBurnerInletTemp(editRecord.burnerInletTemp || 195);
      setExhaustTemp(editRecord.exhaustTemp || 112);
      setLayer1Temp(editRecord.layer1Temp || 165);
      setLayer2Temp(editRecord.layer2Temp || 182);
      setLayer3Temp(editRecord.layer3Temp || 198);
      setLayer4Temp(editRecord.layer4Temp || 204);
      setLayer5Temp(editRecord.layer5Temp || 188);
      setFanPressure(editRecord.fanPressure || 34);
      setGasPressure(editRecord.gasPressure || 85);
      setDefectRate(editRecord.defectRate || 0.6);
      setNotes(editRecord.notes || '');
    } else if (latestRowNumber) {
      setRowNumber(latestRowNumber + 1);
    }
  }, [editRecord, latestRowNumber]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const recordPayload: Omit<DryerRecord, 'id'> = {
        rowNumber: Number(rowNumber),
        month: month.trim(),
        loadDateSolar: loadDateSolar.trim(),
        loadDateTimeGregorian: loadDateTimeGregorian.trim(),
        chamberNumber: chamberNumber.trim(),
        fingerCount: Number(fingerCount) || 0,
        loadingOperator: loadingOperator.trim(),
        productionType: productionType.trim(),
        unloadDateTimeSolar: unloadDateTimeSolar.trim(),
        unloadDateTimeGregorian: unloadDateTimeGregorian.trim(),
        unloadingOperator: unloadingOperator.trim(),
        duration: duration.trim(),

        // Extended properties
        date: loadDateSolar.trim(),
        time: loadDateTimeGregorian ? loadDateTimeGregorian.split(' ')[1] || '08:00' : '08:00',
        shift: 'صبح',
        operatorCode: '101',
        operator: loadingOperator.trim(),
        dryerLine: `چمبر ${chamberNumber}`,
        productCode: `DRY-${chamberNumber}`,
        productType: productionType.trim(),
        rawMoisture: Number(rawMoisture) || 0,
        dryMoisture: Number(dryMoisture) || 0,
        dryingCycleTime: 45,
        burnerInletTemp: Number(burnerInletTemp) || 0,
        exhaustTemp: Number(exhaustTemp) || 0,
        outletTemp: 90,
        layer1Temp: Number(layer1Temp) || 0,
        layer2Temp: Number(layer2Temp) || 0,
        layer3Temp: Number(layer3Temp) || 0,
        layer4Temp: Number(layer4Temp) || 0,
        layer5Temp: Number(layer5Temp) || 0,
        fanPressure: Number(fanPressure) || 0,
        gasPressure: Number(gasPressure) || 0,
        lineSpeed: 40,
        inputQuantity: Number(fingerCount) || 0,
        defectRate: Number(defectRate) || 0,
        notes: notes.trim(),
      };

      if (editRecord && editRecord.id) {
        await updateDryerRecord(editRecord.id, recordPayload);
        setStatusMsg({ type: 'success', text: `ردیف ${rowNumber} چمبر با موفقیت در دیتابیس ویرایش شد.` });
      } else {
        await addDryerRecord(recordPayload);
        setStatusMsg({ type: 'success', text: `ردیف ${rowNumber} چمبر خشک‌کن در دیتابیس با موفقیت ثبت شد.` });
        setRowNumber((prev) => prev + 1);
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 600);
      }
    } catch (err: any) {
      console.error('Error saving dryer record:', err);
      setStatusMsg({
        type: 'error',
        text: 'خطا در ذخیره‌سازی داده‌ها در دیتابیس: ' + (err.message || 'Missing or insufficient permissions.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-6 text-right" dir="rtl">
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* SECTION 1: MAIN DRYER-1400 / DATA ENTRY COLUMNS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
            <Building2 className="w-5 h-5 text-amber-600" />
            <span>اطلاعات ثبت چمبر خشک‌کن (dryer-1400: Data Entry)</span>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
            فایل: dryer-1400 • شیت: Data Entry
          </span>
        </div>

        {/* Grid 1: Row, Month, Chamber, Production Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ردیف <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={rowNumber}
              onChange={(e) => setRowNumber(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-slate-50/50 font-bold text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ماه <span className="text-rose-500">*</span>
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white font-medium text-slate-800"
            >
              {MONTHS_LIST.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              شماره چمبر <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={chamberNumber}
              onChange={(e) => setChamberNumber(e.target.value)}
              placeholder="مثال: 1 یا چمبر 3"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              تعداد فینگر تولیدی <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              value={fingerCount}
              onChange={(e) => setFingerCount(Number(e.target.value))}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white font-bold text-indigo-900"
            />
          </div>
        </div>

        {/* Grid 2: Loading info & Unloading info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Box: Loading Details */}
          <div className="p-4 rounded-xl bg-amber-50/40 border border-amber-200/80 space-y-3">
            <h4 className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
              <Boxes className="w-4 h-4 text-amber-700" />
              <span>اطلاعات بارگیری چمبر</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                اپراتور بارگیری <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={loadingOperator}
                onChange={(e) => setLoadingOperator(e.target.value)}
                placeholder="نام اپراتور بارگیری"
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                نوع تولید <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productionType}
                onChange={(e) => setProductionType(e.target.value)}
                placeholder="مثال: پرسلان پولیشی 60*60"
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-slate-800"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  تاریخ بارگیری شمسی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={loadDateSolar}
                  onChange={(e) => setLoadDateSolar(e.target.value)}
                  placeholder="1403/05/20"
                  required
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  تاریخ و زمان بارگیری میلادی
                </label>
                <input
                  type="text"
                  value={loadDateTimeGregorian}
                  onChange={(e) => setLoadDateTimeGregorian(e.target.value)}
                  placeholder="2024-08-10 08:30"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Box: Unloading Details */}
          <div className="p-4 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-3">
            <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-700" />
              <span>اطلاعات تخلیه چمبر و مدت زمان</span>
            </h4>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                اپراتور تخلیه
              </label>
              <input
                type="text"
                value={unloadingOperator}
                onChange={(e) => setUnloadingOperator(e.target.value)}
                placeholder="نام اپراتور تخلیه"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                مدت زمان فرآیند
              </label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="مثال: 4:30 ساعت"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-semibold text-indigo-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  تاریخ و زمان تخلیه شمسی
                </label>
                <input
                  type="text"
                  value={unloadDateTimeSolar}
                  onChange={(e) => setUnloadDateTimeSolar(e.target.value)}
                  placeholder="1403/05/20 13:00"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  تاریخ و زمان تخلیه میلادی
                </label>
                <input
                  type="text"
                  value={unloadDateTimeGregorian}
                  onChange={(e) => setUnloadDateTimeGregorian(e.target.value)}
                  placeholder="2024-08-10 13:00"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono text-[11px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Advanced Technical Parameters */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
            <span>
              {showAdvanced
                ? 'بستن پارامترهای فنی تکمیلی (رطوبت، دمای طبقات و فشار)'
                : '+ افزودن پارامترهای فنی تکمیلی (رطوبت، دمای طبقات، فشار گاز و مشعل)'}
            </span>
          </button>

          {showAdvanced && (
            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">رطوبت ورودی (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={rawMoisture}
                    onChange={(e) => setRawMoisture(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">رطوبت خروجی (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={dryMoisture}
                    onChange={(e) => setDryMoisture(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">دمای مشعل (°C)</label>
                  <input
                    type="number"
                    value={burnerInletTemp}
                    onChange={(e) => setBurnerInletTemp(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">دمای اگزوز (°C)</label>
                  <input
                    type="number"
                    value={exhaustTemp}
                    onChange={(e) => setExhaustTemp(Number(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">طبقه ۱ (°C)</label>
                  <input
                    type="number"
                    value={layer1Temp}
                    onChange={(e) => setLayer1Temp(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded-md border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">طبقه ۲ (°C)</label>
                  <input
                    type="number"
                    value={layer2Temp}
                    onChange={(e) => setLayer2Temp(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded-md border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">طبقه ۳ (°C)</label>
                  <input
                    type="number"
                    value={layer3Temp}
                    onChange={(e) => setLayer3Temp(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded-md border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">طبقه ۴ (°C)</label>
                  <input
                    type="number"
                    value={layer4Temp}
                    onChange={(e) => setLayer4Temp(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded-md border border-slate-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">طبقه ۵ (°C)</label>
                  <input
                    type="number"
                    value={layer5Temp}
                    onChange={(e) => setLayer5Temp(Number(e.target.value))}
                    className="w-full px-2 py-1 text-xs rounded-md border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">توضیحات و یادداشت</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="توضیحات مربوط به کیفیت پخت، هوای چمبر یا گزارش شیفت..."
            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 bg-white"
          ></textarea>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            انصراف
          </button>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-7 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs transition-all disabled:opacity-40"
        >
          {isSubmitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>در حال ثبت در دیتابیس...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{editRecord ? 'ذخیره تغییرات چمبر' : 'ثبت رکورد در پایگاه داده Firestore'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-4 text-white flex items-center justify-between">
            <h3 className="text-sm font-bold">
              {editRecord ? `ویرایش ردیف ${editRecord.rowNumber} چمبر خشک‌کن` : 'ثبت رکورد جدید چمبر خشک‌کن'}
            </h3>
            {onCancel && (
              <button
                onClick={onCancel}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                ✕
              </button>
            )}
          </div>
          <div className="p-6 max-h-[85vh] overflow-y-auto">{formContent}</div>
        </div>
      </div>
    );
  }

  return formContent;
};
