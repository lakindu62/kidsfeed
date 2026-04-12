/**
 * One row per studentId: document with greatest servedAt (ties keep last seen).
 */
export function pickLatestAttendanceByStudentId(docs) {
  const map = new Map();
  for (const doc of docs) {
    const sid = String(doc.studentId);
    const prev = map.get(sid);
    const prevT = prev?.servedAt ? new Date(prev.servedAt).getTime() : 0;
    const curT = doc?.servedAt ? new Date(doc.servedAt).getTime() : 0;
    if (!prev || curT >= prevT) {
      map.set(sid, doc);
    }
  }
  return map;
}
