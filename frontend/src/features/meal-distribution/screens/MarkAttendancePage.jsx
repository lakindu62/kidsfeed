import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { QrCode } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  completeMealSession,
  fetchAttendanceBySession,
  fetchMealSessions,
  markAttendanceByQr,
  markAttendanceByStudentId,
} from '../api';
import { FeatureSidebar, FeatureTopBar } from '../components';
import { useMealDistributionSchool } from '../hooks';
import '../styles/meal-distribution.css';

function formatMealType(mealType) {
  if (!mealType) return '-';
  return mealType
    .toString()
    .toLowerCase()
    .replace(/^\w/, (m) => m.toUpperCase());
}

function toDateKey(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

export default function MarkAttendancePage() {
  const navigate = useNavigate();
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceMode, setAttendanceMode] = useState('manual');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [qrStudentIdInput, setQrStudentIdInput] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const qrInputRef = useRef(null);
  const qrFileInputRef = useRef(null);
  const qrVideoRef = useRef(null);
  const scannerRef = useRef(null);
  const scanControlsRef = useRef(null);
  const lastScanAtRef = useRef(0);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const selectedSession = useMemo(
    () => sessions.find((session) => session.id === selectedSessionId),
    [sessions, selectedSessionId],
  );
  const todayDateKey = toDateKey(new Date());
  const todaysSessions = useMemo(
    () =>
      sessions.filter((session) => toDateKey(session.date) === todayDateKey),
    [sessions, todayDateKey],
  );

  const loadSessions = useCallback(async () => {
    if (!apiUrl || !schoolId) return;
    const data = await fetchMealSessions({
      apiUrl,
      schoolId,
      getToken: isSignedIn ? getToken : undefined,
    });
    setSessions(data);
    const todayOnly = data.filter(
      (session) => toDateKey(session.date) === todayDateKey,
    );
    if (!selectedSessionId && todayOnly.length > 0) {
      setSelectedSessionId(todayOnly[0].id);
    }
  }, [apiUrl, schoolId, getToken, isSignedIn, selectedSessionId, todayDateKey]);

  const loadAttendance = useCallback(async () => {
    if (!apiUrl || !selectedSessionId) {
      setAttendanceRows([]);
      return;
    }
    const data = await fetchAttendanceBySession({
      apiUrl,
      mealSessionId: selectedSessionId,
      getToken: isSignedIn ? getToken : undefined,
    });
    setAttendanceRows(data);
  }, [apiUrl, selectedSessionId, getToken, isSignedIn]);

  useEffect(() => {
    loadSessions().catch((loadError) =>
      setError(loadError.message || 'Failed to load meal sessions'),
    );
  }, [loadSessions]);

  useEffect(() => {
    loadAttendance().catch((loadError) =>
      setError(loadError.message || 'Failed to load attendance'),
    );
  }, [loadAttendance]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 2500);
    return () => clearTimeout(timer);
  }, [successMessage]);

  useEffect(() => {
    if (qrInputRef.current) {
      qrInputRef.current.focus();
    }
  }, [selectedSessionId]);

  const handleManualMark = async (event) => {
    event.preventDefault();
    if (!selectedSessionId || !studentIdInput.trim()) return;
    setIsBusy(true);
    setError('');
    try {
      await markAttendanceByStudentId({
        apiUrl,
        getToken: isSignedIn ? getToken : undefined,
        studentId: studentIdInput.trim(),
        mealSessionId: selectedSessionId,
      });
      setStudentIdInput('');
      setSuccessMessage('Attendance marked successfully.');
      await Promise.all([loadAttendance(), loadSessions()]);
    } catch (markError) {
      setError(markError.message || 'Failed to mark attendance');
    } finally {
      setIsBusy(false);
    }
  };

  const handleQrMark = async (event) => {
    event.preventDefault();
    if (!selectedSessionId || !qrStudentIdInput.trim()) return;
    setIsBusy(true);
    setError('');
    try {
      await markAttendanceFromQrValue(qrStudentIdInput.trim());
      setQrStudentIdInput('');
      if (qrInputRef.current) {
        qrInputRef.current.focus();
      }
    } catch (markError) {
      setError(markError.message || 'Failed to mark attendance by QR');
    } finally {
      setIsBusy(false);
    }
  };

  const extractStudentIdFromQrValue = (decodedValue) => {
    if (!decodedValue) return '';
    const text = String(decodedValue).trim();
    if (!text) return '';

    try {
      const parsed = JSON.parse(text);
      if (parsed?.studentId) {
        return String(parsed.studentId).trim();
      }
    } catch {
      // Not JSON; treat as raw student ID text.
    }

    return text;
  };

  const markAttendanceFromQrValue = useCallback(
    async (decodedValue, successText = 'Attendance marked via QR.') => {
      const studentId = extractStudentIdFromQrValue(decodedValue);
      if (!studentId) {
        throw new Error('QR code does not contain a valid student ID.');
      }

      await markAttendanceByQr({
        apiUrl,
        getToken: isSignedIn ? getToken : undefined,
        studentId,
        mealSessionId: selectedSessionId,
      });

      setSuccessMessage(successText);
      await Promise.all([loadAttendance(), loadSessions()]);
      return studentId;
    },
    [
      apiUrl,
      getToken,
      isSignedIn,
      loadAttendance,
      loadSessions,
      selectedSessionId,
    ],
  );

  const stopCameraScan = useCallback(() => {
    if (scanControlsRef.current) {
      scanControlsRef.current.stop();
      scanControlsRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  const startCameraScan = useCallback(async () => {
    if (!qrVideoRef.current) return;
    if (!selectedSessionId) {
      setCameraError('Select a meal session before starting camera scan.');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        'Camera is not supported in this browser. Use Chrome/Edge on localhost or HTTPS.',
      );
      return;
    }

    try {
      setCameraError('');
      if (!scannerRef.current) {
        scannerRef.current = new BrowserMultiFormatReader();
      }

      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setCameraDevices(devices);
      const cameraId = selectedCameraId || devices[0]?.deviceId || undefined;
      if (!cameraId) {
        throw new Error('No camera device found.');
      }
      if (!selectedCameraId) {
        setSelectedCameraId(cameraId);
      }

      stopCameraScan();
      scanControlsRef.current = await scannerRef.current.decodeFromVideoDevice(
        cameraId,
        qrVideoRef.current,
        async (result) => {
          if (!result || isBusy) return;
          const now = Date.now();
          if (now - lastScanAtRef.current < 1200) return;
          lastScanAtRef.current = now;

          setIsBusy(true);
          setError('');
          try {
            await markAttendanceFromQrValue(
              result.getText(),
              'Attendance marked from live camera scan.',
            );
          } catch (scanError) {
            setError(
              scanError.message || 'Failed to mark attendance from camera',
            );
          } finally {
            setIsBusy(false);
          }
        },
      );
      setIsCameraActive(true);
    } catch (scanError) {
      if (scanError?.name === 'NotAllowedError') {
        setCameraError(
          'Camera permission denied. Allow camera access in browser settings and try again.',
        );
      } else if (scanError?.name === 'NotFoundError') {
        setCameraError('No camera device found on this system.');
      } else {
        setCameraError(scanError.message || 'Unable to start camera scanner.');
      }
      stopCameraScan();
    }
  }, [
    isBusy,
    markAttendanceFromQrValue,
    selectedCameraId,
    selectedSessionId,
    stopCameraScan,
  ]);

  useEffect(() => {
    return () => {
      stopCameraScan();
    };
  }, [stopCameraScan]);

  useEffect(() => {
    if (attendanceMode === 'manual' && isCameraActive) {
      stopCameraScan();
    }
  }, [attendanceMode, isCameraActive, stopCameraScan]);

  useEffect(() => {
    if (isCameraActive) {
      startCameraScan();
    }
  }, [selectedCameraId, isCameraActive, startCameraScan]);

  const handleQrImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (typeof window.BarcodeDetector === 'undefined') {
      setError(
        'QR image scanning is not supported in this browser. Use manual/QR text input.',
      );
      return;
    }

    setIsBusy(true);
    setError('');

    try {
      const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
      const imageBitmap = await createImageBitmap(file);
      const detected = await detector.detect(imageBitmap);
      imageBitmap.close();

      if (!detected || detected.length === 0) {
        throw new Error('No QR code found in uploaded image.');
      }

      const rawValue = detected[0]?.rawValue || '';
      const studentId = extractStudentIdFromQrValue(rawValue);
      if (!studentId) {
        throw new Error('QR code does not contain a valid student ID.');
      }

      await markAttendanceFromQrValue(
        studentId,
        `Attendance marked from uploaded QR for ${studentId}.`,
      );
      setQrStudentIdInput('');
    } catch (scanError) {
      setError(scanError.message || 'Failed to scan uploaded QR image');
    } finally {
      setIsBusy(false);
      if (qrFileInputRef.current) {
        qrFileInputRef.current.value = '';
      }
      if (qrInputRef.current) {
        qrInputRef.current.focus();
      }
    }
  };

  const handleQrInputKeyDown = (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (isBusy || !selectedSessionId || !qrStudentIdInput.trim()) return;
    handleQrMark(event);
  };

  const handleCompleteSession = async () => {
    if (!selectedSessionId) return;
    setIsBusy(true);
    setError('');
    try {
      await completeMealSession({
        apiUrl,
        getToken: isSignedIn ? getToken : undefined,
        mealSessionId: selectedSessionId,
      });
      setSuccessMessage('Meal session marked as completed.');
      await loadSessions();
    } catch (completeError) {
      setError(completeError.message || 'Failed to complete session');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="meal-distribution-root min-h-screen bg-[#f6f6f6] text-zinc-900">
      <div className="mx-auto flex w-full max-w-[1536px]">
        <FeatureSidebar
          schoolName={schoolName}
          activeItem="attendance"
          navigate={navigate}
        />

        <main className="w-[1280px] shrink-0 pt-3 pr-10 pb-8 pl-6">
          <FeatureTopBar
            title="Mark Attendance"
            subtitle="Mark student attendance for a selected meal session"
            searchPlaceholder=""
          />

          <section className="rounded-[12px] bg-[#f0f1f1] p-8">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-zinc-600">
                  Meal Session
                </label>
                <select
                  value={selectedSessionId}
                  onChange={(event) => setSelectedSessionId(event.target.value)}
                  className="h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-green-600"
                >
                  {todaysSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {new Date(session.date).toLocaleDateString()} -{' '}
                      {formatMealType(session.mealType)} ({session.status})
                    </option>
                  ))}
                </select>
                {todaysSessions.length === 0 && (
                  <p className="mt-2 text-xs font-medium text-amber-700">
                    No meal sessions found for today.
                  </p>
                )}
              </div>
              <div className="flex items-start md:pt-6">
                <Button
                  type="button"
                  onClick={handleCompleteSession}
                  disabled={
                    !selectedSessionId ||
                    isBusy ||
                    selectedSession?.status === 'COMPLETED'
                  }
                  size="lg"
                  className="h-11 w-auto min-w-[170px] rounded-xl bg-gradient-to-br from-[#116e20] to-[#006117] px-4 text-sm font-semibold tracking-[0.01em] text-white shadow-[0px_8px_20px_-8px_rgba(0,97,23,0.45)] transition-all hover:translate-y-[-1px] hover:shadow-[0px_12px_24px_-8px_rgba(0,97,23,0.55)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {selectedSession?.status === 'COMPLETED'
                    ? 'Session Completed'
                    : 'Complete Session'}
                </Button>
              </div>
            </div>

            <div className="mt-6">
              <div className="mb-4 inline-flex rounded-xl bg-white p-1 shadow-sm">
                <div className="relative grid h-9 w-[220px] grid-cols-2 items-center">
                  <span
                    className={[
                      'absolute top-0 left-0 z-0 h-9 w-1/2 rounded-lg bg-[#116e20] transition-transform duration-300 ease-out',
                      attendanceMode === 'qr'
                        ? 'translate-x-full'
                        : 'translate-x-0',
                    ].join(' ')}
                  />
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('manual')}
                    className={[
                      'relative z-10 h-9 rounded-lg text-xs font-semibold transition-colors',
                      attendanceMode === 'manual'
                        ? 'text-white'
                        : 'text-zinc-600',
                    ].join(' ')}
                  >
                    Manual
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttendanceMode('qr')}
                    className={[
                      'relative z-10 h-9 rounded-lg text-xs font-semibold transition-colors',
                      attendanceMode === 'qr' ? 'text-white' : 'text-zinc-600',
                    ].join(' ')}
                  >
                    QR Code
                  </button>
                </div>
              </div>

              {attendanceMode === 'manual' && (
                <form
                  onSubmit={handleManualMark}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <h3 className="mb-3 text-sm font-semibold text-zinc-800">
                    Manual Entry
                  </h3>
                  <label className="mb-1 block text-xs font-semibold text-zinc-600">
                    Student ID
                  </label>
                  <input
                    value={studentIdInput}
                    onChange={(event) => setStudentIdInput(event.target.value)}
                    placeholder="Enter student ID"
                    className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-green-600"
                  />
                  <Button
                    type="submit"
                    disabled={
                      !selectedSessionId || !studentIdInput.trim() || isBusy
                    }
                    variant="outline"
                    size="lg"
                    className="mt-4 h-10 w-full rounded-lg border-green-700 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Mark by Student ID
                  </Button>
                </form>
              )}

              {attendanceMode === 'qr' && (
                <form
                  onSubmit={handleQrMark}
                  className="rounded-xl bg-white p-5 shadow-sm"
                >
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                    <QrCode className="h-4 w-4" />
                    QR Entry
                  </h3>
                  <div className="mb-3 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100">
                    <video
                      ref={qrVideoRef}
                      className="h-44 w-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      onClick={
                        isCameraActive ? stopCameraScan : startCameraScan
                      }
                      disabled={!selectedSessionId || isBusy}
                      variant="outline"
                      size="default"
                      className="h-9 rounded-lg border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
                    >
                      {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                    </Button>
                    <select
                      value={selectedCameraId}
                      onChange={(event) =>
                        setSelectedCameraId(event.target.value)
                      }
                      className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 outline-none"
                    >
                      <option value="">Default Camera</option>
                      {cameraDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `Camera ${device.deviceId.slice(-4)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {!selectedSessionId && (
                    <p className="mb-3 text-xs font-medium text-amber-700">
                      Select today&apos;s meal session first to enable camera
                      scanning.
                    </p>
                  )}
                  {cameraError && (
                    <p className="mb-3 text-xs font-medium text-red-600">
                      {cameraError}
                    </p>
                  )}
                  <label className="mb-1 block text-xs font-semibold text-zinc-600">
                    Scanned Student ID
                  </label>
                  <input
                    ref={qrInputRef}
                    value={qrStudentIdInput}
                    onChange={(event) =>
                      setQrStudentIdInput(event.target.value)
                    }
                    onKeyDown={handleQrInputKeyDown}
                    placeholder="Paste scanned student ID"
                    className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-sm outline-none focus:border-green-600"
                  />
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-semibold text-zinc-600">
                      Or upload QR image
                    </label>
                    <input
                      ref={qrFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleQrImageUpload}
                      disabled={!selectedSessionId || isBusy}
                      className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-60"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={
                      !selectedSessionId || !qrStudentIdInput.trim() || isBusy
                    }
                    variant="outline"
                    size="lg"
                    className="mt-4 h-10 w-full rounded-lg border-green-700 text-sm font-semibold text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Mark by QR
                  </Button>
                </form>
              )}
            </div>

            {error && (
              <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
            )}
            {successMessage && (
              <p className="mt-4 text-sm font-medium text-green-700">
                {successMessage}
              </p>
            )}

            <div className="mt-6 overflow-x-auto rounded-xl bg-white">
              <table className="w-full">
                <thead className="bg-[#e7e8e8] text-left text-xs font-medium text-zinc-500">
                  <tr>
                    <th className="px-5 py-3">Student ID</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Served At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {attendanceRows.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 text-sm text-zinc-800">
                        {row.studentId}
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-800">
                        {row.status}
                      </td>
                      <td className="px-5 py-3 text-sm text-zinc-800">
                        {row.servedAt
                          ? new Date(row.servedAt).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {attendanceRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-5 py-6 text-center text-sm text-zinc-500"
                      >
                        No attendance records for selected session.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
