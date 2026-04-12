import { useAuth } from '@clerk/clerk-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { AlertCircle, CheckCircle2, QrCode, Upload, Video } from 'lucide-react';
import { cn } from '../../../lib/utils';
import {
  completeMealSession,
  fetchGuardianNotificationsForSession,
  fetchMealSessions,
  fetchSessionRoster,
  markAttendanceByQr,
  markAttendanceByStudentId,
} from '../api';
import { describeApiFetchFailure } from '../../../lib/describe-api-fetch-failure';
import { resolveApiBaseUrl } from '../../../lib/resolve-api-base';
import MealDistributionLayout from '../layouts/MealDistributionLayout';
import {
  formatMealDistributionSchoolSubtitle,
  useMealDistributionSchool,
} from '../hooks';
import {
  mealPrimaryButtonClass,
  mealPrimaryButtonCompactClass,
  mealPrimarySegmentActiveClass,
} from '../utils/meal-primary-button-classes';

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
  const [searchParams] = useSearchParams();
  const { schoolName, schoolId } = useMealDistributionSchool();
  const { isSignedIn, getToken } = useAuth();
  const apiUrl = resolveApiBaseUrl();
  const preferredSessionId = searchParams.get('sessionId') || '';

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [sessionRosterRows, setSessionRosterRows] = useState([]);
  const [rosterFilter, setRosterFilter] = useState('ALL');
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
  const isSelectedSessionCompleted =
    String(selectedSession?.status || '').toUpperCase() === 'COMPLETED';
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
    if (
      preferredSessionId &&
      data.some((session) => session.id === preferredSessionId)
    ) {
      setSelectedSessionId(preferredSessionId);
      return;
    }
    if (!selectedSessionId && todayOnly.length > 0) {
      setSelectedSessionId(todayOnly[0].id);
    }
  }, [
    apiUrl,
    schoolId,
    getToken,
    isSignedIn,
    preferredSessionId,
    selectedSessionId,
    todayDateKey,
  ]);

  const loadSessionRoster = useCallback(async () => {
    if (!apiUrl || !selectedSessionId) {
      setSessionRosterRows([]);
      return;
    }
    const data = await fetchSessionRoster({
      apiUrl,
      mealSessionId: selectedSessionId,
      getToken: isSignedIn ? getToken : undefined,
    });
    setSessionRosterRows(data);
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
    loadSessionRoster().catch((loadError) =>
      setError(
        describeApiFetchFailure(loadError, 'Failed to load session roster'),
      ),
    );
  }, [loadSessionRoster]);

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
        status: 'PRESENT',
      });
      setStudentIdInput('');
      setSuccessMessage('Attendance marked successfully.');
      await Promise.all([loadSessions(), loadSessionRoster()]);
    } catch (markError) {
      setError(describeApiFetchFailure(markError, 'Failed to mark attendance'));
    } finally {
      setIsBusy(false);
    }
  };

  const handleManualExcused = async () => {
    if (!selectedSessionId || !studentIdInput.trim()) return;
    setIsBusy(true);
    setError('');
    try {
      await markAttendanceByStudentId({
        apiUrl,
        getToken: isSignedIn ? getToken : undefined,
        studentId: studentIdInput.trim(),
        mealSessionId: selectedSessionId,
        status: 'EXCUSED',
      });
      setStudentIdInput('');
      setSuccessMessage('Student marked as excused.');
      await Promise.all([loadSessions(), loadSessionRoster()]);
    } catch (markError) {
      setError(describeApiFetchFailure(markError, 'Failed to mark excused'));
    } finally {
      setIsBusy(false);
    }
  };

  const markStudentFromRoster = useCallback(
    async (studentId, status) => {
      if (!selectedSessionId || !studentId) return;
      setIsBusy(true);
      setError('');
      try {
        await markAttendanceByStudentId({
          apiUrl,
          getToken: isSignedIn ? getToken : undefined,
          studentId: String(studentId).trim(),
          mealSessionId: selectedSessionId,
          status,
        });
        setSuccessMessage(
          status === 'EXCUSED'
            ? 'Student marked as excused.'
            : 'Attendance marked successfully.',
        );
        await Promise.all([loadSessions(), loadSessionRoster()]);
      } catch (markError) {
        setError(
          describeApiFetchFailure(
            markError,
            status === 'EXCUSED'
              ? 'Failed to mark excused'
              : 'Failed to mark attendance',
          ),
        );
      } finally {
        setIsBusy(false);
      }
    },
    [
      apiUrl,
      getToken,
      isSignedIn,
      loadSessionRoster,
      loadSessions,
      selectedSessionId,
    ],
  );

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
      await Promise.all([loadSessions(), loadSessionRoster()]);
      return studentId;
    },
    [
      apiUrl,
      getToken,
      isSignedIn,
      loadSessionRoster,
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
        loadSessionRoster(),
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

  const filteredRosterRows = useMemo(() => {
    if (rosterFilter === 'ALL') return sessionRosterRows;
    return sessionRosterRows.filter(
      (row) => String(row.status || '').toUpperCase() === rosterFilter,
    );
  }, [sessionRosterRows, rosterFilter]);

  const rosterCounts = useMemo(() => {
    const base = {
      ALL: sessionRosterRows.length,
      NOT_MARKED: 0,
      PRESENT: 0,
      EXCUSED: 0,
      NO_SHOW: 0,
    };
    sessionRosterRows.forEach((row) => {
      const status = String(row.status || '').toUpperCase();
      if (base[status] !== undefined) {
        base[status] += 1;
      }
    });
    return base;
  }, [sessionRosterRows]);

  return (
    <MealDistributionLayout
      activeItemKey="attendance"
      title="Mark Attendance"
      subtitle={`${formatMealDistributionSchoolSubtitle(schoolName)} · Select a session, then use manual ID or camera / image QR`}
      searchPlaceholder=""
    >
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
                  {formatMealType(session.mealType)}
                  {session.recipeName ? ` · ${session.recipeName}` : ''} (
                  {session.status})
                </option>
              ))}
            </select>
            {todaysSessions.length === 0 && (
              <p className="mt-2 text-xs font-medium text-amber-700">
                No meal sessions found for today.
              </p>
            )}
            {selectedSession?.recipeName && (
              <div className="mt-2 rounded-lg border border-green-100 bg-green-50 px-3 py-2">
                <p className="text-xs font-semibold text-green-800">
                  {selectedSession.recipeName}
                </p>
                {selectedSession.recipeDescription && (
                  <p className="mt-0.5 text-[11px] text-green-700">
                    {selectedSession.recipeDescription}
                  </p>
                )}
                {selectedSession.mealNotes && (
                  <p className="mt-0.5 text-[11px] text-green-600 italic">
                    {selectedSession.mealNotes}
                  </p>
                )}
              </div>
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
              className={cn(mealPrimaryButtonClass, 'min-w-[170px]')}
            >
              {selectedSession?.status === 'COMPLETED'
                ? 'Session Completed'
                : 'Complete Session'}
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div
            className="mb-4 inline-flex min-w-[220px] items-stretch rounded-xl bg-zinc-100 p-1 shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] ring-1 ring-zinc-200/90"
            role="tablist"
            aria-label="Attendance entry mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={attendanceMode === 'manual'}
              onClick={() => setAttendanceMode('manual')}
              className={cn(
                'box-border inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border-0 px-3 py-0',
                'text-center text-xs leading-none font-semibold tracking-normal no-underline antialiased',
                'transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-[#116e20]/50 focus-visible:ring-offset-2 focus-visible:outline-none',
                attendanceMode === 'manual'
                  ? mealPrimarySegmentActiveClass
                  : 'bg-transparent text-zinc-600 hover:bg-white/90 hover:text-zinc-800',
              )}
            >
              Manual
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={attendanceMode === 'qr'}
              onClick={() => setAttendanceMode('qr')}
              className={cn(
                'box-border inline-flex min-h-9 flex-1 items-center justify-center rounded-lg border-0 px-3 py-0',
                'text-center text-xs leading-none font-semibold tracking-normal no-underline antialiased',
                'transition-all duration-200',
                'focus-visible:ring-2 focus-visible:ring-[#116e20]/50 focus-visible:ring-offset-2 focus-visible:outline-none',
                attendanceMode === 'qr'
                  ? mealPrimarySegmentActiveClass
                  : 'bg-transparent text-zinc-600 hover:bg-white/90 hover:text-zinc-800',
              )}
            >
              QR Code
            </button>
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
              <div className="mt-4 flex justify-center gap-3">
                <button
                  type="submit"
                  disabled={
                    !selectedSessionId ||
                    !studentIdInput.trim() ||
                    isBusy ||
                    isSelectedSessionCompleted
                  }
                  className={cn(mealPrimaryButtonClass, 'min-w-[220px]')}
                >
                  Mark by Student ID
                </button>
                <button
                  type="button"
                  onClick={handleManualExcused}
                  disabled={
                    !selectedSessionId ||
                    !studentIdInput.trim() ||
                    isBusy ||
                    isSelectedSessionCompleted
                  }
                  className={cn(mealPrimaryButtonClass, 'min-w-[170px]')}
                >
                  Mark Excused
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
                Scan a code with the camera or by uploading an image. Attendance
                saves as soon as a code is read; the camera stops after each
                successful scan.
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
                    onClick={isCameraActive ? stopCameraScan : startCameraScan}
                    disabled={
                      !selectedSessionId || isBusy || isSelectedSessionCompleted
                    }
                    className={cn(
                      mealPrimaryButtonCompactClass,
                      'min-w-[140px]',
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
                    className="h-9 min-h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 shadow-sm outline-none focus-visible:border-green-600 focus-visible:ring-2 focus-visible:ring-[#116e20]/25"
                  >
                    <option value="">Default Camera</option>
                    {cameraDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label || `Camera ${device.deviceId.slice(-4)}`}
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
                  PNG, JPG, or HEIC — use a sharp, well-lit photo of the code.
                </p>
                <input
                  ref={qrFileInputRef}
                  type="file"
                  accept="image/*"
                  aria-labelledby="qr-upload-heading"
                  onChange={handleQrImageUpload}
                  disabled={
                    !selectedSessionId || isBusy || isSelectedSessionCompleted
                  }
                  className={cn(
                    'block w-full text-xs text-zinc-600 disabled:opacity-60',
                    'file:mr-3 file:cursor-pointer file:rounded-xl file:border-0 file:bg-gradient-to-br file:from-[#116e20] file:to-[#006117] file:px-6 file:py-2.5 file:text-xs file:font-semibold file:text-white file:shadow-[0px_8px_20px_-8px_rgba(0,97,23,0.45)] file:transition-all',
                    'hover:file:-translate-y-px hover:file:shadow-[0px_12px_24px_-8px_rgba(0,97,23,0.55)]',
                    'file:focus-visible:ring-2 file:focus-visible:ring-[#116e20]/50 file:focus-visible:ring-offset-2 file:focus-visible:outline-none',
                  )}
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
            <span className="leading-snug font-semibold">{successMessage}</span>
          </div>
        )}
        {isSelectedSessionCompleted && (
          <p className="mt-4 text-sm font-semibold text-amber-700">
            This session is completed. Attendance is locked and unresolved
            students are finalized as NO_SHOW.
          </p>
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

        <div className="mt-6 rounded-xl bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-800">
              All students - current session
            </h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {[
                ['ALL', 'All'],
                ['NOT_MARKED', 'Not Marked'],
                ['PRESENT', 'Present'],
                ['EXCUSED', 'Excused'],
                ['NO_SHOW', 'No-Show'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setRosterFilter(key)}
                  className={cn(
                    'rounded-full px-3 py-1 font-semibold transition-colors',
                    rosterFilter === key
                      ? 'bg-[#116e20] text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200',
                  )}
                >
                  {label} ({rosterCounts[key] || 0})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#e7e8e8] text-left text-xs font-medium text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Student ID</th>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Served At</th>
                  <th className="px-5 py-3 text-center">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredRosterRows.map((row) => (
                  <tr key={row.studentId}>
                    <td className="px-5 py-3 text-sm text-zinc-800">
                      {row.studentId}
                    </td>
                    <td className="px-5 py-3 text-sm text-zinc-800">
                      {row.fullName || '-'}
                    </td>
                    <td className="px-5 py-3 text-sm text-zinc-800">
                      {row.status}
                    </td>
                    <td className="px-5 py-3 text-sm text-zinc-800">
                      {row.servedAt
                        ? new Date(row.servedAt).toLocaleString()
                        : '-'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={
                            !selectedSessionId ||
                            isBusy ||
                            isSelectedSessionCompleted
                          }
                          onClick={() =>
                            markStudentFromRoster(row.studentId, 'PRESENT')
                          }
                          className={cn(
                            mealPrimaryButtonCompactClass,
                            'min-w-[96px]',
                          )}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          disabled={
                            !selectedSessionId ||
                            isBusy ||
                            isSelectedSessionCompleted
                          }
                          onClick={() =>
                            markStudentFromRoster(row.studentId, 'EXCUSED')
                          }
                          className={cn(
                            mealPrimaryButtonCompactClass,
                            'min-w-[96px]',
                          )}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRosterRows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-6 text-center text-sm text-zinc-500"
                    >
                      No students found for selected filter/session.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </MealDistributionLayout>
  );
}
