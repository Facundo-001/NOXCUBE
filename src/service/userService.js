import { db } from '../lib/firebase';
import {
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    collection,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    addDoc,
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    writeBatch,
    onSnapshot,
    Timestamp
} from 'firebase/firestore';

// ==================== UTILIDADES GENERALES ====================
function generateShortId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

async function isShortIdUnique(shortId) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('shortId', '==', shortId));
    const snapshot = await getDocs(q);
    return snapshot.empty;
}

async function generateUniqueShortId() {
    let shortId;
    let unique = false;
    let attempts = 0;
    const maxAttempts = 10;

    while (!unique && attempts < maxAttempts) {
        shortId = generateShortId();
        unique = await isShortIdUnique(shortId);
        attempts++;
    }

    if (!unique) {
        shortId = generateShortId() + Date.now().toString().slice(-2);
    }

    return shortId;
}

// ==================== USUARIOS ====================
export async function createUserProfile(userId, email, displayName, birthDate) {
    try {
        const shortId = await generateUniqueShortId();
        const userRef = doc(db, 'users', userId);

        await setDoc(userRef, {
            email,
            displayName,
            birthDate,
            shortId,
            bio: '',
            avatarColor: '#C3A44B',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            friends: [],
            following: [],
            followers: [],
            acceptedTermsAt: null,
            acceptedPrivacyAt: null
        });

        return shortId;
    } catch (error) {
        console.error('Error al crear perfil:', error);
        throw error;
    }
}

export async function acceptTerms(userId, type) {
    const field = type === 'terms' ? 'acceptedTermsAt' : 'acceptedPrivacyAt';
    await updateDoc(doc(db, 'users', userId), {
        [field]: serverTimestamp()
    });
}

// ⚠️ Versión pública: NO devuelve el email (solo campos públicos)
export async function getUserProfile(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            return {
                uid: userId,
                displayName: data.displayName,
                shortId: data.shortId,
                bio: data.bio,
                avatarColor: data.avatarColor,
                createdAt: data.createdAt,
                followersCount: data.followersCount || 0,
                followingCount: data.followingCount || 0
                // ❌ email, birthDate, friends, following, followers, etc. NO se exponen
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        return null;
    }
}

// ✅ Para el dueño de la cuenta (panel privado): SÍ incluye email
export async function getMyProfile(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);

        if (docSnap.exists()) {
            return {
                uid: userId,
                ...docSnap.data()
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error al obtener mi perfil:', error);
        return null;
    }
}

export async function isDisplayNameTaken(displayName) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('displayName', '==', displayName));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error al verificar nombre:', error);
        return false;
    }
}

export async function updateUserProfile(userId, profileData) {
    const userRef = doc(db, 'users', userId);

    try {
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
            throw new Error('El perfil de usuario no existe');
        }

        await updateDoc(userRef, {
            ...profileData,
            updatedAt: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        throw error;
    }
}

export async function getAllUsers() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        return snapshot.docs.map(doc => ({
            uid: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return [];
    }
}

// ⚠️ Búsqueda: ya NO busca por email (evita exponerlo)
export async function searchUsers(searchTerm) {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);

        const searchLower = searchTerm.toLowerCase();
        return snapshot.docs
            .map(doc => ({
                uid: doc.id,
                ...doc.data()
            }))
            .filter(user =>
                user.displayName?.toLowerCase().includes(searchLower) ||
                user.shortId?.toLowerCase().includes(searchLower)
            )
            .map(user => ({
                uid: user.uid,
                displayName: user.displayName,
                shortId: user.shortId,
                bio: user.bio,
                avatarColor: user.avatarColor
                // ❌ sin email
            }));
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        return [];
    }
}

// ⚠️ Búsqueda por shortId: tampoco devuelve email
export async function getUserByShortId(shortId) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('shortId', '==', shortId.toUpperCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const docSnap = snapshot.docs[0];
            const data = docSnap.data();
            return {
                uid: docSnap.id,
                displayName: data.displayName,
                shortId: data.shortId,
                bio: data.bio,
                avatarColor: data.avatarColor
                // ❌ sin email
            };
        }
        return null;
    } catch (error) {
        console.error('Error al buscar usuario por ID:', error);
        return null;
    }
}

