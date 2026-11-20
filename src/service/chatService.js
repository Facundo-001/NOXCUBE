import { db } from '../lib/firebase';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    addDoc,
    serverTimestamp,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    getDocs,
    where,
    limit,
    writeBatch,
    deleteDoc,
    increment
} from 'firebase/firestore';

// Enviar mensaje
export async function sendMessage(fromUserId, toUserId, text) {
    const cleanText = text.trim().substring(0, 2000);
    if (!cleanText) return null;

    const chatId = [fromUserId, toUserId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const msgRef = await addDoc(messagesRef, {
        fromUserId,
        toUserId,
        text: cleanText,
        type: 'text',
        read: false,
        delivered: false,
        edited: false,
        createdAt: serverTimestamp()
    });

    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const currentUnread = chatSnap.data()?.[`unread_${toUserId}`] || 0;

    await setDoc(chatRef, {
        participants: [fromUserId, toUserId],
        lastMessage: cleanText.substring(0, 100),
        lastMessageAt: serverTimestamp(),
        [`unread_${toUserId}`]: currentUnread + 1
    }, { merge: true });

    return msgRef.id;
}

// Enviar archivo (imagen) - Límite 1MB como Discord
export async function sendFile(fromUserId, toUserId, file) {
    if (!file) throw new Error('No se seleccionó ningún archivo');

    const MAX_SIZE = 1 * 1024 * 1024; // 1MB
    if (file.size > MAX_SIZE) throw new Error('El archivo no puede superar 1MB');

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) throw new Error('Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');

    const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Error al leer el archivo'));
        reader.readAsDataURL(file);
    });

    const chatId = [fromUserId, toUserId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');

    const msgRef = await addDoc(messagesRef, {
        fromUserId,
        toUserId,
        type: 'image',
        fileUrl: base64,
        fileName: file.name,
        read: false,
        delivered: false,
        createdAt: serverTimestamp()
    });

    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    const currentUnread = chatSnap.data()?.[`unread_${toUserId}`] || 0;

    await setDoc(chatRef, {
        participants: [fromUserId, toUserId],
        lastMessage: 'Imagen',
        lastMessageAt: serverTimestamp(),
        [`unread_${toUserId}`]: currentUnread + 1
    }, { merge: true });

    return msgRef.id;
}

// Suscribirse a mensajes de un chat
export function subscribeToMessages(userId, otherUserId, callback) {
    const chatId = [userId, otherUserId].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(200));

    return onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Paso 1: Marcar como ENTREGADOS los mensajes que llegaron al dispositivo
        const undeliveredMessages = snapshot.docs.filter(
            d => d.data().toUserId === userId && !d.data().delivered
        );

        if (undeliveredMessages.length > 0) {
            const batch = writeBatch(db);
            undeliveredMessages.forEach(docSnap => {
                batch.update(docSnap.ref, { delivered: true });
            });
            batch.commit().catch(err => console.error('Error marcando entregados:', err));
        }

        // Paso 2: Marcar como LEÍDOS los mensajes que el usuario ya vio
        const unreadMessages = snapshot.docs.filter(
            d => d.data().toUserId === userId && !d.data().read
        );

        if (unreadMessages.length > 0) {
            const batch = writeBatch(db);
            unreadMessages.forEach(docSnap => {
                batch.update(docSnap.ref, { read: true });
            });
            batch.commit().catch(err => console.error('Error marcando leídos:', err));
        }

        callback(messages);
    });
}

// Obtener chats activos del usuario
export function subscribeToChats(userId, callback) {
    const chatsRef = collection(db, 'chats');
    const q = query(
        chatsRef,
        where('participants', 'array-contains', userId),
        orderBy('lastMessageAt', 'desc'),
        limit(50)
    );

    return onSnapshot(q, async (snapshot) => {
        const chats = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const otherUserId = data.participants.find(p => p !== userId);

            if (otherUserId) {
                const { getUserProfile } = await import('./userService');
                const otherUser = await getUserProfile(otherUserId);

                chats.push({
                    chatId: docSnap.id,
                    otherUser: otherUser ? {
                        uid: otherUser.uid,
                        displayName: otherUser.displayName,
                        shortId: otherUser.shortId,
                        avatarColor: otherUser.avatarColor
                    } : null,
                    lastMessage: data.lastMessage || '',
                    lastMessageAt: data.lastMessageAt,
                    unread: data[`unread_${userId}`] || 0
                });
            }
        }
        callback(chats);
    });
}

// Marcar chat como leído
export async function markChatAsRead(chatId, userId) {
    const chatRef = doc(db, 'chats', chatId);
    await updateDoc(chatRef, { [`unread_${userId}`]: 0 });

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, where('toUserId', '==', userId), where('read', '==', false));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        const batch = writeBatch(db);
        snapshot.docs.forEach(docSnap => batch.update(docSnap.ref, { read: true }));
        await batch.commit();
    }
}

// Editar mensaje
export async function editMessage(chatId, messageId, newText) {
    const cleanText = newText.trim().substring(0, 2000);
    if (!cleanText) return;
    await updateDoc(doc(db, 'chats', chatId, 'messages', messageId), {
        text: cleanText,
        edited: true,
        editedAt: serverTimestamp()
    });
}

// Eliminar mensaje
export async function deleteMessage(chatId, messageId) {
    await deleteDoc(doc(db, 'chats', chatId, 'messages', messageId));

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
        const lastMsg = snap.docs[0].data();
        await updateDoc(doc(db, 'chats', chatId), {
            lastMessage: lastMsg.type === 'image' ? '📷 Imagen' : (lastMsg.text?.substring(0, 100) || ''),
            lastMessageAt: lastMsg.createdAt
        });
    }
}

// Eliminar chat completo
export async function deleteChat(chatId) {
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const snap = await getDocs(messagesRef);
    const batch = writeBatch(db);
    snap.docs.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'chats', chatId));
    await batch.commit();
}