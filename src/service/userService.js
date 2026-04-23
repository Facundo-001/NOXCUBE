import { db } from '../lib/firebase';
import { 
    // Operaciones básicas
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
    // Operaciones avanzadas
    serverTimestamp,
    increment,
    arrayUnion,
    arrayRemove,
    writeBatch,
    // Realtime
    onSnapshot,
    // Timestamp
    Timestamp
} from 'firebase/firestore';

// ==================== UTILIDADES GENERALES ====================

// Generar ID corto
function generateShortId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Verificar si el shortId es único
async function isShortIdUnique(shortId) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('shortId', '==', shortId));
    const snapshot = await getDocs(q);
    return snapshot.empty;
}

// Generar shortId único
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

// Crear perfil de usuario
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
            following: [],      // ← AÑADIDO (de posts.js)
            followers: []       // ← AÑADIDO (nuevo, para consistencia)
        });
        
        return shortId;
    } catch (error) {
        console.error('Error al crear perfil:', error);
        throw error;
    }
}

// Obtener perfil de usuario
export async function getUserProfile(userId) {
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
        console.error('Error al obtener perfil:', error);
        return null;
    }
}

// Verificar si el nombre de usuario está ocupado
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

// Actualizar perfil de usuario
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

// Obtener todos los usuarios (para búsqueda)
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

// Buscar usuarios por nombre
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
                user.email?.toLowerCase().includes(searchLower) ||
                user.shortId?.toLowerCase().includes(searchLower)
            );
    } catch (error) {
        console.error('Error al buscar usuarios:', error);
        return [];
    }
}

// Obtener perfil por shortId
export async function getUserByShortId(shortId) {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('shortId', '==', shortId.toUpperCase()));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            return {
                uid: doc.id,
                ...doc.data()
            };
        }
        return null;
    } catch (error) {
        console.error('Error al buscar usuario por ID:', error);
        return null;
    }
}

// ==================== SEGUIR/DEJAR DE SEGUIR (NUEVO - DE POSTS.JS) ====================

// Seguir a un usuario
export async function followUser(currentUserId, targetUserId) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    // Obtener datos actuales para saber los contadores reales
    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);
    
    const currentFollowing = currentUserSnap.data()?.following || [];
    const targetFollowers = targetUserSnap.data()?.followers || [];
    
    // Verificar que no esté siguiendo ya (evitar duplicados)
    if (currentFollowing.includes(targetUserId)) {
        return false;
    }
    
    const batch = writeBatch(db);
    
    // Actualizar currentUser
    batch.update(currentUserRef, {
        following: arrayUnion(targetUserId),
        followingCount: (currentUserSnap.data()?.followingCount || 0) + 1
    });
    
    // Actualizar targetUser
    batch.update(targetUserRef, {
        followers: arrayUnion(currentUserId),
        followersCount: (targetUserSnap.data()?.followersCount || 0) + 1
    });
    
    await batch.commit();
    return true;
}

// Dejar de seguir a un usuario
export async function unfollowUser(currentUserId, targetUserId) {
    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);
    
    const currentUserSnap = await getDoc(currentUserRef);
    const targetUserSnap = await getDoc(targetUserRef);
    
    const currentFollowing = currentUserSnap.data()?.following || [];
    const targetFollowers = targetUserSnap.data()?.followers || [];
    
    // Verificar que realmente lo esté siguiendo
    if (!currentFollowing.includes(targetUserId)) {
        return false;
    }
    
    // Evitar que el contador baje de 0
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
// Verificar si sigue a un usuario
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

// Suscripción en tiempo real a posts
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

// Crear post
export async function createPost(postData) {
    try {
        await addDoc(postsCollection, {
            ...postData,
            likes: 0,
            likedBy: [],
            commentCount: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()  // ← AÑADIDO (consistencia con users)
        });
    } catch (error) {
        console.error('Error al crear post:', error);
        throw error;
    }
}

// Dar/Quitar like a un post
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

// Obtener posts de un usuario específico
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

// Eliminar un post y todos sus comentarios
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

// Editar un post
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

// Obtener posts de usuarios seguidos (FEED)
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

// Obtener posts trending (últimas 24 horas con más likes)
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

// ==================== COMENTARIOS (NUEVO - COMPLETO) ====================

// Agregar comentario a un post
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
        
        // Incrementar contador de comentarios en el post
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

// Obtener comentarios de un post
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

// Eliminar comentario
export async function deleteComment(postId, commentId) {
    try {
        const commentRef = doc(db, 'posts', String(postId), 'comments', commentId);
        await deleteDoc(commentRef);
        
        // Decrementar contador de comentarios en el post
        const postRef = doc(db, 'posts', String(postId));
        await updateDoc(postRef, {
            commentCount: increment(-1)
        });
    } catch (error) {
        console.error('Error al eliminar comentario:', error);
        throw error;
    }
}

// ==================== FUNCIONES FALTANTES (addDoc) ====================
// Nota: addDoc no estaba importado, lo añado aquí
// import { addDoc } from 'firebase/firestore';