// ==================== SEGUIR/DEJAR DE SEGUIR ====================
export async function followUser(currentUserId, targetUserId) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);

    const currentFollowing = currentUserSnap.data()?.following || [];
    const targetFollowers = targetUserSnap.data()?.followers || [];

    if (currentFollowing.includes(targetUserId)) {
        return false;
    }

    const batch = writeBatch(db);

    batch.update(currentUserRef, {
        following: arrayUnion(targetUserId),
        followingCount: (currentUserSnap.data()?.followingCount || 0) + 1
    });

    batch.update(targetUserRef, {
        followers: arrayUnion(currentUserId),
        followersCount: (targetUserSnap.data()?.followersCount || 0) + 1
    });

    await batch.commit();
    return true;
}

export async function unfollowUser(currentUserId, targetUserId) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);

    const currentFollowing = currentUserSnap.data()?.following || [];
    const targetFollowers = targetUserSnap.data()?.followers || [];

    if (!currentFollowing.includes(targetUserId)) {
        return false;
    }

    const newFollowingCount = Math.max(0, (currentUserSnap.data()?.followingCount || 1) - 1);
    const newFollowersCount = Math.max(0, (targetUserSnap.data()?.followersCount || 1) - 1);

    const batch = writeBatch(db);

    batch.update(currentUserRef, {
        following: arrayRemove(targetUserId),
        followingCount: newFollowingCount
    });

    batch.update(targetUserRef, {
        followers: arrayRemove(currentUserId),
        followersCount: newFollowersCount
    });

    await batch.commit();
    return true;
}

export async function isFollowing(currentUserId, targetUserId) {
    try {
        const userRef = doc(db, 'users', currentUserId);
        const userSnap = await getDoc(userRef);
        const following = userSnap.data()?.following || [];
        return following.includes(targetUserId);
    } catch (error) {
        console.error('Error al verificar follow:', error);
        return false;
    }
}

// ==================== POSTS ====================
const postsCollection = collection(db, 'posts');

export function subscribeToPosts(callback) {
    const q = query(postsCollection, orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(posts);
    });
}

export async function createPost(postData) {
    try {
        await addDoc(postsCollection, {
            ...postData,
            likes: 0,
            likedBy: [],
            commentCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error al crear post:', error);
        throw error;
    }
}

export async function togglePostLike(postId, userId) {
    try {
        const postRef = doc(db, 'posts', String(postId));
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;

        const likedBy = postSnap.data().likedBy || [];
        const isLiked = likedBy.includes(userId);

        const batch = writeBatch(db);
        if (isLiked) {
            batch.update(postRef, {
                likedBy: arrayRemove(userId),
                likes: increment(-1)
            });
        } else {
            batch.update(postRef, {
                likedBy: arrayUnion(userId),
                likes: increment(1)
            });
        }
        await batch.commit();
    } catch (error) {
        console.error('Error al toggle like:', error);
        throw error;
    }
}

export async function getUserPosts(userId) {
    try {
        const q = query(
            postsCollection,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener posts del usuario:', error);
        return [];
    }
}

export async function deletePost(postId) {
    try {
        const commentsRef = collection(db, 'posts', String(postId), 'comments');
        const commentsSnap = await getDocs(commentsRef);
        const batch = writeBatch(db);

        for (const commentDoc of commentsSnap.docs) {
            const repliesRef = collection(db, 'posts', String(postId), 'comments', commentDoc.id, 'replies');
            const repliesSnap = await getDocs(repliesRef);
            repliesSnap.docs.forEach(replyDoc => {
                batch.delete(replyDoc.ref);
            });
            batch.delete(commentDoc.ref);
        }

        const postRef = doc(db, 'posts', String(postId));
        batch.delete(postRef);
        await batch.commit();
    } catch (error) {
        console.error('Error al eliminar post:', error);
        throw error;
    }
}

export async function editPost(postId, newData) {
    try {
        const postRef = doc(db, 'posts', String(postId));
        await updateDoc(postRef, {
            ...newData,
            editedAt: serverTimestamp()
        });
    } catch (error) {
        console.error('Error al editar post:', error);
        throw error;
    }
}

export async function getFollowingPosts(userId) {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        const following = userSnap.data()?.following || [];

        if (following.length === 0) return [];

        let allPosts = [];

        for (const followedId of following) {
            const q = query(
                postsCollection,
                where('userId', '==', followedId),
                orderBy('createdAt', 'desc'),
                limit(10)
            );

            const snapshot = await getDocs(q);
            snapshot.docs.forEach(doc => {
                allPosts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
        }

        return allPosts.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });

    } catch (error) {
        console.error('Error al obtener posts de seguidos:', error);
        return [];
    }
}

export async function getTrendingPosts() {
    try {
        const oneDayAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));

        const q = query(
            postsCollection,
            where('createdAt', '>=', oneDayAgo),
            orderBy('createdAt', 'desc'),
            orderBy('likes', 'desc'),
            limit(20)
        );

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener trending:', error);
        return [];
    }
}

