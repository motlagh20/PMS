import { ColumnInfo, ColumnType, SheetData, FilterState, AggregationType } from '../types';

export function sanitizeKey(header: string, index: number): string {
  const clean = header
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/^_+|_+$/g, '');
  return clean || `col_${index}`;
}

export function isNumber(val: any): boolean {
  if (typeof val === 'number') return !isNaN(val);
  if (typeof val === 'string') {
    const clean = val.replace(/[\$,€,£,%]/g, '').trim();
    return clean !== '' && !isNaN(Number(clean));
  }
  return false;
}

export function parseNumber(val: any): number {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const clean = val.replace(/[\$,€,£,%]/g, '').trim();
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  }
  return 0;
}

export function isDateString(val: any): boolean {
  if (!val || typeof val !== 'string') return false;
  // Match standard dates like YYYY-MM-DD, MM/DD/YYYY, DD-MM-YYYY, or ISO
  if (/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}/.test(val)) return true;
  if (/^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}/.test(val)) return true;
  const parsed = Date.parse(val);
  return !isNaN(parsed) && val.length > 5 && isNaN(Number(val));
}

export function inferColumnType(values: any[]): ColumnType {
  const nonNulls = values.filter((v) => v !== null && v !== undefined && v !== '');
  if (nonNulls.length === 0) return 'text';

  let numCount = 0;
  let dateCount = 0;
  let boolCount = 0;

  for (const v of nonNulls) {
    if (typeof v === 'boolean' || v === 'TRUE' || v === 'FALSE' || v === 'true' || v === 'false') {
      boolCount++;
    } else if (isNumber(v)) {
      numCount++;
    } else if (isDateString(v)) {
      dateCount++;
    }
  }

  const ratio = 0.65;
  if (boolCount / nonNulls.length >= ratio) return 'boolean';
  if (numCount / nonNulls.length >= ratio) return 'number';
  if (dateCount / nonNulls.length >= ratio) return 'date';

  // Check distinct count to determine if it's a category
  const distinct = new Set(nonNulls.map((v) => String(v).trim()));
  if (distinct.size <= Math.min(30, Math.max(5, nonNulls.length * 0.4))) {
    return 'category';
  }

  return 'text';
}

