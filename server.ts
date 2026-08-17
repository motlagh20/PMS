import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import Papa from 'papaparse';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Google Sheets metadata endpoint (proxies to bypass browser CORS)
  app.get('/api/sheets/metadata', async (req, res) => {
    const spreadsheetId = req.query.spreadsheetId as string;
    const authHeader = req.headers.authorization;

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }

    try {
      if (authHeader) {
        const v4Url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?includeGridData=false`;
        const gResponse = await fetch(v4Url, {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/json',
          },
        });

        if (gResponse.ok) {
          const data = await gResponse.json();
          return res.json({
            id: data.spreadsheetId,
            title: data.properties?.title || 'گوگل شیت',
            sheets: (data.sheets || []).map((s: any) => ({
              sheetId: s.properties?.sheetId,
              title: s.properties?.title || 'Sheet1',
              index: s.properties?.index ?? 0,
              rowCount: s.properties?.gridProperties?.rowCount,
              columnCount: s.properties?.gridProperties?.columnCount,
            })),
          });
        }
      }

      // Public candidate sheets probe
      const candidateSheets = [
        'Data',
        'Kiln-1400 (input)',
        'Dryer-1400 (input)',
        'Set_1400',
        'ورودی داده‌ها',
        'ورودی',
        'Sheet1',
      ];

      return res.json({
        id: spreadsheetId,
        title: 'فایل گوگل شیت',
        sheets: candidateSheets.map((title, index) => ({
          sheetId: index,
          title,
          index,
        })),
      });
    } catch (err: any) {
      console.error('Error fetching sheet metadata:', err);
      return res.status(500).json({ error: err.message || 'خطا در خواندن متادیتا' });
    }
  });

  // Google Sheets values fetch proxy (proxies CSV/gviz/v4 to bypass browser CORS)
  app.get('/api/sheets/fetch', async (req, res) => {
    const spreadsheetId = req.query.spreadsheetId as string;
    const sheetName = req.query.sheetName as string | undefined;
    const authHeader = req.headers.authorization;

    if (!spreadsheetId) {
      return res.status(400).json({ error: 'spreadsheetId is required' });
    }

    try {
      // 1. If accessToken provided, use official API v4
      if (authHeader) {
        try {
          const v4Url = sheetName
            ? `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
                sheetName
              )}!A1:ZZZ?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`
            : `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:ZZZ`;

          const gResponse = await fetch(v4Url, {
            headers: {
              Authorization: authHeader,
              'Content-Type': 'application/json',
            },
          });

          if (gResponse.ok) {
            const data = await gResponse.json();
            const values = data.values || [];
            return res.json({ values });
          }
        } catch (e) {
          console.warn('API v4 fetch via server failed, trying public endpoints...', e);
        }
      }

      // 2. Fetch public CSV / GViz endpoints from server (no CORS restrictions on server-side Node.js)
      const endpoints = [
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv${
          sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''
        }`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv${
          sheetName ? `&sheet=${encodeURIComponent(sheetName)}` : ''
        }`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv`,
        `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`,
      ];

      for (const url of endpoints) {
        try {
          const resp = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          if (!resp.ok) continue;

          const text = await resp.text();
          if (
            text.includes('<!DOCTYPE html>') ||
            text.includes('<html') ||
            text.includes('accounts.google.com')
          ) {
            continue;
          }

          const parsed = Papa.parse<any[]>(text, { skipEmptyLines: true });
          if (parsed.data && parsed.data.length > 0) {
            return res.json({ values: parsed.data });
          }
        } catch (err) {
          console.warn(`Failed fetching from ${url}:`, err);
        }
      }

      return res.status(404).json({
        error:
          'امکان دریافت اطلاعات فایل شیت وجود ندارد. لطفاً مطمئن شوید دسترسی فایل در گوگل روی «هر فرد دارای پیوند (Anyone with the link)» قرار دارد.',
      });
    } catch (err: any) {
      console.error('Error in /api/sheets/fetch:', err);
      return res.status(500).json({ error: err.message || 'خطا در ارتباط با سرور' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
