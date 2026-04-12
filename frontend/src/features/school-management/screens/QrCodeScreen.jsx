import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { QrCode, ToggleLeft, ToggleRight, Download, Layers } from 'lucide-react';
import SchoolManagementLayout from '../layouts/SchoolManagementLayout';
import QrCodeModal from '../components/QrCodeModal';
import { fetchQrCards, updateQrStatus, batchGenerateQr, exportQrCsv, exportQrPdf } from '../api';

function QrCard({ card, onViewQr, onToggleStatus, toggling }) {
  const isActive = card.qrStatus === 'active';

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-[#e2e8f0] bg-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
      {/* QR Image */}
      <div
        className="flex cursor-pointer items-center justify-center bg-[#f8fafc] p-6"
        onClick={() => onViewQr(card)}
      >
        {card.qrCode ? (
          <img
            src={card.qrCode}
            alt={`QR for ${card.firstName} ${card.lastName}`}
            className="h-32 w-32 rounded-xl"
          />
        ) : (
          <div className="flex h-32 w-32 items-center justify-center rounded-xl border border-dashed border-[#e2e8f0]">
            <QrCode className="h-10 w-10 text-[#cbd5e1]" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-1 border-t border-[#f1f5f9] px-4 py-3">
        <p className="typography-body font-semibold text-[#0f172a]">
          {card.firstName} {card.lastName}
        </p>
        <p className="typography-body-sm text-[#94a3b8]">{card.studentId}</p>
        {card.gradeLevel && (
          <p className="typography-body-sm text-[#64748b]">{card.gradeLevel}</p>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-[#f1f5f9] px-4 py-3">
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            isActive ? 'bg-green-50 text-green-700' : 'bg-stone-100 text-[#64748b]'
          }`}
        >
          {isActive ? 'Active' : 'Disabled'}
        </span>
        <button
          type="button"
          onClick={() => onToggleStatus(card)}
          disabled={toggling}
          className="flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium text-[#64748b] transition-colors hover:bg-stone-100 disabled:opacity-40"
        >
          {isActive ? (
            <ToggleRight className="h-4 w-4 text-[#006117]" />
          ) : (
            <ToggleLeft className="h-4 w-4" />
          )}
          {isActive ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}

export default function QrCodeScreen() {
  const { schoolId } = useParams();
  const { getToken } = useAuth();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const [qrModal, setQrModal] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(null); // 'csv' | 'pdf' | null

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchQrCards({ getToken, schoolId });
        if (!cancelled) setCards(data ?? []);
      } catch (err) {
        if (!cancelled) setError(err.message ?? 'Failed to load QR cards');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [getToken, schoolId, refreshKey]);

  async function handleToggleStatus(card) {
    const id = card._id ?? card.id;
    const newStatus = card.qrStatus === 'active' ? 'disabled' : 'active';
    setTogglingId(id);
    try {
      const updated = await updateQrStatus({ getToken, id, status: newStatus });
      setCards((prev) =>
        prev.map((c) => ((c._id ?? c.id) === id ? { ...c, qrStatus: updated.qrStatus ?? newStatus } : c))
      );
    } catch (err) {
      alert(err.message ?? 'Failed to update QR status');
    } finally {
      setTogglingId(null);
    }
  }

  async function handleBatchGenerate() {
    setGenerating(true);
    try {
      await batchGenerateQr({ getToken, schoolId });
      setRefreshKey((k) => k + 1);
    } catch (err) {
      alert(err.message ?? 'Failed to generate QR codes');
    } finally {
      setGenerating(false);
    }
  }

  async function handleExport(type) {
    setExporting(type);
    try {
      const res = type === 'csv'
        ? await exportQrCsv({ getToken, schoolId })
        : await exportQrPdf({ getToken, schoolId });
      if (!res.ok) throw new Error(`Export failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-codes.${type}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message ?? 'Export failed');
    } finally {
      setExporting(null);
    }
  }

  return (
    <>
      <SchoolManagementLayout
        totalFacilities={undefined}
        activeItemKey="schools"
        title="QR Codes"
        subtitle="Manage and export student QR codes."
        breadcrumbItems={[
          { label: 'Dashboard', href: '/school-management' },
          { label: 'Schools', href: '/school-management/schools' },
          { label: 'QR Codes' },
        ]}
      >
        <div className="flex flex-col gap-6 pb-8">
          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting !== null}
              className="flex items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
            </button>
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={exporting !== null}
              className="flex items-center gap-2 rounded-3xl border border-[#e2e8f0] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] hover:bg-stone-50 disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={handleBatchGenerate}
              disabled={generating}
              className="flex items-center gap-2 rounded-3xl bg-[#006117] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#005414] disabled:opacity-50 transition-colors"
            >
              <Layers className="h-4 w-4" />
              {generating ? 'Generating…' : 'Generate All QR Codes'}
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-4">
              <p className="text-sm font-medium text-red-700">{error}</p>
            </div>
          )}

          {/* Loading grid */}
          {loading && (
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-3xl border border-[#e2e8f0] bg-white" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && cards.length === 0 && (
            <div className="rounded-3xl border border-[#e2e8f0] bg-white py-16 text-center">
              <p className="typography-body text-[#64748b]">No QR cards found. Generate QR codes first.</p>
            </div>
          )}

          {/* Card grid */}
          {!loading && !error && cards.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {cards.map((card) => (
                <QrCard
                  key={card._id ?? card.id}
                  card={card}
                  onViewQr={setQrModal}
                  onToggleStatus={handleToggleStatus}
                  toggling={togglingId === (card._id ?? card.id)}
                />
              ))}
            </div>
          )}
        </div>
      </SchoolManagementLayout>

      {qrModal && (
        <QrCodeModal
          student={qrModal}
          onClose={() => setQrModal(null)}
        />
      )}
    </>
  );
}
