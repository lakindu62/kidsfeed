import { useState, useRef } from 'react';
import { X, Download, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { downloadImportTemplate, previewImport, confirmImport } from '../api';

const STEPS = ['Download Template', 'Preview', 'Confirm'];

export default function CsvImportWizard({ schoolId, onClose, onImported }) {
  const { getToken } = useAuth();
  const fileInputRef = useRef(null);

  const [step, setStep] = useState(0); // 0=download, 1=preview, 2=confirm
  const [preview, setPreview] = useState(null); // { valid, invalid, headers, rows, importToken }
  const [setFile] = useState(null);
  const [importToken, setImportToken] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);

  async function handleDownloadTemplate() {
    try {
      const res = await downloadImportTemplate({ getToken, schoolId });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'students-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message ?? 'Failed to download template');
    }
  }

  async function handleFileChange(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError(null);
    setUploading(true);
    try {
      const data = await previewImport({ getToken, schoolId, file: f });
      // Normalize backend shape → component shape
      const previewRows = data.preview ?? [];
      const headers = previewRows.length > 0 ? Object.keys(previewRows[0]) : [];
      // const _errorRowNums = new Set((data.errors ?? []).map((e) => e.row));
      // Build combined rows list: valid rows + flag error rows
      const rows = previewRows.map((rowData) => ({
        data: rowData,
        valid: true,
      }));
      setPreview({
        valid: data.validRows,
        invalid: data.errorCount,
        headers,
        rows,
        errors: data.errors ?? [],
        importToken: data.importToken,
      });
      setImportToken(data.importToken ?? null);
      setStep(1);
    } catch (err) {
      setError(err.message ?? 'Failed to parse CSV');
    } finally {
      setUploading(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    setError(null);
    try {
      await confirmImport({ getToken, schoolId, importToken });
      setConfirmed(true);
      setStep(2);
    } catch (err) {
      setError(err.message ?? 'Import failed');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-[#e2e8f0] bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
          <div>
            <h2 className="typography-body-lg font-semibold text-[#0f172a]">
              Import Students
            </h2>
            <div className="mt-1 flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      i < step
                        ? 'bg-[#006117] text-white'
                        : i === step
                          ? 'border-2 border-[#006117] text-[#006117]'
                          : 'border-2 border-[#e2e8f0] text-[#94a3b8]'
                    }`}
                  >
                    {i < step ? '✓' : i + 1}
                  </div>
                  <span
                    className={`typography-body-sm ${
                      i === step
                        ? 'font-semibold text-[#0f172a]'
                        : 'text-[#94a3b8]'
                    }`}
                  >
                    {label}
                  </span>
                  {i < STEPS.length - 1 && (
                    <div className="h-px w-6 bg-[#e2e8f0]" />
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#64748b] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="px-6 py-6">
          {/* Step 0: Download template + upload */}
          {step === 0 && (
            <div className="flex flex-col items-center gap-6 py-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <p className="typography-body text-[#334155]">
                  Download the CSV template, fill in student data, then upload
                  it below.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] transition-colors hover:bg-stone-50"
                >
                  <Download className="h-4 w-4" />
                  Download Template
                </button>
              </div>

              <div className="w-full border-t border-[#f1f5f9]" />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#e2e8f0] bg-[#f8fafc] px-6 py-10 transition-colors hover:border-[#006117]/40 hover:bg-[#f0fdf4]"
              >
                {uploading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#006117] border-t-transparent" />
                ) : (
                  <Upload className="h-8 w-8 text-[#94a3b8]" />
                )}
                <p className="typography-body-sm text-[#64748b]">
                  {uploading ? 'Parsing CSV…' : 'Click to upload your CSV file'}
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* Step 1: Preview */}
          {step === 1 && preview && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    {preview.valid} valid
                  </span>
                </div>
                {preview.invalid > 0 && (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <span className="text-sm font-medium text-red-700">
                      {preview.invalid} invalid (will be skipped)
                    </span>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#e2e8f0]">
                <div className="max-h-64 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                        {(preview.headers ?? []).map((h) => (
                          <th
                            key={h}
                            className="px-4 py-2.5 text-left text-xs font-bold tracking-wide text-[#64748b] uppercase"
                          >
                            {h}
                          </th>
                        ))}
                        <th className="px-4 py-2.5 text-left text-xs font-bold tracking-wide text-[#64748b] uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {(preview.rows ?? []).map((row, i) => (
                        <tr key={i} className={row.valid ? '' : 'bg-red-50'}>
                          {(preview.headers ?? []).map((h) => (
                            <td key={h} className="px-4 py-2.5 text-[#475569]">
                              {row.data?.[h] ?? '—'}
                            </td>
                          ))}
                          <td className="px-4 py-2.5">
                            {row.valid ? (
                              <span className="text-xs font-medium text-green-600">
                                Valid
                              </span>
                            ) : (
                              <span
                                className="text-xs font-medium text-red-600"
                                title={row.error}
                              >
                                Invalid
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setPreview(null);
                    setFile(null);
                    setError(null);
                  }}
                  className="rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] hover:bg-stone-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={confirming || preview.valid === 0}
                  className="rounded-3xl bg-[#006117] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005414] disabled:opacity-50"
                >
                  {confirming
                    ? 'Importing…'
                    : `Import ${preview.valid} Student${preview.valid !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Done */}
          {step === 2 && confirmed && (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle className="h-12 w-12 text-[#006117]" />
              <p className="typography-body-lg font-semibold text-[#0f172a]">
                Import Complete
              </p>
              <p className="typography-body-sm text-[#64748b]">
                {preview?.valid ?? 0} student
                {(preview?.valid ?? 0) !== 1 ? 's' : ''} were imported
                successfully.
              </p>
              <button
                type="button"
                onClick={onImported}
                className="rounded-3xl bg-[#006117] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#005414]"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
