import React, { useState, useEffect } from 'react';
import { X, Search, FileSpreadsheet, ExternalLink, HardDrive, Sparkles, Check } from 'lucide-react';
import { DEFAULT_SPREADSHEET_ID, DEFAULT_SPREADSHEET_URL, extractSpreadsheetId, fetchDriveSpreadsheets } from '../services/sheetsApi';
import { DriveFileItem } from '../types';

interface SheetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpreadsheet: (spreadsheetId: string, title?: string) => void;
  onLoadSample: () => void;
  currentSpreadsheetId: string;
  accessToken: string | null;
  onSignIn: () => void;
}

export const SheetSelectorModal: React.FC<SheetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectSpreadsheet,
  onLoadSample,
  currentSpreadsheetId,
  accessToken,
  onSignIn,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'drive' | 'preset'>('preset');
  const [inputUrl, setInputUrl] = useState('');
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveSearch, setDriveSearch] = useState('');

  useEffect(() => {
    if (isOpen && accessToken && activeTab === 'drive') {
      loadDriveFiles();
    }
  }, [isOpen, accessToken, activeTab]);

  const loadDriveFiles = async () => {
    if (!accessToken) return;
    setIsLoadingDrive(true);
    try {
      const files = await fetchDriveSpreadsheets(accessToken);
      setDriveFiles(files);
    } catch (err) {
      console.error('Failed to load drive files:', err);
    } finally {
      setIsLoadingDrive(false);
    }
  };

  if (!isOpen) return null;

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    const extractedId = extractSpreadsheetId(inputUrl);
    onSelectSpreadsheet(extractedId);
    onClose();
  };

  const filteredDriveFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(driveSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Select Google Sheet</h2>
              <p className="text-xs text-slate-500">Connect and visualize data from any spreadsheet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab('preset')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'preset'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Linked Sheet
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'url'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Enter Sheet URL / ID
          </button>
          <button
            onClick={() => setActiveTab('drive')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'drive'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            Browse Google Drive
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* TAB 1: PRESET & SAMPLES */}
          {activeTab === 'preset' && (
            <div className="space-y-4">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Your Shared Spreadsheet
              </div>

              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Target Google Sheet</h3>
                    <p className="text-xs text-slate-600 font-mono mt-0.5 break-all">
                      ID: {DEFAULT_SPREADSHEET_ID}
                    </p>
                    <a
                      href={DEFAULT_SPREADSHEET_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium mt-1"
                    >
                      <span>View in Google Docs</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <button
                  id="modal-load-target-sheet-btn"
                  onClick={() => {
                    onSelectSpreadsheet(DEFAULT_SPREADSHEET_ID);
                    onClose();
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0 ${
                    currentSpreadsheetId === DEFAULT_SPREADSHEET_ID
                      ? 'bg-slate-900 text-white cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {currentSpreadsheetId === DEFAULT_SPREADSHEET_ID ? (
                    <span className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> Active
                    </span>
                  ) : (
                    'Load Dashboard'
                  )}
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Instant Demo & Testing
                </div>
                <div className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Sample Multi-Category Sales Data</h4>
                      <p className="text-xs text-slate-500">60 records with regions, products, revenue & profit metrics</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      onLoadSample();
                      onClose();
                    }}
                    className="px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                  >
                    Load Sample
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: URL / ID */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Google Sheet URL or Spreadsheet ID
                </label>
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1RCISvgeznYHJor-GCTD8I39rKeJJeFKa6j33peNmaM0/edit"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Paste full URL or spreadsheet ID. Make sure you have view access with your signed-in Google account.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!inputUrl.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors"
                >
                  Load Spreadsheet
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: DRIVE BROWSER */}
          {activeTab === 'drive' && (
            <div>
              {!accessToken ? (
                <div className="text-center py-8">
                  <HardDrive className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-900">Sign in to browse Google Drive</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                    Connect your Google account to list spreadsheets directly from your Google Drive.
                  </p>
                  <button
                    onClick={onSignIn}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
                  >
                    Sign In with Google
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search Drive spreadsheets..."
                      value={driveSearch}
                      onChange={(e) => setDriveSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {isLoadingDrive ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      Loading spreadsheets from Google Drive...
                    </div>
                  ) : filteredDriveFiles.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No Google spreadsheets found in Drive matching your query.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                      {filteredDriveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="py-2.5 px-2 flex items-center justify-between hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-800 truncate">{file.name}</p>
                              <p className="text-[10px] text-slate-400">
                                Modified: {new Date(file.modifiedTime).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              onSelectSpreadsheet(file.id, file.name);
                              onClose();
                            }}
                            className="px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors shrink-0"
                          >
                            Open
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
