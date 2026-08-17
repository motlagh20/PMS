import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { KilnRecord, DryerRecord, SettingRecord } from '../types';

export const COLLECTION_NAME = 'kiln_records';
export const DRYER_COLLECTION_NAME = 'dryer_records';
export const SETTING_COLLECTION_NAME = 'setting_records';
export const DRYER_SPREADSHEET_ID = '1gj6OrjE1vd4RLSnWtCBGkDdyW0nT4gW4-AB3DOZUd5E';
export const SETTING_FILE_ID = '1WD0PFLbVF6allfQR9YvixTT_yJe0j1gE';
export const SETTING_SPREADSHEET_ID = SETTING_FILE_ID;

/**
 * Real-time subscription to kiln records in Firestore.
 */
export function subscribeToKilnRecords(
  callback: (records: KilnRecord[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: KilnRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            rowNumber: data.rowNumber || 1,
            date: data.date || new Date().toISOString().split('T')[0],
            operatorCode: data.operatorCode || '',
            operator: data.operator || '',
            time: data.time || '08:00',
            raw: data.raw || 'خام',
            inputCar: data.inputCar || '',
            productCode: data.productCode || '',
            productType: data.productType || '',
            exhaustTemp: Number(data.exhaustTemp) || 0,
            preHeat1: Number(data.preHeat1) || 0,
            preHeat2: Number(data.preHeat2) || 0,
            thermostat: Number(data.thermostat) || 0,
            zone0: Number(data.zone0) || 0,
            zone1: Number(data.zone1) || 0,
            zone2: Number(data.zone2) || 0,
            zone3: Number(data.zone3) || 0,
            zone4: Number(data.zone4) || 0,
            zone5: Number(data.zone5) || 0,
            zone6: Number(data.zone6) || 0,
            zone7: Number(data.zone7) || 0,
            rapid1: Number(data.rapid1) || 0,
            rapid2: Number(data.rapid2) || 0,
            bottomA: Number(data.bottomA) || 0,
            bottom1: Number(data.bottom1) || 0,
            bottomB: Number(data.bottomB) || 0,
            bottom2: Number(data.bottom2) || 0,
            car44Temp: Number(data.car44Temp) || 0,
            bottomPipeTemp: Number(data.bottomPipeTemp) || 0,
            dryerPipeTemp: Number(data.dryerPipeTemp) || 0,
            pushingTime: data.pushingTime || '',
            outputCar: data.outputCar || '',
            notes: data.notes || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt || new Date().toISOString(),
            createdBy: data.createdBy || '',
            ...data,
          };
        });
        callback(list);
      },
      (error) => {
        console.error('Firestore onSnapshot error for kiln_records:', error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error('subscribeToKilnRecords error:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Add a new kiln log record to Firestore.
 */
export async function addKilnRecord(record: Omit<KilnRecord, 'id'>): Promise<string> {
  const colRef = collection(db, COLLECTION_NAME);

  const payload: any = {
    ...record,
    rowNumber: Number(record.rowNumber) || 1,
    exhaustTemp: Number(record.exhaustTemp) || 0,
    preHeat1: Number(record.preHeat1) || 0,
    preHeat2: Number(record.preHeat2) || 0,
    thermostat: Number(record.thermostat) || 0,
    zone0: Number(record.zone0) || 0,
    zone1: Number(record.zone1) || 0,
    zone2: Number(record.zone2) || 0,
    zone3: Number(record.zone3) || 0,
    zone4: Number(record.zone4) || 0,
    zone5: Number(record.zone5) || 0,
    zone6: Number(record.zone6) || 0,
    zone7: Number(record.zone7) || 0,
    rapid1: Number(record.rapid1) || 0,
    rapid2: Number(record.rapid2) || 0,
    bottomA: Number(record.bottomA) || 0,
    bottom1: Number(record.bottom1) || 0,
    bottomB: Number(record.bottomB) || 0,
    bottom2: Number(record.bottom2) || 0,
    car44Temp: Number(record.car44Temp) || 0,
    bottomPipeTemp: Number(record.bottomPipeTemp) || 0,
    dryerPipeTemp: Number(record.dryerPipeTemp) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

/**
 * Update an existing kiln log in Firestore.
 */
export async function updateKilnRecord(id: string, updates: Partial<KilnRecord>): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const payload: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, payload);
}

/**
 * Delete a kiln log from Firestore.
 */
export async function deleteKilnRecord(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Seed initial sample kiln records if empty.
 */
export async function seedInitialKilnRecordsIfEmpty(): Promise<number> {
  const colRef = collection(db, COLLECTION_NAME);
  const snap = await getDocs(query(colRef));
  
  if (snap.size > 0) {
    return snap.size;
  }

  const sampleProducts = [
    { code: 'PRD-800', type: 'گرانیت پرسلانی 60*120' },
    { code: 'PRD-650', type: 'کاشی بدنه 30*90' },
    { code: 'PRD-920', type: 'پرسلان مات 80*80' },
    { code: 'PRD-540', type: 'کاشی لعابدار 40*100' },
  ];

  const operators = [
    { code: '101', name: 'مهندس رضایی' },
    { code: '102', name: 'مهندس محمدی' },
    { code: '103', name: 'مهندس حسینی' },
    { code: '104', name: 'مهندس کریمی' },
  ];

  const batch = writeBatch(db);

  for (let i = 1; i <= 15; i++) {
    const newDoc = doc(colRef);
    const op = operators[i % operators.length];
    const prd = sampleProducts[i % sampleProducts.length];
    const hour = (6 + (i * 2) % 18).toString().padStart(2, '0') + ':00';

    batch.set(newDoc, {
      rowNumber: i,
      date: `1403/05/${(10 + (i % 18)).toString().padStart(2, '0')}`,
      operatorCode: op.code,
      operator: op.name,
      time: hour,
      raw: 'خام استاندارد',
      inputCar: `W-${100 + i}`,
      productCode: prd.code,
      productType: prd.type,
      exhaustTemp: 180 + (i % 15),
      preHeat1: 450 + (i % 25),
      preHeat2: 720 + (i % 30),
      thermostat: 1180,
      zone0: 890 + (i % 20),
      zone1: 980 + (i % 15),
      zone2: 1060 + (i % 18),
      zone3: 1120 + (i % 12),
      zone4: 1175 + (i % 10),
      zone5: 1185 + (i % 8),
      zone6: 1160 + (i % 15),
      zone7: 1040 + (i % 22),
      rapid1: 820 + (i % 25),
      rapid2: 610 + (i % 20),
      bottomA: 1120 + (i % 15),
      bottom1: 1145 + (i % 12),
      bottomB: 1130 + (i % 14),
      bottom2: 1150 + (i % 10),
      car44Temp: 95 + (i % 10),
      bottomPipeTemp: 340 + (i % 15),
      dryerPipeTemp: 210 + (i % 12),
      pushingTime: `${32 + (i % 5)} دقیقه`,
      outputCar: `W-${80 + i}`,
      notes: 'ثبت منظم پارامترهای کوره در شیفت تولید',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return 15;
}

/**
 * Import an array of kiln records into Firestore in batches.
 * Handles automatic chunking (Firestore limit is 500 ops per batch).
 */
export async function importKilnRecordsBatch(
  records: Omit<KilnRecord, 'id'>[],
  onProgress?: (importedCount: number, total: number) => void
): Promise<number> {
  const colRef = collection(db, COLLECTION_NAME);
  const CHUNK_SIZE = 400; // Safe threshold under Firestore 500 limit
  let importedTotal = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const record of chunk) {
      const newDoc = doc(colRef);
      batch.set(newDoc, {
        ...record,
        rowNumber: Number(record.rowNumber) || (importedTotal + 1),
        exhaustTemp: Number(record.exhaustTemp) || 0,
        preHeat1: Number(record.preHeat1) || 0,
        preHeat2: Number(record.preHeat2) || 0,
        thermostat: Number(record.thermostat) || 0,
        zone0: Number(record.zone0) || 0,
        zone1: Number(record.zone1) || 0,
        zone2: Number(record.zone2) || 0,
        zone3: Number(record.zone3) || 0,
        zone4: Number(record.zone4) || 0,
        zone5: Number(record.zone5) || 0,
        zone6: Number(record.zone6) || 0,
        zone7: Number(record.zone7) || 0,
        rapid1: Number(record.rapid1) || 0,
        rapid2: Number(record.rapid2) || 0,
        bottomA: Number(record.bottomA) || 0,
        bottom1: Number(record.bottom1) || 0,
        bottomB: Number(record.bottomB) || 0,
        bottom2: Number(record.bottom2) || 0,
        car44Temp: Number(record.car44Temp) || 0,
        bottomPipeTemp: Number(record.bottomPipeTemp) || 0,
        dryerPipeTemp: Number(record.dryerPipeTemp) || 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      importedTotal++;
    }

    await batch.commit();
    if (onProgress) {
      onProgress(importedTotal, records.length);
    }
  }

  return importedTotal;
}

// Secondary spreadsheet ID from user request
export const SECONDARY_SPREADSHEET_ID = '1gj6OrjE1vd4RLSnWtCBGkDdyW0nT4gW4-AB3DOZUd5E';
export const SECONDARY_COLLECTION_NAME = 'sheet_2_records';

/**
 * Real-time subscription to any generic sheet collection in Firestore
 */
export function subscribeToGenericCollection(
  collectionName: string,
  callback: (records: (Record<string, any> & { id: string })[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const colRef = collection(db, collectionName);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
          };
        });
        callback(list);
      },
      (error) => {
        console.error(`Firestore error on collection ${collectionName}:`, error);
        if (onError) onError(error);
      }
    );
  } catch (err: any) {
    console.error(`Error subscribing to ${collectionName}:`, err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Add a record to any generic sheet collection in Firestore
 */
export async function addGenericRecord(
  collectionName: string,
  data: Record<string, any>
): Promise<string> {
  const colRef = collection(db, collectionName);
  const docRef = await addDoc(colRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update a record in any generic sheet collection in Firestore
 */
export async function updateGenericRecord(
  collectionName: string,
  id: string,
  data: Partial<Record<string, any>>
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  const { id: _, createdAt, ...rest } = data as any;
  await updateDoc(docRef, {
    ...rest,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a record from any generic sheet collection
 */
export async function deleteGenericRecord(
  collectionName: string,
  id: string
): Promise<void> {
  const docRef = doc(db, collectionName, id);
  await deleteDoc(docRef);
}

/**
 * Batch import records into any generic Firestore collection
 */
export async function importGenericRecordsBatch(
  collectionName: string,
  records: Record<string, any>[],
  onProgress?: (importedCount: number, total: number) => void
): Promise<number> {
  const colRef = collection(db, collectionName);
  const CHUNK_SIZE = 400;
  let importedTotal = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const record of chunk) {
      const { id, ...cleanData } = record;
      const newDoc = doc(colRef);
      batch.set(newDoc, {
        ...cleanData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      importedTotal++;
    }

    await batch.commit();
    if (onProgress) {
      onProgress(importedTotal, records.length);
    }
  }

  return importedTotal;
}

// ==========================================
// DRYER (خشک کن) FIRESTORE DATABASE METHODS
// ==========================================

/**
 * Real-time subscription to dryer records in Firestore.
 */
export function subscribeToDryerRecords(
  callback: (records: DryerRecord[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, DRYER_COLLECTION_NAME), orderBy('rowNumber', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: DryerRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            rowNumber: data.rowNumber || 1,
            month: data.month || 'مرداد',
            loadDateSolar: data.loadDateSolar || data.date || '',
            loadDateTimeGregorian: data.loadDateTimeGregorian || '',
            chamberNumber: String(data.chamberNumber || '1'),
            fingerCount: Number(data.fingerCount || data.inputQuantity) || 0,
            loadingOperator: data.loadingOperator || data.operator || '',
            productionType: data.productionType || data.productType || '',
            unloadDateTimeSolar: data.unloadDateTimeSolar || '',
            unloadDateTimeGregorian: data.unloadDateTimeGregorian || '',
            unloadingOperator: data.unloadingOperator || data.operator || '',
            duration: data.duration || `${data.dryingCycleTime || 0} دقیقه`,

            // Extended/Fallback properties
            date: data.date || data.loadDateSolar || '',
            time: data.time || '08:00',
            shift: data.shift || 'صبح',
            operatorCode: data.operatorCode || '',
            operator: data.operator || data.loadingOperator || '',
            dryerLine: data.dryerLine || `چمبر ${data.chamberNumber || 1}`,
            productCode: data.productCode || '',
            productType: data.productType || data.productionType || '',
            rawMoisture: Number(data.rawMoisture) || 0,
            dryMoisture: Number(data.dryMoisture) || 0,
            dryingCycleTime: Number(data.dryingCycleTime) || 0,
            burnerInletTemp: Number(data.burnerInletTemp) || 0,
            exhaustTemp: Number(data.exhaustTemp) || 0,
            outletTemp: Number(data.outletTemp) || 0,
            layer1Temp: Number(data.layer1Temp) || 0,
            layer2Temp: Number(data.layer2Temp) || 0,
            layer3Temp: Number(data.layer3Temp) || 0,
            layer4Temp: Number(data.layer4Temp) || 0,
            layer5Temp: Number(data.layer5Temp) || 0,
            layer6Temp: Number(data.layer6Temp) || 0,
            layer7Temp: Number(data.layer7Temp) || 0,
            fanPressure: Number(data.fanPressure) || 0,
            gasPressure: Number(data.gasPressure) || 0,
            lineSpeed: Number(data.lineSpeed) || 0,
            inputQuantity: Number(data.inputQuantity || data.fingerCount) || 0,
            defectRate: Number(data.defectRate) || 0,
            notes: data.notes || '',
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          };
        });
        callback(list);
      },
      (error) => {
        console.error('Firestore dryer subscription error:', error);
        // If index on rowNumber is not ready, fallback to unordered query
        const fallbackQuery = collection(db, DRYER_COLLECTION_NAME);
        onSnapshot(fallbackQuery, (snapshot) => {
          const list: DryerRecord[] = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              rowNumber: data.rowNumber || 1,
              month: data.month || 'مرداد',
              loadDateSolar: data.loadDateSolar || data.date || '',
              loadDateTimeGregorian: data.loadDateTimeGregorian || '',
              chamberNumber: String(data.chamberNumber || '1'),
              fingerCount: Number(data.fingerCount || data.inputQuantity) || 0,
              loadingOperator: data.loadingOperator || data.operator || '',
              productionType: data.productionType || data.productType || '',
              unloadDateTimeSolar: data.unloadDateTimeSolar || '',
              unloadDateTimeGregorian: data.unloadDateTimeGregorian || '',
              unloadingOperator: data.unloadingOperator || data.operator || '',
              duration: data.duration || '',
              date: data.date || data.loadDateSolar || '',
              time: data.time || '08:00',
              shift: data.shift || 'صبح',
              operatorCode: data.operatorCode || '',
              operator: data.operator || data.loadingOperator || '',
              dryerLine: data.dryerLine || `چمبر ${data.chamberNumber || 1}`,
              productCode: data.productCode || '',
              productType: data.productType || data.productionType || '',
              rawMoisture: Number(data.rawMoisture) || 0,
              dryMoisture: Number(data.dryMoisture) || 0,
              dryingCycleTime: Number(data.dryingCycleTime) || 0,
              burnerInletTemp: Number(data.burnerInletTemp) || 0,
              exhaustTemp: Number(data.exhaustTemp) || 0,
              outletTemp: Number(data.outletTemp) || 0,
              layer1Temp: Number(data.layer1Temp) || 0,
              layer2Temp: Number(data.layer2Temp) || 0,
              layer3Temp: Number(data.layer3Temp) || 0,
              layer4Temp: Number(data.layer4Temp) || 0,
              layer5Temp: Number(data.layer5Temp) || 0,
              layer6Temp: Number(data.layer6Temp) || 0,
              layer7Temp: Number(data.layer7Temp) || 0,
              fanPressure: Number(data.fanPressure) || 0,
              gasPressure: Number(data.gasPressure) || 0,
              lineSpeed: Number(data.lineSpeed) || 0,
              inputQuantity: Number(data.inputQuantity || data.fingerCount) || 0,
              defectRate: Number(data.defectRate) || 0,
              notes: data.notes || '',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
            };
          });
          callback(list.sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0)));
        });
      }
    );
  } catch (err: any) {
    console.error('Failed to set up dryer snapshot listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Add a new dryer record to Firestore.
 */
export async function addDryerRecord(record: Omit<DryerRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const colRef = collection(db, DRYER_COLLECTION_NAME);
  const payload = {
    ...record,
    rowNumber: Number(record.rowNumber) || 1,
    month: record.month || 'مرداد',
    loadDateSolar: record.loadDateSolar || record.date || '',
    loadDateTimeGregorian: record.loadDateTimeGregorian || '',
    chamberNumber: String(record.chamberNumber || '1'),
    fingerCount: Number(record.fingerCount) || 0,
    loadingOperator: record.loadingOperator || record.operator || '',
    productionType: record.productionType || record.productType || '',
    unloadDateTimeSolar: record.unloadDateTimeSolar || '',
    unloadDateTimeGregorian: record.unloadDateTimeGregorian || '',
    unloadingOperator: record.unloadingOperator || record.operator || '',
    duration: record.duration || '',
    date: record.date || record.loadDateSolar || '',
    time: record.time || '08:00',
    shift: record.shift || 'صبح',
    operator: record.operator || record.loadingOperator || '',
    productType: record.productType || record.productionType || '',
    rawMoisture: Number(record.rawMoisture) || 0,
    dryMoisture: Number(record.dryMoisture) || 0,
    dryingCycleTime: Number(record.dryingCycleTime) || 0,
    burnerInletTemp: Number(record.burnerInletTemp) || 0,
    exhaustTemp: Number(record.exhaustTemp) || 0,
    outletTemp: Number(record.outletTemp) || 0,
    layer1Temp: Number(record.layer1Temp) || 0,
    layer2Temp: Number(record.layer2Temp) || 0,
    layer3Temp: Number(record.layer3Temp) || 0,
    layer4Temp: Number(record.layer4Temp) || 0,
    layer5Temp: Number(record.layer5Temp) || 0,
    layer6Temp: Number(record.layer6Temp) || 0,
    layer7Temp: Number(record.layer7Temp) || 0,
    fanPressure: Number(record.fanPressure) || 0,
    gasPressure: Number(record.gasPressure) || 0,
    lineSpeed: Number(record.lineSpeed) || 0,
    inputQuantity: Number(record.inputQuantity || record.fingerCount) || 0,
    defectRate: Number(record.defectRate) || 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(colRef, payload);
  return docRef.id;
}

/**
 * Update an existing dryer log in Firestore.
 */
export async function updateDryerRecord(id: string, updates: Partial<DryerRecord>): Promise<void> {
  const docRef = doc(db, DRYER_COLLECTION_NAME, id);
  const payload: any = {
    ...updates,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(docRef, payload);
}

/**
 * Delete a dryer log from Firestore.
 */
export async function deleteDryerRecord(id: string): Promise<void> {
  const docRef = doc(db, DRYER_COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Seed initial sample dryer records if empty.
 */
export async function seedInitialDryerRecordsIfEmpty(): Promise<number> {
  const colRef = collection(db, DRYER_COLLECTION_NAME);
  const snap = await getDocs(query(colRef));
  
  if (snap.size > 0) {
    return snap.size;
  }

  const sampleProductions = [
    'پرسلان پولیشی 60*60',
    'کاشی لعاب‌دار 80*80',
    'بدنه سفید کالیبره 30*90',
    'اسلب پرسلانی 60*120',
  ];

  const loadingOps = ['مهندس رضایی', 'تکنسین حسینی', 'مهندس اکبری', 'مهندس مهدوی'];
  const unloadingOps = ['تکنسین یوسفی', 'مهندس احمدی', 'تکنسین قنبری'];
  const months = ['تیر', 'مرداد', 'شهریور'];

  const batch = writeBatch(db);

  for (let i = 1; i <= 15; i++) {
    const prod = sampleProductions[i % sampleProductions.length];
    const loadOp = loadingOps[i % loadingOps.length];
    const unloadOp = unloadingOps[i % unloadingOps.length];
    const month = months[i % months.length];
    const day = (10 + (i % 18)).toString().padStart(2, '0');
    const chamber = `${1 + (i % 8)}`;
    const fingers = 450 + (i * 25);
    const durationHours = 4 + (i % 3);

    const newDoc = doc(colRef);
    batch.set(newDoc, {
      rowNumber: i,
      month: month,
      loadDateSolar: `1403/05/${day}`,
      loadDateTimeGregorian: `2024-08-${day} 08:30`,
      chamberNumber: chamber,
      fingerCount: fingers,
      loadingOperator: loadOp,
      productionType: prod,
      unloadDateTimeSolar: `1403/05/${day} 13:00`,
      unloadDateTimeGregorian: `2024-08-${day} 13:00`,
      unloadingOperator: unloadOp,
      duration: `${durationHours}:30 ساعت`,

      // Extended fields
      date: `1403/05/${day}`,
      time: '08:30',
      shift: i % 2 === 0 ? 'صبح' : 'عصر',
      operatorCode: `10${1 + (i % 4)}`,
      operator: loadOp,
      dryerLine: `چمبر ${chamber}`,
      productCode: `DRY-${60 + (i % 4) * 10}`,
      productType: prod,
      rawMoisture: +(6.2 + (i % 8) * 0.15).toFixed(2),
      dryMoisture: +(0.45 + (i % 5) * 0.08).toFixed(2),
      dryingCycleTime: durationHours * 60,
      burnerInletTemp: 195 + (i % 15),
      exhaustTemp: 110 + (i % 12),
      outletTemp: 92 + (i % 10),
      layer1Temp: 165 + (i % 8),
      layer2Temp: 182 + (i % 10),
      layer3Temp: 198 + (i % 12),
      layer4Temp: 204 + (i % 8),
      layer5Temp: 188 + (i % 10),
      layer6Temp: 172 + (i % 8),
      layer7Temp: 152 + (i % 6),
      fanPressure: 32 + (i % 6),
      gasPressure: 85 + (i % 8),
      lineSpeed: 38 + (i % 8),
      inputQuantity: fingers,
      defectRate: +(0.6 + (i % 4) * 0.2).toFixed(2),
      notes: 'بارگیری چمبر خشک‌کن و تخلیه در وضعیت استاندارد',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return 15;
}

/**
 * Import an array of dryer records into Firestore in batches.
 */
export async function importDryerRecordsBatch(
  records: Omit<DryerRecord, 'id'>[],
  onProgress?: (importedCount: number, total: number) => void
): Promise<number> {
  const colRef = collection(db, DRYER_COLLECTION_NAME);
  const CHUNK_SIZE = 400;
  let importedTotal = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const record of chunk) {
      const newDoc = doc(colRef);
      batch.set(newDoc, {
        rowNumber: Number(record.rowNumber) || (importedTotal + 1),
        month: record.month || 'مرداد',
        loadDateSolar: record.loadDateSolar || record.date || '',
        loadDateTimeGregorian: record.loadDateTimeGregorian || '',
        chamberNumber: String(record.chamberNumber || '1'),
        fingerCount: Number(record.fingerCount) || Number(record.inputQuantity) || 0,
        loadingOperator: record.loadingOperator || record.operator || '',
        productionType: record.productionType || record.productType || '',
        unloadDateTimeSolar: record.unloadDateTimeSolar || '',
        unloadDateTimeGregorian: record.unloadDateTimeGregorian || '',
        unloadingOperator: record.unloadingOperator || record.operator || '',
        duration: record.duration || '',
        date: record.date || record.loadDateSolar || '',
        time: record.time || '08:00',
        shift: record.shift || 'صبح',
        operatorCode: record.operatorCode || '',
        operator: record.operator || record.loadingOperator || '',
        dryerLine: record.dryerLine || `چمبر ${record.chamberNumber || 1}`,
        productCode: record.productCode || '',
        productType: record.productType || record.productionType || '',
        rawMoisture: Number(record.rawMoisture) || 0,
        dryMoisture: Number(record.dryMoisture) || 0,
        dryingCycleTime: Number(record.dryingCycleTime) || 0,
        burnerInletTemp: Number(record.burnerInletTemp) || 0,
        exhaustTemp: Number(record.exhaustTemp) || 0,
        outletTemp: Number(record.outletTemp) || 0,
        layer1Temp: Number(record.layer1Temp) || 0,
        layer2Temp: Number(record.layer2Temp) || 0,
        layer3Temp: Number(record.layer3Temp) || 0,
        layer4Temp: Number(record.layer4Temp) || 0,
        layer5Temp: Number(record.layer5Temp) || 0,
        layer6Temp: Number(record.layer6Temp) || 0,
        layer7Temp: Number(record.layer7Temp) || 0,
        fanPressure: Number(record.fanPressure) || 0,
        gasPressure: Number(record.gasPressure) || 0,
        lineSpeed: Number(record.lineSpeed) || 0,
        inputQuantity: Number(record.inputQuantity || record.fingerCount) || 0,
        defectRate: Number(record.defectRate) || 0,
        notes: record.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      importedTotal++;
    }

    await batch.commit();
    if (onProgress) {
      onProgress(importedTotal, records.length);
    }
  }

  return importedTotal;
}

// Compatibility aliases
export const addRecord = addKilnRecord;
export const updateRecord = updateKilnRecord;
export const deleteRecord = deleteKilnRecord;
export const subscribeToRecords = subscribeToKilnRecords;
export const seedInitialDatabaseIfEmpty = seedInitialKilnRecordsIfEmpty;

/**
 * Real-time subscription to Setting & Wagon Loading records in Firestore (Set_1400 / Data).
 */
export function subscribeToSettingRecords(
  callback: (records: SettingRecord[]) => void,
  onError?: (err: Error) => void
) {
  try {
    const q = query(collection(db, SETTING_COLLECTION_NAME), orderBy('rowNumber', 'asc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: SettingRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            rowNumber: data.rowNumber || 1,
            date: data.date || '1400/01/01',
            month: data.month || 'فروردین',
            day: data.day || 'شنبه',
            shift: data.shift || 'صبح',
            shiftSupervisor: data.shiftSupervisor || '',
            operatorName: data.operatorName || '',
            personnelCount: data.personnelCount || 0,
            chamberNumber: String(data.chamberNumber || '1'),
            product: data.product || '',
            fingerCount: Number(data.fingerCount) || 0,
            columnCount: Number(data.columnCount) || 0,

            car1_number: data.car1_number || '',
            car1_glazeType: data.car1_glazeType || '',
            car1_startTime: data.car1_startTime || '',
            car1_endTime: data.car1_endTime || '',
            car1_packageCount: Number(data.car1_packageCount) || 0,
            car1_brickCount: Number(data.car1_brickCount) || 0,
            car1_totalTileCount: Number(data.car1_totalTileCount) || 0,

            car2_number: data.car2_number || '',
            car2_glazeType: data.car2_glazeType || '',
            car2_startTime: data.car2_startTime || '',
            car2_endTime: data.car2_endTime || '',
            car2_packageCount: Number(data.car2_packageCount) || 0,
            car2_brickCount: Number(data.car2_brickCount) || 0,

            car3_number: data.car3_number || '',
            car3_glazeType: data.car3_glazeType || '',
            car3_startTime: data.car3_startTime || '',
            car3_endTime: data.car3_endTime || '',
            car3_packageCount: Number(data.car3_packageCount) || 0,
            car3_brickCount: Number(data.car3_brickCount) || 0,

            car4_number: data.car4_number || '',
            car4_glazeType: data.car4_glazeType || '',
            car4_startTime: data.car4_startTime || '',
            car4_endTime: data.car4_endTime || '',
            car4_packageCount: Number(data.car4_packageCount) || 0,
            car4_brickCount: Number(data.car4_brickCount) || 0,
            car4_totalTileCount: Number(data.car4_totalTileCount) || 0,

            machineWaste: Number(data.machineWaste) || 0,
            dryerWaste: Number(data.dryerWaste) || 0,
            validationStatus: data.validationStatus || '',
            totalPackagedBricks: Number(data.totalPackagedBricks) || 0,
            totalBricksInChamber: Number(data.totalBricksInChamber) || 0,
            pressSettingEfficiency: data.pressSettingEfficiency || '',
            dryerEfficiency: data.dryerEfficiency || '',
            chamberFinalEfficiency: data.chamberFinalEfficiency || '',
            pressDryerStatus: data.pressDryerStatus || '',
            dryerPerformanceStatus: data.dryerPerformanceStatus || '',
            overallKilnInletPerformance: data.overallKilnInletPerformance || '',
            chamberUnloadTimeEfficiency: data.chamberUnloadTimeEfficiency || '',

            notes: data.notes || '',
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        });
        callback(list);
      },
      (err) => {
        console.warn('Setting subscription error, falling back without ordering:', err);
        // Fallback without index
        return onSnapshot(
          collection(db, SETTING_COLLECTION_NAME),
          (snapshot) => {
            const list: SettingRecord[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              return {
                id: docSnap.id,
                rowNumber: data.rowNumber || 1,
                date: data.date || '1400/01/01',
                month: data.month || 'فروردین',
                day: data.day || 'شنبه',
                shift: data.shift || 'صبح',
                shiftSupervisor: data.shiftSupervisor || '',
                operatorName: data.operatorName || '',
                personnelCount: data.personnelCount || 0,
                chamberNumber: String(data.chamberNumber || '1'),
                product: data.product || '',
                fingerCount: Number(data.fingerCount) || 0,
                columnCount: Number(data.columnCount) || 0,

                car1_number: data.car1_number || '',
                car1_glazeType: data.car1_glazeType || '',
                car1_startTime: data.car1_startTime || '',
                car1_endTime: data.car1_endTime || '',
                car1_packageCount: Number(data.car1_packageCount) || 0,
                car1_brickCount: Number(data.car1_brickCount) || 0,
                car1_totalTileCount: Number(data.car1_totalTileCount) || 0,

                car2_number: data.car2_number || '',
                car2_glazeType: data.car2_glazeType || '',
                car2_startTime: data.car2_startTime || '',
                car2_endTime: data.car2_endTime || '',
                car2_packageCount: Number(data.car2_packageCount) || 0,
                car2_brickCount: Number(data.car2_brickCount) || 0,

                car3_number: data.car3_number || '',
                car3_glazeType: data.car3_glazeType || '',
                car3_startTime: data.car3_startTime || '',
                car3_endTime: data.car3_endTime || '',
                car3_packageCount: Number(data.car3_packageCount) || 0,
                car3_brickCount: Number(data.car3_brickCount) || 0,

                car4_number: data.car4_number || '',
                car4_glazeType: data.car4_glazeType || '',
                car4_startTime: data.car4_startTime || '',
                car4_endTime: data.car4_endTime || '',
                car4_packageCount: Number(data.car4_packageCount) || 0,
                car4_brickCount: Number(data.car4_brickCount) || 0,
                car4_totalTileCount: Number(data.car4_totalTileCount) || 0,

                machineWaste: Number(data.machineWaste) || 0,
                dryerWaste: Number(data.dryerWaste) || 0,
                validationStatus: data.validationStatus || '',
                totalPackagedBricks: Number(data.totalPackagedBricks) || 0,
                totalBricksInChamber: Number(data.totalBricksInChamber) || 0,
                pressSettingEfficiency: data.pressSettingEfficiency || '',
                dryerEfficiency: data.dryerEfficiency || '',
                chamberFinalEfficiency: data.chamberFinalEfficiency || '',
                pressDryerStatus: data.pressDryerStatus || '',
                dryerPerformanceStatus: data.dryerPerformanceStatus || '',
                overallKilnInletPerformance: data.overallKilnInletPerformance || '',
                chamberUnloadTimeEfficiency: data.chamberUnloadTimeEfficiency || '',

                notes: data.notes || '',
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              };
            });
            list.sort((a, b) => (a.rowNumber || 0) - (b.rowNumber || 0));
            callback(list);
          },
          onError
        );
      }
    );
  } catch (err: any) {
    if (onError) onError(err);
  }
}

/**
 * Add a single setting record
 */
export async function addSettingRecord(record: Omit<SettingRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const colRef = collection(db, SETTING_COLLECTION_NAME);
  const docRef = await addDoc(colRef, {
    ...record,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Update an existing setting record
 */
export async function updateSettingRecord(id: string, record: Partial<SettingRecord>): Promise<void> {
  const docRef = doc(db, SETTING_COLLECTION_NAME, id);
  const { id: _, createdAt, ...updateData } = record;
  await updateDoc(docRef, {
    ...updateData,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Delete a setting record
 */
export async function deleteSettingRecord(id: string): Promise<void> {
  const docRef = doc(db, SETTING_COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Batch import setting records into Firestore (Set_1400 / Data)
 */
export async function importSettingRecordsBatch(
  records: Omit<SettingRecord, 'id'>[],
  onProgress?: (importedCount: number, total: number) => void
): Promise<number> {
  const colRef = collection(db, SETTING_COLLECTION_NAME);
  const CHUNK_SIZE = 400;
  let importedTotal = 0;

  for (let i = 0; i < records.length; i += CHUNK_SIZE) {
    const chunk = records.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);

    for (const record of chunk) {
      const newDoc = doc(colRef);
      batch.set(newDoc, {
        rowNumber: Number(record.rowNumber) || (importedTotal + 1),
        date: record.date || '1400/01/01',
        month: record.month || 'فروردین',
        day: record.day || 'شنبه',
        shift: record.shift || 'صبح',
        shiftSupervisor: record.shiftSupervisor || '',
        operatorName: record.operatorName || '',
        personnelCount: Number(record.personnelCount) || 0,
        chamberNumber: String(record.chamberNumber || '1'),
        product: record.product || '',
        fingerCount: Number(record.fingerCount) || 0,
        columnCount: Number(record.columnCount) || 0,

        car1_number: record.car1_number || '',
        car1_glazeType: record.car1_glazeType || '',
        car1_startTime: record.car1_startTime || '',
        car1_endTime: record.car1_endTime || '',
        car1_packageCount: Number(record.car1_packageCount) || 0,
        car1_brickCount: Number(record.car1_brickCount) || 0,
        car1_totalTileCount: Number(record.car1_totalTileCount) || 0,

        car2_number: record.car2_number || '',
        car2_glazeType: record.car2_glazeType || '',
        car2_startTime: record.car2_startTime || '',
        car2_endTime: record.car2_endTime || '',
        car2_packageCount: Number(record.car2_packageCount) || 0,
        car2_brickCount: Number(record.car2_brickCount) || 0,

        car3_number: record.car3_number || '',
        car3_glazeType: record.car3_glazeType || '',
        car3_startTime: record.car3_startTime || '',
        car3_endTime: record.car3_endTime || '',
        car3_packageCount: Number(record.car3_packageCount) || 0,
        car3_brickCount: Number(record.car3_brickCount) || 0,

        car4_number: record.car4_number || '',
        car4_glazeType: record.car4_glazeType || '',
        car4_startTime: record.car4_startTime || '',
        car4_endTime: record.car4_endTime || '',
        car4_packageCount: Number(record.car4_packageCount) || 0,
        car4_brickCount: Number(record.car4_brickCount) || 0,
        car4_totalTileCount: Number(record.car4_totalTileCount) || 0,

        machineWaste: Number(record.machineWaste) || 0,
        dryerWaste: Number(record.dryerWaste) || 0,
        validationStatus: record.validationStatus || '',
        totalPackagedBricks: Number(record.totalPackagedBricks) || 0,
        totalBricksInChamber: Number(record.totalBricksInChamber) || 0,
        pressSettingEfficiency: record.pressSettingEfficiency || '',
        dryerEfficiency: record.dryerEfficiency || '',
        chamberFinalEfficiency: record.chamberFinalEfficiency || '',
        pressDryerStatus: record.pressDryerStatus || '',
        dryerPerformanceStatus: record.dryerPerformanceStatus || '',
        overallKilnInletPerformance: record.overallKilnInletPerformance || '',
        chamberUnloadTimeEfficiency: record.chamberUnloadTimeEfficiency || '',

        notes: record.notes || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      importedTotal++;
    }

    await batch.commit();
    if (onProgress) {
      onProgress(importedTotal, records.length);
    }
  }

  return importedTotal;
}

/**
 * Seed initial sample records for Set_1400 if empty
 */
export async function seedInitialSettingRecordsIfEmpty(): Promise<number> {
  const colRef = collection(db, SETTING_COLLECTION_NAME);
  const snap = await getDocs(query(colRef));
  if (!snap.empty) {
    return snap.size;
  }

  const batch = writeBatch(db);
  const sampleProducts = ['پرسلان پولیشی 60*60', 'گرانیتی 80*80', 'سوپر پولیش 60*120', 'طرح کلکته 60*60'];
  const sampleOperators = ['حسین محمدی', 'علی اکبری', 'مهدی قربانی', 'رضا کاظمی'];
  const sampleDays = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  for (let i = 1; i <= 10; i++) {
    const dayNum = String(10 + i).padStart(2, '0');
    const newDoc = doc(colRef);
    const prod = sampleProducts[i % sampleProducts.length];
    const op = sampleOperators[i % sampleOperators.length];
    const ch = `${1 + (i % 8)}`;
    const fingers = 450 + (i * 25);
    const pkg = 40 + (i * 2);
    const brick = 800 + (i * 40);

    batch.set(newDoc, {
      rowNumber: i,
      date: `1400/02/${dayNum}`,
      month: 'اردیبهشت',
      day: sampleDays[i % 7],
      shift: i % 2 === 0 ? 'صبح' : 'عصر',
      shiftSupervisor: 'مهندس رضایی',
      operatorName: op,
      personnelCount: 4,
      chamberNumber: ch,
      product: prod,
      fingerCount: fingers,
      columnCount: 16,

      car1_number: `W-${100 + i}`,
      car1_glazeType: 'لعاب‌دار',
      car1_startTime: '07:30',
      car1_endTime: '09:00',
      car1_packageCount: pkg,
      car1_brickCount: brick,
      car1_totalTileCount: brick,

      car2_number: `W-${101 + i}`,
      car2_glazeType: 'لعاب‌دار',
      car2_startTime: '09:00',
      car2_endTime: '10:30',
      car2_packageCount: pkg,
      car2_brickCount: brick,

      car3_number: `W-${102 + i}`,
      car3_glazeType: 'خودرنگ',
      car3_startTime: '10:30',
      car3_endTime: '12:00',
      car3_packageCount: pkg,
      car3_brickCount: brick,

      car4_number: `W-${103 + i}`,
      car4_glazeType: 'خودرنگ',
      car4_startTime: '12:00',
      car4_endTime: '13:30',
      car4_packageCount: pkg,
      car4_brickCount: brick,
      car4_totalTileCount: brick * 4,

      machineWaste: 12 + (i % 5),
      dryerWaste: 8 + (i % 4),
      validationStatus: 'تایید شده',
      totalPackagedBricks: brick * 4,
      totalBricksInChamber: brick * 4 + 20,
      pressSettingEfficiency: '98.5%',
      dryerEfficiency: '97.2%',
      chamberFinalEfficiency: '96.8%',
      pressDryerStatus: 'عادی',
      dryerPerformanceStatus: 'مطلوب',
      overallKilnInletPerformance: 'عالی',
      chamberUnloadTimeEfficiency: '95%',

      notes: 'بارگیری واگن‌ها و چمبر طبق برنامه تولید انجام شد.',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  await batch.commit();
  return 10;
}


