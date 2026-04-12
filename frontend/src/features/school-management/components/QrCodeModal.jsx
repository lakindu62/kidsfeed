import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { fetchStudentQr } from '../api';

export default function QrCodeModal({ student, onClose }) {
  const { getToken } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const data = await fetchStudentQr({ getToken, id: student._id ?? student.id });
        if (!cancelled) setQrCode(data.qrCode);
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load QR code');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [getToken, student]);

  function handleDownload() {
    if (!qrCode) return;
    const a = document.createElement('a');
    a.href = qrCode;
    a.download = `qr-${student.studentId ?? student._id ?? student.id}.png`;
    a.click();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-xs rounded-3xl border border-[#e2e8f0] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#f1f5f9] px-6 py-5">
          <div>
            <h2 className="typography-body-lg font-semibold text-[#0f172a]">QR Code</h2>
            <p className="typography-body-sm text-[#64748b]">
              {student.firstName} {student.lastName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#64748b] hover:bg-stone-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-4 px-6 py-6">
          {loading && (
            <div className="h-48 w-48 animate-pulse rounded-2xl bg-[#e2e8f0]" />
          )}
          {!loading && error && (
            <p className="text-sm text-red-600">{error}</p>
          )}
          {!loading && qrCode && (
            <img
              src={qrCode}
              alt={`QR code for ${student.firstName} ${student.lastName}`}
              className="h-48 w-48 rounded-2xl border border-[#e2e8f0]"
            />
          )}
          <p className="typography-body-sm text-[#94a3b8]">
            Student ID: {student.studentId ?? '—'}
          </p>

          <div className="flex w-full justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] hover:bg-stone-50"
            >
              Close
            </button>
            {qrCode && (
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-2 rounded-3xl bg-[#006117] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005414]"
              >
                <Download className="h-4 w-4" />
                Download
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
