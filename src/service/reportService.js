import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

// Crear reporte
export async function createReport(reporterId, targetId, targetType, reason, description) {
    const reportsRef = collection(db, 'reports');
    await addDoc(reportsRef, {
        reporterId,
        targetId,
        targetType, // 'post', 'comment', 'user', 'message'
        reason,
        description: description.substring(0, 500),
        status: 'pending', // 'pending', 'reviewed', 'resolved', 'dismissed'
        createdAt: serverTimestamp()
    });
    return true;
}

// Suscribirse a reportes (para panel admin)
export function subscribeToReports(callback) {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, async (snapshot) => {
        const reports = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const { getUserProfile } = await import('./userService');
            const reporter = await getUserProfile(data.reporterId);
            reports.push({
                id: docSnap.id,
                ...data,
                reporterName: reporter?.displayName || 'Anónimo'
            });
        }
        callback(reports);
    });
}

// Actualizar estado de reporte
export async function updateReportStatus(reportId, status) {
    await updateDoc(doc(db, 'reports', reportId), { status });
}

// Verificar si ya reportó
export async function hasAlreadyReported(reporterId, targetId) {
    const reportsRef = collection(db, 'reports');
    const q = query(reportsRef, where('reporterId', '==', reporterId), where('targetId', '==', targetId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}