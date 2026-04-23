import { db } from '../lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    updateDoc,
    getDocs,
    where,
    limit
} from 'firebase/firestore';

// Crear notificación
export async function createNotification(userId, type, data) {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    
    await addDoc(notificationsRef, {
        type, // 'follow', 'comment', 'like', 'reply'
        ...data,
        read: false,
        createdAt: serverTimestamp()
    });
}

// Suscribirse a notificaciones
export function subscribeToNotifications(userId, callback) {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, orderBy('createdAt', 'desc'), limit(30));
    
    return onSnapshot(q, (snapshot) => {
        const notifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(notifications);
    });
}

// Marcar como leída
export async function markNotificationAsRead(userId, notificationId) {
    const notificationRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
}

// Marcar todas como leídas
export async function markAllNotificationsAsRead(userId) {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));
    const snapshot = await getDocs(q);
    
    const promises = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
    );
    
    await Promise.all(promises);
}

// Obtener conteo de no leídas
export async function getUnreadCount(userId) {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('read', '==', false));
    const snapshot = await getDocs(q);
    return snapshot.size;
}