import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { AlertCircle, CheckCircle2, QrCode, Upload, Video } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  completeMealSession,
  fetchAttendanceBySession,
  fetchGuardianNotificationsForSession,
  fetchMealSessions,
  markAttendanceByQr,
  markAttendanceByStudentId,
} from '../api';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';
import { FeatureSidebar, FeatureTopBar } from '../components';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
} from '../hooks';
import '../styles/meal-distribution.css';

/** Styles for native button elements — shared Button may ignore className merges. */
const mealPrimaryActionClass = cn(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl bg-gradient-to-br from-[#116e20] to-[#006117] text-sm font-semibold tracking-[0.01em] text-white shadow-[0px_8px_20px_-8px_rgba(0,97,23,0.45)] transition-all',
  'hover:translate-y-[-1px] hover:shadow-[0px_12px_24px_-8px_rgba(0,97,23,0.55)]',
  'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#116e20]/50 focus-visible:ring-offset-2',
);

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
  const apiUrl = resolveApiBaseUrl();

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceMode, setAttendanceMode] = useState('manual');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const qrFileInputRef = useRef(null);
  const qrVideoRef = useRef(null);
  const scannerRef = useRef(null);
  const scanControlsRef = useRef(null);
  const lastScanAtRef = useRef(0);
  const cameraScanProcessingRef = useRef(false);
  const [cameraDevices, setCameraDevices] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [guardianNotifyRows, setGuardianNotifyRows] = useState([]);

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

  const loadGuardianNotifications = useCallback(async () => {
    if (!apiUrl || !selectedSessionId) {
      setGuardianNotifyRows([]);
      return;
    }
    try {
      const data = await fetchGuardianNotificationsForSession({
        apiUrl,
        mealSessionId: selectedSessionId,
        getToken: isSignedIn ? getToken : undefined,
      });
      setGuardianNotifyRows(data);
    } catch {
      setGuardianNotifyRows([]);
    }
  }, [apiUrl, selectedSessionId, getToken, isSignedIn]);

  useEffect(() => {
    loadSessions().catch((loadError) =>
      setError(
        describeApiFetchFailure(loadError, 'Failed to load meal sessions'),
      ),
    );
  }, [loadSessions]);

  useEffect(() => {
    loadAttendance().catch((loadError) =>
      setError(describeApiFetchFailure(loadError, 'Failed to load attendance')),
    );
  }, [loadAttendance]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = setTimeout(() => setSuccessMessage(''), 4500);
    return () => clearTimeout(timer);
  }, [successMessage]);

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
      setError(describeApiFetchFailure(markError, 'Failed to mark attendance'));
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
    cameraScanProcessingRef.current = false;
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

      let devices = await BrowserMultiFormatReader.listVideoInputDevices();

      // Browsers often hide real deviceId until the user has granted camera once,
      // or report zero video inputs until after a successful getUserMedia.
      const idsHidden =
        devices.length > 0 &&
        devices.every((d) => !String(d.deviceId || '').trim());
      if (idsHidden || devices.length === 0) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
          });
          stream.getTracks().forEach((t) => t.stop());
          devices = await BrowserMultiFormatReader.listVideoInputDevices();
        } catch (primeErr) {
          if (primeErr?.name === 'NotAllowedError') {
            setCameraError(
              'Camera permission denied. Allow camera access in browser settings and try again.',
            );
            return;
          }
          // Continue — we may still open the default camera via broad constraints.
        }
      }

      setCameraDevices(devices);

      const trimmedPick = String(selectedCameraId || '').trim();
      const firstRealId = devices.find((d) =>
        String(d.deviceId || '').trim(),
      )?.deviceId;
      let deviceIdForScan = trimmedPick || firstRealId || undefined;
      if (deviceIdForScan === '') {
        deviceIdForScan = undefined;
      }

      stopCameraScan();

      const reader = scannerRef.current;
      /**
       * ZXing calls (result, error, controls). The callback must stop the scanner
       * synchronously on success — if the handler is `async`, the library still
       * schedules another scan tick before `await` runs, so the camera never stops.
       */
      const onDecode = (result, decodeError, controls) => {
        if (decodeError) return;
        if (!result || typeof result.getText !== 'function') return;
        if (cameraScanProcessingRef.current) return;

        const now = Date.now();
        if (now - lastScanAtRef.current < 1200) return;
        lastScanAtRef.current = now;

        cameraScanProcessingRef.current = true;

        try {
          controls?.stop();
        } catch {
          /* ignore */
        }
        scanControlsRef.current = null;
        setIsCameraActive(false);

        const payloadText = result.getText();

        void (async () => {
          setIsBusy(true);
          setError('');
          try {
            await markAttendanceFromQrValue(
              payloadText,
              'Attendance marked successfully. The camera has been turned off.',
            );
          } catch (scanError) {
            setError(
              scanError.message || 'Failed to mark attendance from camera',
            );
          } finally {
            setIsBusy(false);
            cameraScanProcessingRef.current = false;
          }
        })();
      };

      let controls;
      if (deviceIdForScan) {
        controls = await reader.decodeFromVideoDevice(
          deviceIdForScan,
          qrVideoRef.current,
          onDecode,
        );
      } else {
        // No id yet: ZXing uses facingMode "environment" which often fails on laptops.
        try {
          controls = await reader.decodeFromVideoDevice(
            undefined,
            qrVideoRef.current,
            onDecode,
          );
        } catch (constraintErr) {
          if (
            constraintErr?.name === 'NotFoundError' ||
            constraintErr?.name === 'OverconstrainedError'
          ) {
            controls = await reader.decodeFromConstraints(
              { video: true },
              qrVideoRef.current,
              onDecode,
            );
          } else {
            throw constraintErr;
          }
        }
      }

      scanControlsRef.current = controls;
      setIsCameraActive(true);
    } catch (scanError) {
      if (scanError?.name === 'NotAllowedError') {
        setCameraError(
          'Camera permission denied. Allow camera access in browser settings and try again.',
        );
      } else if (scanError?.name === 'NotFoundError') {
        setCameraError(
          'No camera was found. If you are on a laptop, ensure a webcam is connected and not disabled in system settings.',
        );
      } else if (scanError?.name === 'NotReadableError') {
        setCameraError(
          'Camera is already in use by another app or tab. Close it and try again.',
        );
      } else {
        setCameraError(scanError.message || 'Unable to start camera scanner.');
      }
      stopCameraScan();
    }
  }, [
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

  // When the user switches cameras while the scanner is on, restart with the new device.
  // isCameraActive is read but omitted from deps so clicking "Start camera" does not run this twice.
  useEffect(() => {
    if (!isCameraActive) return;
    startCameraScan();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- avoid re-running when isCameraActive flips true after the same startCameraScan invocation
  }, [selectedCameraId, startCameraScan]);

  const handleQrImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsBusy(true);
    setError('');

    let objectUrl;
    try {
      let rawValue = '';

      if (typeof window.BarcodeDetector !== 'undefined') {
        const detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        const imageBitmap = await createImageBitmap(file);
        const detected = await detector.detect(imageBitmap);
        imageBitmap.close();

        if (!detected || detected.length === 0) {
          throw new Error('No QR code found in uploaded image.');
        }
        rawValue = detected[0]?.rawValue || '';
      } else {
        // Firefox and many browsers: no BarcodeDetector — use ZXing on the file.
        objectUrl = URL.createObjectURL(file);
        const imageReader = new BrowserMultiFormatReader();
        let result;
        try {
          result = await imageReader.decodeFromImageUrl(objectUrl);
        } catch {
          throw new Error('No QR code found in uploaded image.');
        }
        if (!result || typeof result.getText !== 'function') {
          throw new Error('No QR code found in uploaded image.');
        }
        rawValue = result.getText();
      }

      if (!String(rawValue).trim()) {
        throw new Error('No QR code found in uploaded image.');
      }

      const studentId = extractStudentIdFromQrValue(rawValue);
      if (!studentId) {
        throw new Error('QR code does not contain a valid student ID.');
      }

      await markAttendanceFromQrValue(
        rawValue,
        `Attendance marked from uploaded QR for ${studentId}.`,
      );
    } catch (scanError) {
      setError(scanError.message || 'Failed to scan uploaded QR image');
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setIsBusy(false);
      if (qrFileInputRef.current) {
        qrFileInputRef.current.value = '';
      }
    }
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
      await Promise.all([
        loadSessions(),
        loadAttendance(),
        loadGuardianNotifications(),
      ]);
    } catch (completeError) {
      setError(
        describeApiFetchFailure(completeError, 'Failed to complete session'),
      );
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
            subtitle={`${formatMealDistributionSchoolSubtitle(schoolName)} · Select a session, then use manual ID or camera / image QR`}
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
                <button
                  type="button"
                  onClick={handleCompleteSession}
                  disabled={
                    !selectedSessionId ||
                    isBusy ||
                    selectedSession?.status === 'COMPLETED'
                  }
                  className={cn(
                    mealPrimaryActionClass,
                    'h-11 w-auto min-w-[170px] px-4',
                  )}
                >
                  {selectedSession?.status === 'COMPLETED'
                    ? 'Session Completed'
                    : 'Complete Session'}
                </button>
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
                  <div className="mt-4 flex justify-center">
                    <button
                      type="submit"
                      disabled={
                        !selectedSessionId || !studentIdInput.trim() || isBusy
                      }
                      className={cn(
                        mealPrimaryActionClass,
                        'h-11 w-auto min-w-[220px] px-5',
                      )}
                    >
                      Mark by Student ID
                    </button>
                  </div>
                </form>
              )}

              {attendanceMode === 'qr' && (
                <div className="rounded-xl bg-white p-5 shadow-sm">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
                    <QrCode className="h-4 w-4" />
                    QR Entry
                  </h3>
                  <p className="mb-4 text-xs leading-relaxed text-zinc-600">
                    Scan a code with the camera or by uploading an image.
                    Attendance saves as soon as a code is read; the camera stops
                    after each successful scan.
                  </p>
                  {attendanceMode === 'qr' && error && (
                    <div
                      className="mb-3 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-snug font-semibold text-red-900 shadow-lg ring-1 ring-red-100"
                      role="alert"
                    >
                      <AlertCircle
                        className="mt-0.5 h-5 w-5 shrink-0 text-red-600"
                        aria-hidden
                      />
                      <span>{error}</span>
                    </div>
                  )}
                  {attendanceMode === 'qr' && successMessage && (
                    <div
                      className="mb-3 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 shadow-lg ring-2 ring-green-100/80"
                      role="status"
                    >
                      <CheckCircle2
                        className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                        aria-hidden
                      />
                      <span className="leading-snug font-semibold">
                        {successMessage}
                      </span>
                    </div>
                  )}
                  <div className="mb-2">
                    <h4
                      id="qr-camera-heading"
                      className="mb-1 flex items-center gap-2 font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[15px] font-bold tracking-[-0.3px] text-zinc-800"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#116e20]">
                        <Video className="h-4 w-4" aria-hidden />
                      </span>
                      Scan with camera
                    </h4>
                    <p className="mb-3 pl-10 text-xs leading-relaxed text-zinc-500">
                      Press{' '}
                      <span className="font-semibold text-zinc-600">
                        Start Camera
                      </span>
                      , then center the QR in the square (steady, good light).
                    </p>
                    <div className="mb-3 flex justify-center">
                      <div className="relative aspect-square w-full max-w-[min(100%,360px)] overflow-hidden rounded-2xl border-2 border-zinc-300 bg-zinc-900 shadow-md ring-1 ring-zinc-200/80">
                        <video
                          ref={qrVideoRef}
                          className="h-full w-full object-cover object-center"
                          autoPlay
                          muted
                          playsInline
                          aria-labelledby="qr-camera-heading"
                        />
                        {isCameraActive && (
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pt-10 pb-3">
                            <p className="text-center text-[11px] font-semibold text-white drop-shadow-sm">
                              Scanning… center the QR in this square
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mb-3 flex flex-wrap items-center gap-2 pl-10">
                      <button
                        type="button"
                        onClick={
                          isCameraActive ? stopCameraScan : startCameraScan
                        }
                        disabled={!selectedSessionId || isBusy}
                        className={cn(
                          'inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700',
                          'hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-60',
                          'focus-visible:ring-2 focus-visible:ring-zinc-300 focus-visible:ring-offset-1 focus-visible:outline-none',
                        )}
                      >
                        {isCameraActive ? 'Stop Camera' : 'Start Camera'}
                      </button>
                      <select
                        value={selectedCameraId}
                        onChange={(event) =>
                          setSelectedCameraId(event.target.value)
                        }
                        aria-label="Camera device"
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
                      <p className="mb-2 pl-10 text-xs font-medium text-amber-700">
                        Select today&apos;s meal session first to enable camera
                        scanning.
                      </p>
                    )}
                    {cameraError && (
                      <p className="mb-0 pl-10 text-xs font-medium text-red-600">
                        {cameraError}
                      </p>
                    )}
                  </div>
                  <div className="mt-6 border-t border-zinc-200 pt-5">
                    <h4
                      id="qr-upload-heading"
                      className="mb-1 flex items-center gap-2 font-['Plus_Jakarta_Sans','Inter_Variable',sans-serif] text-[15px] font-bold tracking-[-0.3px] text-zinc-800"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f5e9] text-[#116e20]">
                        <Upload className="h-4 w-4" aria-hidden />
                      </span>
                      Upload QR image
                    </h4>
                    <p className="mb-3 pl-10 text-xs leading-relaxed text-zinc-500">
                      PNG, JPG, or HEIC — use a sharp, well-lit photo of the
                      code.
                    </p>
                    <input
                      ref={qrFileInputRef}
                      type="file"
                      accept="image/*"
                      aria-labelledby="qr-upload-heading"
                      onChange={handleQrImageUpload}
                      disabled={!selectedSessionId || isBusy}
                      className="block w-full text-xs text-zinc-600 file:mr-3 file:rounded-lg file:border file:border-zinc-200 file:bg-white file:px-4 file:py-2.5 file:text-xs file:font-semibold file:text-zinc-800 hover:file:border-zinc-300 hover:file:bg-zinc-50 disabled:opacity-60"
                    />
                  </div>
                </div>
              )}
            </div>

            {attendanceMode === 'manual' && error && (
              <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
            )}
            {attendanceMode === 'manual' && successMessage && (
              <div
                className="mt-4 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 shadow-sm"
                role="status"
              >
                <CheckCircle2
                  className="mt-0.5 h-5 w-5 shrink-0 text-green-600"
                  aria-hidden
                />
                <span className="leading-snug font-semibold">
                  {successMessage}
                </span>
              </div>
            )}

            {selectedSession?.status === 'COMPLETED' &&
              guardianNotifyRows.length > 0 && (
                <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm">
                  <h3 className="border-b border-zinc-100 px-5 py-3 text-sm font-semibold text-zinc-800">
                    Guardian email log (no-show notices)
                  </h3>
                  <table className="w-full">
                    <thead className="bg-[#e7e8e8] text-left text-xs font-medium text-zinc-500">
                      <tr>
                        <th className="px-5 py-3">Student ID</th>
                        <th className="px-5 py-3">Guardian email</th>
                        <th className="px-5 py-3">Email status</th>
                        <th className="px-5 py-3">Note</th>
                        <th className="px-5 py-3">Sent at</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {guardianNotifyRows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-5 py-3 text-sm text-zinc-800">
                            {row.studentId}
                          </td>
                          <td className="px-5 py-3 text-sm text-zinc-800">
                            {row.guardianEmail || '—'}
                          </td>
                          <td className="px-5 py-3 text-sm text-zinc-800">
                            {row.status}
                            {row.skipReason ? ` (${row.skipReason})` : ''}
                          </td>
                          <td className="px-5 py-3 text-sm text-zinc-600">
                            {row.errorMessage || '—'}
                          </td>
                          <td className="px-5 py-3 text-sm text-zinc-800">
                            {row.sentAt
                              ? new Date(row.sentAt).toLocaleString()
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