// ==================== COMENTARIOS ====================
export async function addComment(postId, userId, userName, commentText) {
    try {
        const commentsRef = collection(db, 'posts', String(postId), 'comments');
        const commentRef = await addDoc(commentsRef, {
            userId,
            userName,
            text: commentText,
            createdAt: serverTimestamp(),
            likes: 0,
            replies: []
        });

        const postRef = doc(db, 'posts', String(postId));
        await updateDoc(postRef, {
            commentCount: increment(1)
        });

        return commentRef.id;
    } catch (error) {
        console.error('Error al agregar comentario:', error);
        throw error;
    }
}

export async function getComments(postId) {
    try {
        const commentsRef = collection(db, 'posts', String(postId), 'comments');
        const q = query(commentsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        return [];
    }
}

export async function deleteComment(postId, commentId) {
    try {
        const commentRef = doc(db, 'posts', String(postId), 'comments', commentId);
        await deleteDoc(commentRef);

        const postRef = doc(db, 'posts', String(postId));
        await updateDoc(postRef, {
            commentCount: increment(-1)
        });
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        throw error;
    }
}

// ==================== SISTEMA DE AMIGOS ====================

// Enviar solicitud de amistad (VERSIÓN FINAL UNIFICADA)
export async function sendFriendRequest(fromUserId, toUserId) {
    // 1. Verificar que no sean amigos ya
    const alreadyFriends = await areFriends(fromUserId, toUserId);
    if (alreadyFriends) return 'already_friends';

    // 2. Verificar que no exista ya una solicitud pendiente
    const requestsRef = collection(db, 'users', toUserId, 'friendRequests');
    const q = query(requestsRef, where('fromUserId', '==', fromUserId), where('status', '==', 'pending'));
    const existing = await getDocs(q);
    if (!existing.empty) return false;

    // 3. Crear ambas referencias en batch
    const batch = writeBatch(db);

    // Solicitud en el destinatario
    const newRequestRef = doc(requestsRef);
    batch.set(newRequestRef, {
        fromUserId,
        status: 'pending',
        createdAt: serverTimestamp()
    });

    // Copia en sentRequests del remitente
    const sentRef = doc(collection(db, 'users', fromUserId, 'sentRequests'));
    batch.set(sentRef, {
        toUserId,
        status: 'pending',
        createdAt: serverTimestamp()
    });

    await batch.commit();
    return true;
}

// Suscribirse a solicitudes recibidas
export function subscribeToFriendRequests(userId, callback) {
    const requestsRef = collection(db, 'users', userId, 'friendRequests');
    const q = query(requestsRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));

    return onSnapshot(q, async (snapshot) => {
        const requests = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const fromUser = await getUserProfile(data.fromUserId);
            requests.push({
                id: docSnap.id,
                fromUserId: data.fromUserId,
                fromUserName: fromUser?.displayName || 'Usuario',
                fromUserShortId: fromUser?.shortId || '????',
                createdAt: data.createdAt,
                status: data.status
            });
        }
        callback(requests);
    });
}

