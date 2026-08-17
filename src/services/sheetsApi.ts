import Papa from 'papaparse';
import { SheetMetadata, DriveFileItem } from '../types';

export const DEFAULT_SPREADSHEET_ID = '1RCISvgeznYHJor-GCTD8I39rKeJJeFKa6j33peNmaM0';
export const DEFAULT_SPREADSHEET_URL = `https://docs.google.com/spreadsheets/d/${DEFAULT_SPREADSHEET_ID}/edit?usp=sharing`;

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return DEFAULT_SPREADSHEET_ID;

  // Match /spreadsheets/d/([a-zA-Z0-9-_]+)
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }

  // If it's just the ID directly
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }

  return trimmed;
}

/**
 * Fetch spreadsheet metadata. Tries server proxy first (to avoid CORS), then API v4, then fallback.
 */
export async function fetchSpreadsheetMetadata(
  spreadsheetId: string,
  accessToken?: string | null
): Promise<SheetMetadata> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  // 1. Try via our backend API proxy (no CORS issues)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await fetch(`/api/sheets/metadata?spreadsheetId=${encodeURIComponent(cleanId)}`, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (err) {
    console.warn('Backend proxy metadata fetch failed, trying direct...', err);
  }

  // 2. Direct API v4 if accessToken is available
  if (accessToken) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?includeGridData=false`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          id: data.spreadsheetId,
          title: data.properties?.title || 'گوگل شیت',
          sheets: (data.sheets || []).map((s: any) => ({
            sheetId: s.properties?.sheetId,
            title: s.properties?.title || 'Sheet1',
            index: s.properties?.index ?? 0,
            rowCount: s.properties?.gridProperties?.rowCount,
            columnCount: s.properties?.gridProperties?.columnCount,
          })),
        };
      }
    } catch (err) {
      console.warn('Direct API v4 metadata fetch failed:', err);
    }
  }

  // 3. Fallback: candidate sheet tab names
  const candidateSheets = [
    'Data',
    'Kiln-1400 (input)',
    'Dryer-1400 (input)',
    'Set_1400',
    'ورودی داده‌ها',
    'ورودی',
    'Sheet1',
  ];

  return {
    id: cleanId,
    title: 'فایل گوگل شیت',
    sheets: candidateSheets.map((title, index) => ({
      sheetId: index,
      title,
      index,
    })),
  };
}

/**
 * Format raw 2D values into clean headers and rows.
 */
function formatSheetValues(values: any[][]): { headers: string[]; rows: any[][] } {
  if (!values || values.length === 0) {
    return { headers: [], rows: [] };
  }

  // Find first non-empty header row
  let headerRowIndex = 0;
  for (let i = 0; i < values.length; i++) {
    if (
      values[i] &&
      values[i].some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== '')
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const rawHeaders = values[headerRowIndex] || [];
  const headers = rawHeaders.map((h: any, idx: number) => {
    const str = h !== undefined && h !== null ? String(h).trim() : '';
    return str || `ستون ${idx + 1}`;
  });

  const rows = values
    .slice(headerRowIndex + 1)
    .filter((r) => r && r.some((cell: any) => cell !== undefined && cell !== null && String(cell).trim() !== ''));

  return { headers, rows };
}

/**
 * Fetches sheet values with server-side proxy (bypassing CORS) + client-side fallbacks.
 */
export async function fetchSheetValues(
  spreadsheetId: string,
  sheetName: string,
  accessToken?: string | null
): Promise<{ headers: string[]; rows: any[][] }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);

  // 1. Try our backend proxy endpoint (Primary & Most Reliable - NO CORS)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const proxyUrl = `/api/sheets/fetch?spreadsheetId=${encodeURIComponent(
      cleanId
    )}&sheetName=${encodeURIComponent(sheetName)}`;

    const response = await fetch(proxyUrl, { headers });

    if (response.ok) {
      const data = await response.json();
      if (data.values && Array.isArray(data.values) && data.values.length > 0) {
        return formatSheetValues(data.values);
      }
    } else {
      const errorData = await response.json().catch(() => ({}));
      if (errorData.error) {
        console.warn('Backend proxy returned error:', errorData.error);
      }
    }
  } catch (err) {
    console.warn('Backend proxy fetch failed, falling back to direct API...', err);
  }

  // 2. Direct Authenticated Google Sheets API v4 if accessToken is present
  if (accessToken) {
    try {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(
        sheetName
      )}!A1:ZZZ?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const values: any[][] = data.values || [];
        if (values.length > 0) {
          return formatSheetValues(values);
        }
      }
    } catch (err) {
      console.warn('API v4 direct fetch failed:', err);
    }
  }

  // 3. Fallback direct CSV export
  const endpoints = [
    `https://docs.google.com/spreadsheets/d/${cleanId}/gviz/tq?tqx=out:csv${
      sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''
    }`,
    `https://docs.google.com/spreadsheets/d/${cleanId}/export?format=csv${
      sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''
    }`,
  ];

  for (const url of endpoints) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const text = await response.text();
      if (
        text.includes('<!DOCTYPE html>') ||
        text.includes('<html') ||
        text.includes('accounts.google.com')
      ) {
        continue;
      }

      const parsed = Papa.parse<any[]>(text, { skipEmptyLines: true });
      if (parsed.data && parsed.data.length > 0) {
        return formatSheetValues(parsed.data);
      }
    } catch (err) {
      console.warn('Direct CSV fetch failed:', err);
    }
  }

  throw new Error(
    'امکان دریافت مستقیم اطلاعات شیت وجود نداشت. لطفاً اطمینان حاصل کنید دسترسی اشتراک‌گذاری فایل روی «هر فرد دارای پیوند (Anyone with the link)» باشد یا با حساب گوگل لاگین کنید.'
  );
}

export async function fetchDriveSpreadsheets(accessToken: string): Promise<DriveFileItem[]> {
  if (!accessToken) return [];
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&pageSize=25&orderBy=modifiedTime%20desc`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      console.warn('Could not fetch drive spreadsheets list:', response.statusText);
      return [];
    }

    const data = await response.json();
    return data.files || [];
  } catch (err) {
    console.warn('Drive files fetch error:', err);
    return [];
  }
}
