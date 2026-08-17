import React, { useState, useEffect } from 'react';
import { KilnRecord } from '../types';
import { addKilnRecord, updateKilnRecord } from '../services/dbService';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Flame,
  Gauge,
  Clock,
  User,
  Package,
  Layers,
  Thermometer,
  Wind,
  PlusCircle,
  RefreshCw,
} from 'lucide-react';

interface KilnInputFormProps {
  editRecord?: KilnRecord | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  isModal?: boolean;
  latestRowNumber?: number;
}

export const KilnInputForm: React.FC<KilnInputFormProps> = ({
  editRecord,
  onSuccess,
  onCancel,
  isModal = false,
  latestRowNumber = 1,
}) => {
  // 1. Shift & Operator Info
  const [rowNumber, setRowNumber] = useState<number>(editRecord ? editRecord.rowNumber || 1 : latestRowNumber + 1);
  const [date, setDate] = useState<string>(editRecord ? editRecord.date : '1403/05/20');
  const [operatorCode, setOperatorCode] = useState<string>(editRecord ? editRecord.operatorCode : '101');
  const [operator, setOperator] = useState<string>(editRecord ? editRecord.operator : 'مهندس رضایی');
  const [time, setTime] = useState<string>(editRecord ? editRecord.time : '08:00');

  // 2. Kiln Car & Product Info
  const [raw, setRaw] = useState<string>(editRecord ? editRecord.raw : 'خام استاندارد');
  const [inputCar, setInputCar] = useState<string>(editRecord ? editRecord.inputCar : 'W-105');
  const [productCode, setProductCode] = useState<string>(editRecord ? editRecord.productCode : 'PRD-800');
  const [productType, setProductType] = useState<string>(editRecord ? editRecord.productType : 'گرانیت پرسلانی 60*120');
  const [pushingTime, setPushingTime] = useState<string>(editRecord ? editRecord.pushingTime : '35 دقیقه');
  const [outputCar, setOutputCar] = useState<string>(editRecord ? editRecord.outputCar : 'W-85');

  // 3. Exhaust, Pre-heat, Thermostat
  const [exhaustTemp, setExhaustTemp] = useState<number>(editRecord ? editRecord.exhaustTemp : 185);
  const [preHeat1, setPreHeat1] = useState<number>(editRecord ? editRecord.preHeat1 : 460);
  const [preHeat2, setPreHeat2] = useState<number>(editRecord ? editRecord.preHeat2 : 730);
  const [thermostat, setThermostat] = useState<number>(editRecord ? editRecord.thermostat : 1180);

  // 4. Kiln Thermal Zones (Zone 0 to 7)
  const [zone0, setZone0] = useState<number>(editRecord ? editRecord.zone0 : 895);
  const [zone1, setZone1] = useState<number>(editRecord ? editRecord.zone1 : 985);
  const [zone2, setZone2] = useState<number>(editRecord ? editRecord.zone2 : 1065);
  const [zone3, setZone3] = useState<number>(editRecord ? editRecord.zone3 : 1125);
  const [zone4, setZone4] = useState<number>(editRecord ? editRecord.zone4 : 1178);
  const [zone5, setZone5] = useState<number>(editRecord ? editRecord.zone5 : 1185);
  const [zone6, setZone6] = useState<number>(editRecord ? editRecord.zone6 : 1162);
  const [zone7, setZone7] = useState<number>(editRecord ? editRecord.zone7 : 1045);

  // 5. Rapid & Bottom Systems
  const [rapid1, setRapid1] = useState<number>(editRecord ? editRecord.rapid1 : 825);
  const [rapid2, setRapid2] = useState<number>(editRecord ? editRecord.rapid2 : 615);
  const [bottomA, setBottomA] = useState<number>(editRecord ? editRecord.bottomA : 1125);
  const [bottom1, setBottom1] = useState<number>(editRecord ? editRecord.bottom1 : 1148);
  const [bottomB, setBottomB] = useState<number>(editRecord ? editRecord.bottomB : 1135);
  const [bottom2, setBottom2] = useState<number>(editRecord ? editRecord.bottom2 : 1152);

  // 6. Pipes & Car 44 Temps
  const [car44Temp, setCar44Temp] = useState<number>(editRecord ? editRecord.car44Temp : 98);
  const [bottomPipeTemp, setBottomPipeTemp] = useState<number>(editRecord ? editRecord.bottomPipeTemp : 345);
  const [dryerPipeTemp, setDryerPipeTemp] = useState<number>(editRecord ? editRecord.dryerPipeTemp : 215);
  const [notes, setNotes] = useState<string>(editRecord?.notes || '');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (editRecord) {
      setRowNumber(editRecord.rowNumber || 1);
      setDate(editRecord.date || '');
      setOperatorCode(editRecord.operatorCode || '');
      setOperator(editRecord.operator || '');
      setTime(editRecord.time || '');
      setRaw(editRecord.raw || '');
      setInputCar(editRecord.inputCar || '');
      setProductCode(editRecord.productCode || '');
      setProductType(editRecord.productType || '');
      setPushingTime(editRecord.pushingTime || '');
      setOutputCar(editRecord.outputCar || '');

      setExhaustTemp(Number(editRecord.exhaustTemp) || 0);
      setPreHeat1(Number(editRecord.preHeat1) || 0);
      setPreHeat2(Number(editRecord.preHeat2) || 0);
      setThermostat(Number(editRecord.thermostat) || 0);

      setZone0(Number(editRecord.zone0) || 0);
      setZone1(Number(editRecord.zone1) || 0);
      setZone2(Number(editRecord.zone2) || 0);
      setZone3(Number(editRecord.zone3) || 0);
      setZone4(Number(editRecord.zone4) || 0);
      setZone5(Number(editRecord.zone5) || 0);
      setZone6(Number(editRecord.zone6) || 0);
      setZone7(Number(editRecord.zone7) || 0);

      setRapid1(Number(editRecord.rapid1) || 0);
      setRapid2(Number(editRecord.rapid2) || 0);
      setBottomA(Number(editRecord.bottomA) || 0);
      setBottom1(Number(editRecord.bottom1) || 0);
      setBottomB(Number(editRecord.bottomB) || 0);
      setBottom2(Number(editRecord.bottom2) || 0);

      setCar44Temp(Number(editRecord.car44Temp) || 0);
      setBottomPipeTemp(Number(editRecord.bottomPipeTemp) || 0);
      setDryerPipeTemp(Number(editRecord.dryerPipeTemp) || 0);
      setNotes(editRecord.notes || '');
    }
  }, [editRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setNotification(null);

    const recordData = {
      rowNumber: Number(rowNumber),
      date: date.trim(),
      operatorCode: operatorCode.trim(),
      operator: operator.trim(),
      time: time.trim(),
      raw: raw.trim(),
      inputCar: inputCar.trim(),
      productCode: productCode.trim(),
      productType: productType.trim(),
      exhaustTemp: Number(exhaustTemp),
      preHeat1: Number(preHeat1),
      preHeat2: Number(preHeat2),
      thermostat: Number(thermostat),
      zone0: Number(zone0),
      zone1: Number(zone1),
      zone2: Number(zone2),
      zone3: Number(zone3),
      zone4: Number(zone4),
      zone5: Number(zone5),
      zone6: Number(zone6),
      zone7: Number(zone7),
      rapid1: Number(rapid1),
      rapid2: Number(rapid2),
      bottomA: Number(bottomA),
      bottom1: Number(bottom1),
      bottomB: Number(bottomB),
      bottom2: Number(bottom2),
      car44Temp: Number(car44Temp),
      bottomPipeTemp: Number(bottomPipeTemp),
      dryerPipeTemp: Number(dryerPipeTemp),
      pushingTime: pushingTime.trim(),
      outputCar: outputCar.trim(),
      notes: notes.trim(),
    };

    try {
      if (editRecord) {
        await updateKilnRecord(editRecord.id, recordData);
        setNotification({
          type: 'success',
          message: `اطلاعات ردیف ${rowNumber} در دیتابیس با موفقیت به‌روزرسانی شد.`,
        });
      } else {
        await addKilnRecord(recordData);
        setNotification({
          type: 'success',
          message: `اطلاعات کوره با شماره ردیف ${rowNumber} با موفقیت در دیتابیس ذخیره شد.`,
        });

        // Increment row number for next entry
        setRowNumber((prev) => prev + 1);
      }

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (err: any) {
      console.error('Error saving kiln record:', err);
      setNotification({
        type: 'error',
        message: err?.message || 'خطا در ذخیره‌سازی اطلاعات در دیتابیس',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formElement = (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      
      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* بخش ۱: مشخصات شیفت و اپراتور */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-slate-800 text-xs font-bold">
          <User className="w-4 h-4 text-indigo-600" />
          <span>مشخصات شیفت و اپراتور</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">ردیف</label>
            <input
              type="number"
              required
              value={rowNumber}
              onChange={(e) => setRowNumber(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">تاریخ</label>
            <input
              type="text"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="1403/05/20"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">ساعت</label>
            <input
              type="text"
              required
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="08:00"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">کد اپراتور</label>
            <input
              type="text"
              value={operatorCode}
              onChange={(e) => setOperatorCode(e.target.value)}
              placeholder="101"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">نام اپراتور</label>
            <input
              type="text"
              required
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="مهندس رضایی"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* بخش ۲: مشخصات واگن و محصول */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-slate-800 text-xs font-bold">
          <Package className="w-4 h-4 text-emerald-600" />
          <span>مشخصات واگن و محصول کوره</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">واگن ورودی</label>
            <input
              type="text"
              value={inputCar}
              onChange={(e) => setInputCar(e.target.value)}
              placeholder="W-105"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">کد محصول</label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              placeholder="PRD-800"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">نوع محصول</label>
            <input
              type="text"
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              placeholder="گرانیت پرسلانی"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">وضعیت خام</label>
            <input
              type="text"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              placeholder="خام استاندارد"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">زمان پوشینگ</label>
            <input
              type="text"
              value={pushingTime}
              onChange={(e) => setPushingTime(e.target.value)}
              placeholder="35 دقیقه"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">شماره واگن خروجی</label>
            <input
              type="text"
              value={outputCar}
              onChange={(e) => setOutputCar(e.target.value)}
              placeholder="W-85"
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* بخش ۳: دماهای اگزوز، پیش‌گرما و ترموستات */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-slate-800 text-xs font-bold">
          <Wind className="w-4 h-4 text-blue-600" />
          <span>دماهای اگزوز، پیش‌گرما و ترموستات (°C)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">دمای اگزوز</label>
            <input
              type="number"
              value={exhaustTemp}
              onChange={(e) => setExhaustTemp(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">پیش‌گرما ۱</label>
            <input
              type="number"
              value={preHeat1}
              onChange={(e) => setPreHeat1(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">پیش‌گرما ۲</label>
            <input
              type="number"
              value={preHeat2}
              onChange={(e) => setPreHeat2(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">ترموستات کوره</label>
            <input
              type="number"
              value={thermostat}
              onChange={(e) => setThermostat(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-amber-700 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* بخش ۴: پروفایل دمایی زون‌های کوره (زون ۰ تا زون ۷) */}
      <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/70">
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-amber-200/80 text-amber-900 text-xs font-bold">
          <Flame className="w-4 h-4 text-amber-600" />
          <span>پروفایل دمای زون‌های کوره پخت (زون ۰ تا زون ۷ - °C)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۰</label>
            <input
              type="number"
              value={zone0}
              onChange={(e) => setZone0(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-semibold text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۱</label>
            <input
              type="number"
              value={zone1}
              onChange={(e) => setZone1(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-semibold text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۲</label>
            <input
              type="number"
              value={zone2}
              onChange={(e) => setZone2(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-semibold text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۳</label>
            <input
              type="number"
              value={zone3}
              onChange={(e) => setZone3(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-semibold text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۴</label>
            <input
              type="number"
              value={zone4}
              onChange={(e) => setZone4(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700 text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۵</label>
            <input
              type="number"
              value={zone5}
              onChange={(e) => setZone5(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-bold text-amber-700 text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۶</label>
            <input
              type="number"
              value={zone6}
              onChange={(e) => setZone6(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-semibold text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1 text-center">زون ۷</label>
            <input
              type="number"
              value={zone7}
              onChange={(e) => setZone7(Number(e.target.value))}
              className="w-full px-2 py-1.5 bg-white border border-amber-200 rounded-lg text-xs font-mono font-semibold text-center focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* بخش ۵: سیستم‌های رپید و مشعل‌های باتوم */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-slate-800 text-xs font-bold">
          <Layers className="w-4 h-4 text-indigo-600" />
          <span>سیستم‌های خنک‌کن رپید و مشعل‌های باتوم (°C)</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">رپید ۱</label>
            <input
              type="number"
              value={rapid1}
              onChange={(e) => setRapid1(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">رپید ۲</label>
            <input
              type="number"
              value={rapid2}
              onChange={(e) => setRapid2(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">باتوم A</label>
            <input
              type="number"
              value={bottomA}
              onChange={(e) => setBottomA(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">باتوم ۱</label>
            <input
              type="number"
              value={bottom1}
              onChange={(e) => setBottom1(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">باتوم B</label>
            <input
              type="number"
              value={bottomB}
              onChange={(e) => setBottomB(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">باتوم ۲</label>
            <input
              type="number"
              value={bottom2}
              onChange={(e) => setBottom2(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* بخش ۶: دمای واگن ۴۴، لوله باتوم، خشک‌کن و توضیحات */}
      <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-2 pb-2 mb-3 border-b border-slate-200 text-slate-800 text-xs font-bold">
          <Thermometer className="w-4 h-4 text-purple-600" />
          <span>دماهای کمکی و لوله‌ها (°C) و یادداشت شیفت</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">دمای واگن ۴۴</label>
            <input
              type="number"
              value={car44Temp}
              onChange={(e) => setCar44Temp(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">دمای لوله باتوم</label>
            <input
              type="number"
              value={bottomPipeTemp}
              onChange={(e) => setBottomPipeTemp(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">دمای لوله خشک‌کن</label>
            <input
              type="number"
              value={dryerPipeTemp}
              onChange={(e) => setDryerPipeTemp(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-700 mb-1">توضیحات و رخدادهای شیفت</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="مثال: تعویض نازل مشعل زون ۵، بررسی فشار گاز ورودی..."
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* کلیدهای عملیات */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <div className="text-[11px] text-slate-500">
          * تمامی مقادیر مستقیماً در دیتابیس ابری ذخیره می‌شوند.
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              انصراف
            </button>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>در حال ثبت در دیتابیس...</span>
              </>
            ) : editRecord ? (
              <>
                <Save className="w-4 h-4" />
                <span>ذخیره تغییرات ردیف</span>
              </>
            ) : (
              <>
                <PlusCircle className="w-4 h-4" />
                <span>ثبت اطلاعات در دیتابیس</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100" dir="rtl">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editRecord ? `ویرایش ردیف ${rowNumber} کوره` : 'ثبت داده جدید در کوره (Kiln-1400)'}
                </h3>
                <p className="text-[11px] text-slate-500">ذخیره مستقیم در دیتابیس فایر استور</p>
              </div>
            </div>
            {onCancel && (
              <button
                onClick={onCancel}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          {formElement}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs mb-6">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100" dir="rtl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">فرم ثبت داده‌های کوره پخت (Kiln-1400)</h3>
            <p className="text-xs text-slate-500">
              ثبت دماهای زون‌های ۰ تا ۷، اگزوز، پیش‌گرما، رپید، باتوم و مشخصات واگن در دیتابیس
            </p>
          </div>
        </div>
      </div>
      {formElement}
    </div>
  );
};