// Aceptar solicitud de amistad (CON CREACIÓN AUTOMÁTICA DE CHAT)
export async function acceptFriendRequest(userId, requestId, fromUserId) {
    const batch = writeBatch(db);

    // Eliminar la solicitud
    const requestRef = doc(db, 'users', userId, 'friendRequests', requestId);
    batch.delete(requestRef);

    // Eliminar de sentRequests del remitente
    try {
        const sentRef = collection(db, 'users', fromUserId, 'sentRequests');
        const q = query(sentRef, where('toUserId', '==', userId), where('status', '==', 'pending'));
        const sentSnap = await getDocs(q);
        sentSnap.docs.forEach(d => batch.delete(d.ref));
    } catch (err) { }

    // Agregar a amigos de AMBOS
    const userRef = doc(db, 'users', userId);
    const fromUserRef = doc(db, 'users', fromUserId);

    batch.update(userRef, { friends: arrayUnion(fromUserId) });
    batch.update(fromUserRef, { friends: arrayUnion(userId) });

    // ✅ CREAR EL CHAT AUTOMÁTICAMENTE
    const chatId = [userId, fromUserId].sort().join('_');
    const chatRef = doc(db, 'chats', chatId);
    batch.set(chatRef, {
        participants: [userId, fromUserId],
        lastMessage: '🎉 ¡Ahora son amigos! Envía tu primer mensaje.',
        lastMessageAt: serverTimestamp(),
        [`unread_${userId}`]: 0,
        [`unread_${fromUserId}`]: 0
    }, { merge: true });

    await batch.commit();
    return true;
}

// Rechazar solicitud de amistad
export async function rejectFriendRequest(userId, requestId) {
    const requestRef = doc(db, 'users', userId, 'friendRequests', requestId);
    await updateDoc(requestRef, { status: 'rejected' });
}

// Obtener lista de amigos
export function subscribeToFriends(userId, callback) {
    const userRef = doc(db, 'users', userId);

    return onSnapshot(userRef, async (snap) => {
        const data = snap.data();
        const friendIds = data?.friends || [];

        const friends = [];
        for (const fid of friendIds) {
            const profile = await getUserProfile(fid);
            if (profile) {
                friends.push({
                    uid: profile.uid,
                    displayName: profile.displayName,
                    shortId: profile.shortId,
                    avatarColor: profile.avatarColor
                });
            }
        }
        callback(friends);
    });
}

// Verificar si son amigos
export async function areFriends(userId1, userId2) {
    const userRef = doc(db, 'users', userId1);
    const snap = await getDoc(userRef);
    const friends = snap.data()?.friends || [];
    return friends.includes(userId2);
}

// ==================== SOLICITUDES ENVIADAS ====================

// Obtener solicitudes enviadas por el usuario
export async function getSentFriendRequests(userId) {
    try {
        const sentRef = collection(db, 'users', userId, 'sentRequests');
        const q = query(sentRef, where('status', '==', 'pending'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        const requests = [];
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const toUser = await getUserProfile(data.toUserId);
            requests.push({
                id: docSnap.id,
                toUserId: data.toUserId,
                toUserName: toUser?.displayName || 'Usuario',
                toUserShortId: toUser?.shortId || '????',
                createdAt: data.createdAt,
                status: data.status
            });
        }
        return requests;
    } catch (error) {
        console.error('Error al obtener solicitudes enviadas:', error);
        return [];
    }
}

// Cancelar solicitud enviada
export async function cancelSentFriendRequest(userId, requestId, toUserId) {
    const batch = writeBatch(db);

    // Eliminar de sentRequests
    const sentRef = doc(db, 'users', userId, 'sentRequests', requestId);
    batch.delete(sentRef);

    // Buscar y eliminar la solicitud en el otro usuario
    try {
        const requestsRef = collection(db, 'users', toUserId, 'friendRequests');
        const q = query(requestsRef, where('fromUserId', '==', userId), where('status', '==', 'pending'));
        const snapshot = await getDocs(q);
        snapshot.docs.forEach(docSnap => {
            batch.delete(docSnap.ref);
        });
    } catch (err) {
        // Puede fallar si la subcolección no existe
    }

    await batch.commit();
    return true;
}