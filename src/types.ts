export interface KilnRecord {
  id: string;
  rowNumber?: number;
  date: string; // تاریخ
  operatorCode: string; // کد اپراتور
  operator: string; // اپراتور
  time: string; // ساعت
  raw: string; // خام
  inputCar: string; // واگن ورودی
  productCode: string; // کد محصول
  productType: string; // نوع محصول
  exhaustTemp: number; // دمای اگزوز
  preHeat1: number; // پیش گرما1
  preHeat2: number; // پیش گرما2
  thermostat: number; // ترموستات
  zone0: number; // زون0
  zone1: number; // زون1
  zone2: number; // زون2
  zone3: number; // زون3
  zone4: number; // زون4
  zone5: number; // زون5
  zone6: number; // زون6
  zone7: number; // زون7
  rapid1: number; // رپید1
  rapid2: number; // رپید2
  bottomA: number; // باتوم A
  bottom1: number; // باتوم1
  bottomB: number; // باتومB
  bottom2: number; // باتوم 2
  car44Temp: number; // دمای واگن 44
  bottomPipeTemp: number; // دمای لوله باتوم
  dryerPipeTemp: number; // دمای لوله خشک کن
  pushingTime: string; // زمان پوشینگ
  outputCar: string; // شماره واگن خروجی
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  [key: string]: any;
}

export interface DryerRecord {
  id: string;
  rowNumber?: number; // ردیف
  month?: string; // ماه
  loadDateSolar: string; // تاریخ بارگیری شمسی
  loadDateTimeGregorian?: string; // تاریخ و زمان بارگیری میلادی
  chamberNumber: string; // شماره چمبر
  fingerCount: number; // تعداد فینگر تولیدی
  loadingOperator: string; // اپراتور بارگیری
  productionType: string; // نوع تولید
  unloadDateTimeSolar?: string; // تاریخ و زمان تخلیه شمسی
  unloadDateTimeGregorian?: string; // تاریخ و زمان تخلیه میلادی
  unloadingOperator?: string; // اپراتور تخلیه
  duration?: string; // مدت زمان

  // Compatibility / Extended Dryer Fields
  date?: string; // تاریخ عمومی
  time?: string; // ساعت
  shift?: string; // شیفت
  operatorCode?: string; // کد اپراتور
  operator?: string; // نام اپراتور
  dryerLine?: string; // خط / دستگاه
  productCode?: string; // کد محصول
  productType?: string; // نوع محصول
  rawMoisture?: number; // رطوبت ورودی (%)
  dryMoisture?: number; // رطوبت خروجی (%)
  dryingCycleTime?: number; // سیکل خشک کن (دقیقه)
  burnerInletTemp?: number; // دمای مشعل
  exhaustTemp?: number; // دمای اگزوز
  outletTemp?: number; // دمای خروجی
  layer1Temp?: number; // طبقه 1
  layer2Temp?: number; // طبقه 2
  layer3Temp?: number; // طبقه 3
  layer4Temp?: number; // طبقه 4
  layer5Temp?: number; // طبقه 5
  layer6Temp?: number;
  layer7Temp?: number;
  fanPressure?: number;
  gasPressure?: number;
  lineSpeed?: number;
  inputQuantity?: number;
  defectRate?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  [key: string]: any;
}

export interface SettingRecord {
  id: string;
  rowNumber?: number; // ردیف
  date: string; // تاریخ
  month: string; // ماه
  day?: string; // روز
  shift: string; // شیفت
  shiftSupervisor?: string; // سرشیفت
  operatorName: string; // نام اپراتور
  personnelCount?: number; // تعداد پرسنل
  chamberNumber: string; // شماره چمبر
  product: string; // محصول
  fingerCount: number; // تعداد فینگر
  columnCount?: number; // تعداد ستون

  // Car 1 (واگن اول)
  car1_number?: string; // شماره واگن
  car1_glazeType?: string; // لعاب/خودرنگ
  car1_startTime?: string; // زمان شروع
  car1_endTime?: string; // زمان پایان
  car1_packageCount?: number; // تعداد بسته
  car1_brickCount?: number; // تعداد خشت
  car1_totalTileCount?: number; // تعداد کل سفال

  // Car 2 (واگن دوم)
  car2_number?: string;
  car2_glazeType?: string;
  car2_startTime?: string;
  car2_endTime?: string;
  car2_packageCount?: number;
  car2_brickCount?: number;
  car2_totalTileCount?: number;

  // Car 3 (واگن سوم)
  car3_number?: string;
  car3_glazeType?: string;
  car3_startTime?: string;
  car3_endTime?: string;
  car3_packageCount?: number;
  car3_brickCount?: number;
  car3_totalTileCount?: number;

  // Car 4 (واگن چهارم)
  car4_number?: string;
  car4_glazeType?: string;
  car4_startTime?: string;
  car4_endTime?: string;
  car4_packageCount?: number;
  car4_brickCount?: number;
  car4_totalTileCount?: number;

  // Waste & Totals & Efficiencies
  machineWaste?: number; // ضایعات ماشین آلات
  dryerWaste?: number; // ضایعات خشک کن
  validationStatus?: string; // صحت اعداد وارد شده بین بسته ها و فینگر
  totalPackagedBricks?: number; // تعداد کل خشت بسته بندی شده
  totalBricksInChamber?: number; // تعداد خشت داخل چمبر
  pressSettingEfficiency?: string | number; // راندمان ماشین آلات پرس و ستینگ
  dryerEfficiency?: string | number; // راندمان خشک کن
  chamberFinalEfficiency?: string | number; // راندمان نهایی چمبر
  pressDryerStatus?: string; // وضعیت راندمان ماشین آلات پرس و خشک کن
  dryerPerformanceStatus?: string; // وضعیت عملکرد خشک کن
  overallKilnInletPerformance?: string; // عملکرد کلی تا ورودی کوره
  chamberUnloadTimeEfficiency?: string; // بازده زمانی تخلیه کل چمبر

  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  [key: string]: any;
}

export type DbRecord = KilnRecord;

export type ColumnType = 'number' | 'date' | 'category' | 'boolean' | 'text';

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'radial';

export type AggregationType = 'sum' | 'avg' | 'count' | 'min' | 'max';

export interface ColumnInfo {
  name: string;
  key: string;
  type: ColumnType;
  sampleValues: (string | number | boolean | null)[];
  distinctCount: number;
  nullCount: number;
  min?: number;
  max?: number;
  avg?: number;
  sum?: number;
  categories?: { label: string; count: number }[];
}

export interface FilterState {
  globalSearch: string;
  columnFilters: Record<string, any>;
  dateRange?: {
    columnKey: string;
    start: string;
    end: string;
  };
}

export interface SheetMetadata {
  id: string;
  title: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
    rowCount?: number;
    columnCount?: number;
  }[];
}

export interface SheetData {
  spreadsheetId: string;
  sheetName?: string;
  sheetTitle?: string;
  spreadsheetTitle: string;
  headers?: string[];
  rawHeaders?: string[];
  rows: Record<string, any>[];
  columns: ColumnInfo[];
  totalRows: number;
  totalColumns?: number;
  lastUpdated: string;
}


export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
  iconLink?: string;
}