export function processRawSheetData(
  rawHeaders: string[],
  rawRows: any[][],
  sheetName: string,
  spreadsheetId: string,
  spreadsheetTitle: string
): SheetData {
  const columnKeys = rawHeaders.map((h, idx) => sanitizeKey(h, idx));
  
  // Ensure unique keys
  const uniqueKeys: string[] = [];
  const keyCounts: Record<string, number> = {};
  columnKeys.forEach((key) => {
    if (!keyCounts[key]) {
      keyCounts[key] = 1;
      uniqueKeys.push(key);
    } else {
      keyCounts[key]++;
      uniqueKeys.push(`${key}_${keyCounts[key]}`);
    }
  });

  // Convert raw rows to objects with typed parsing
  const rows: Record<string, any>[] = rawRows.map((rowArr, rowIndex) => {
    const rowObj: Record<string, any> = { _id: rowIndex + 1 };
    uniqueKeys.forEach((key, colIndex) => {
      const cell = rowArr[colIndex];
      rowObj[key] = cell !== undefined && cell !== null ? cell : null;
    });
    return rowObj;
  });

  // Analyze each column
  const columns: ColumnInfo[] = uniqueKeys.map((key, colIndex) => {
    const name = rawHeaders[colIndex] || `Column ${colIndex + 1}`;
    const allColValues = rows.map((r) => r[key]);
    const type = inferColumnType(allColValues);

    const nonNulls = allColValues.filter((v) => v !== null && v !== undefined && v !== '');
    const distinctSet = new Set(nonNulls.map((v) => String(v)));
    const distinctCount = distinctSet.size;
    const nullCount = allColValues.length - nonNulls.length;

    let min: number | undefined;
    let max: number | undefined;
    let sum: number | undefined;
    let avg: number | undefined;
    let categories: { label: string; count: number }[] | undefined;

    if (type === 'number') {
      const numbers = nonNulls.map((v) => parseNumber(v)).filter((n) => !isNaN(n));
      if (numbers.length > 0) {
        min = Math.min(...numbers);
        max = Math.max(...numbers);
        sum = numbers.reduce((acc, curr) => acc + curr, 0);
        avg = Math.round((sum / numbers.length) * 100) / 100;
      }
    }

    if (type === 'category' || type === 'text' || type === 'boolean') {
      const freq: Record<string, number> = {};
      nonNulls.forEach((v) => {
        const label = String(v).trim();
        freq[label] = (freq[label] || 0) + 1;
      });
      categories = Object.entries(freq)
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
    }

    return {
      name,
      key,
      type,
      sampleValues: nonNulls.slice(0, 5),
      distinctCount,
      nullCount,
      min,
      max,
      sum,
      avg,
      categories,
    };
  });

  // Re-cast row values to appropriate types
  rows.forEach((row) => {
    columns.forEach((col) => {
      const val = row[col.key];
      if (col.type === 'number') {
        row[col.key] = val !== null && val !== undefined && val !== '' ? parseNumber(val) : null;
      } else if (col.type === 'boolean') {
        if (typeof val === 'boolean') {
          row[col.key] = val;
        } else if (typeof val === 'string') {
          row[col.key] = val.toLowerCase() === 'true';
        }
      } else if (val !== null && val !== undefined) {
        row[col.key] = String(val);
      }
    });
  });

  return {
    sheetName,
    spreadsheetId,
    spreadsheetTitle,
    columns,
    rawHeaders,
    rows,
    totalRows: rows.length,
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

export function filterRows(
  rows: Record<string, any>[],
  filterState: FilterState,
  columns: ColumnInfo[]
): Record<string, any>[] {
  const { globalSearch, columnFilters, dateRange } = filterState;
  const searchLower = globalSearch.trim().toLowerCase();

  return rows.filter((row) => {
    // 1. Global text search across all columns
    if (searchLower) {
      const matchesSearch = columns.some((col) => {
        const val = row[col.key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }

    // 2. Specific Column filters
    for (const [colKey, filterVal] of Object.entries(columnFilters)) {
      if (filterVal === undefined || filterVal === null || filterVal === '' || filterVal === 'ALL') {
        continue;
      }
      const cellVal = row[colKey];

      // Array multi-select
      if (Array.isArray(filterVal) && filterVal.length > 0) {
        if (!filterVal.includes(String(cellVal))) return false;
      } else if (typeof filterVal === 'string') {
        if (String(cellVal).toLowerCase() !== filterVal.toLowerCase()) return false;
      } else if (typeof filterVal === 'object' && filterVal.min !== undefined) {
        const numVal = parseNumber(cellVal);
        if (filterVal.min !== '' && numVal < Number(filterVal.min)) return false;
        if (filterVal.max !== '' && numVal > Number(filterVal.max)) return false;
      }
    }

    // 3. Date range filter
    if (dateRange && dateRange.columnKey && (dateRange.start || dateRange.end)) {
      const cellDate = new Date(row[dateRange.columnKey]);
      if (!isNaN(cellDate.getTime())) {
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          if (cellDate < startDate) return false;
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          // Set to end of day
          endDate.setHours(23, 59, 59, 999);
          if (cellDate > endDate) return false;
        }
      }
    }

    return true;
  });
}

export function aggregateChartData(
  rows: Record<string, any>[],
  xAxisKey: string,
  yAxisKeys: string[],
  aggregation: AggregationType
): Record<string, any>[] {
  const groups: Record<string, { count: number; values: Record<string, number[]> }> = {};

  rows.forEach((row) => {
    let rawX = row[xAxisKey];
    if (rawX === null || rawX === undefined || rawX === '') {
      rawX = '(Empty)';
    } else {
      rawX = String(rawX);
    }

    if (!groups[rawX]) {
      groups[rawX] = {
        count: 0,
        values: {},
      };
      yAxisKeys.forEach((yKey) => {
        groups[rawX].values[yKey] = [];
      });
    }

    groups[rawX].count++;
    yAxisKeys.forEach((yKey) => {
      const num = parseNumber(row[yKey]);
      if (!isNaN(num)) {
        groups[rawX].values[yKey].push(num);
      }
    });
  });

  const result: Record<string, any>[] = Object.entries(groups).map(([xVal, data]) => {
    const item: Record<string, any> = { [xAxisKey]: xVal, _count: data.count };

    yAxisKeys.forEach((yKey) => {
      const nums = data.values[yKey] || [];
      if (nums.length === 0) {
        item[yKey] = 0;
        return;
      }

      switch (aggregation) {
        case 'sum':
          item[yKey] = Math.round(nums.reduce((acc, curr) => acc + curr, 0) * 100) / 100;
          break;
        case 'avg':
          const sum = nums.reduce((acc, curr) => acc + curr, 0);
          item[yKey] = Math.round((sum / nums.length) * 100) / 100;
          break;
        case 'count':
          item[yKey] = nums.length;
          break;
        case 'min':
          item[yKey] = Math.min(...nums);
          break;
        case 'max':
          item[yKey] = Math.max(...nums);
          break;
        default:
          item[yKey] = nums.reduce((acc, curr) => acc + curr, 0);
      }
    });

    return item;
  });

  // Limit to top 25 categories or sort chronologically if dates
  return result.slice(0, 35);
}

export function formatValue(val: any, type?: ColumnType): string {
  if (val === null || val === undefined || val === '') return '—';
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return Number.isInteger(val) ? val.toString() : val.toFixed(2);
  }
  if (typeof val === 'boolean') {
    return val ? 'True' : 'False';
  }
  return String(val);
}
