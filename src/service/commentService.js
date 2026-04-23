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
    increment,
    arrayUnion,
    arrayRemove,
    getDoc,
    writeBatch,
    getDocs,
    where,
    deleteDoc,
    limit,
    Timestamp
} from 'firebase/firestore';

// ==================== COMENTARIOS ====================
export function subscribeToComments(postId, callback) {
    const commentsRef = collection(db, 'posts', String(postId), 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(comments);
    });
}

export async function createComment(postId, text, userId, userName) {
    const safePostId = String(postId);
    const commentsRef = collection(db, 'posts', safePostId, 'comments');
    const postRef = doc(db, 'posts', safePostId);
    
    // 1. PRIMERO crear el comentario (esto SÍ debería funcionar)
    const commentRef = await addDoc(commentsRef, {
        text,
        userId,
        userName,
        likes: 0,
        likedBy: [],
        replyCount: 0,
        createdAt: serverTimestamp()
    });
    
    // 2. LUEGO intentar actualizar el contador (si falla, no importa)
    try {
        await updateDoc(postRef, {
            commentCount: increment(1)
        });
    } catch (error) {
        // Si falla por permisos, no es crítico
        console.warn('No se pudo actualizar commentCount (normal en posts ajenos)');
    }
    
    return commentRef.id;
}

export async function toggleCommentLike(postId, commentId, userId) {
    const commentRef = doc(db, 'posts', String(postId), 'comments', String(commentId));
    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) return;

    const likedBy = commentSnap.data().likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
        await updateDoc(commentRef, {
            likedBy: arrayRemove(userId),
            likes: increment(-1)
        });
    } else {
        await updateDoc(commentRef, {
            likedBy: arrayUnion(userId),
            likes: increment(1)
        });
    }
}

export async function deleteComment(postId, commentId) {
    const postRef = doc(db, 'posts', String(postId));
    const repliesRef = collection(db, 'posts', String(postId), 'comments', String(commentId), 'replies');
    const repliesSnap = await getDocs(repliesRef);
    const batch = writeBatch(db);
    
    repliesSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    
    const commentRef = doc(db, 'posts', String(postId), 'comments', String(commentId));
    batch.delete(commentRef);
    
    await batch.commit();
    
    try {
        await updateDoc(postRef, {
            commentCount: increment(-1)
        });
    } catch (error) {
        console.warn('No se pudo actualizar commentCount');
    }
}

export async function editComment(postId, commentId, newText) {
    const commentRef = doc(db, 'posts', String(postId), 'comments', String(commentId));
    await updateDoc(commentRef, {
        text: newText,
        editedAt: serverTimestamp()
    });
}

// ==================== RESPUESTAS ====================
export function subscribeToReplies(postId, commentId, callback) {
    const repliesRef = collection(db, 'posts', String(postId), 'comments', String(commentId), 'replies');
    const q = query(repliesRef, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
        const replies = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        callback(replies);
    });
}

export async function createReply(postId, commentId, text, userId, userName) {
    const repliesRef = collection(db, 'posts', String(postId), 'comments', String(commentId), 'replies');
    const commentRef = doc(db, 'posts', String(postId), 'comments', String(commentId));
    
    const replyRef = await addDoc(repliesRef, {
        text,
        userId,
        userName,
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp()
    });

    try {
        await updateDoc(commentRef, {
            replyCount: increment(1)
        });
    } catch (error) {
        console.warn('No se pudo actualizar replyCount');
    }

    return replyRef.id;
}

export async function toggleReplyLike(postId, commentId, replyId, userId) {
    const replyRef = doc(db, 'posts', String(postId), 'comments', String(commentId), 'replies', String(replyId));
    const replySnap = await getDoc(replyRef);
    if (!replySnap.exists()) return;

    const likedBy = replySnap.data().likedBy || [];
    const isLiked = likedBy.includes(userId);

    if (isLiked) {
        await updateDoc(replyRef, {
            likedBy: arrayRemove(userId),
            likes: increment(-1)
        });
    } else {
        await updateDoc(replyRef, {
            likedBy: arrayUnion(userId),
            likes: increment(1)
        });
    }
}

export async function deleteReply(postId, commentId, replyId) {
    const replyRef = doc(db, 'posts', String(postId), 'comments', String(commentId), 'replies', String(replyId));
    const commentRef = doc(db, 'posts', String(postId), 'comments', String(commentId));
    
    await deleteDoc(replyRef);
    
    try {
        await updateDoc(commentRef, {
            replyCount: increment(-1)
        });
    } catch (error) {
        console.warn('No se pudo actualizar replyCount');
    }
}

export async function editReply(postId, commentId, replyId, newText) {
    const replyRef = doc(db, 'posts', String(postId), 'comments', String(commentId), 'replies', String(replyId));
    await updateDoc(replyRef, {
        text: newText,
        editedAt: serverTimestamp()
    });
}

// ==================== POSTS ====================
export async function getUserPosts(userId) {
    try {
        const postsRef = collection(db, 'posts');
        const q = query(
            postsRef, 
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(50)
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

// ==================== CONSULTAS OPTIMIZADAS PARA SPARK PLAN ====================
export async function getUserCommentsOptimized(userId, limitCount = 50) {
    try {
        const userPosts = await getUserPosts(userId);
        
        if (userPosts.length === 0) return [];
        
        let allComments = [];
        
        for (const post of userPosts.slice(0, 20)) {
            try {
                const commentsRef = collection(db, 'posts', post.id, 'comments');
                const q = query(
                    commentsRef,
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc'),
                    limit(limitCount)
                );
                
                const snapshot = await getDocs(q);
                
                snapshot.docs.forEach(doc => {
                    allComments.push({
                        id: doc.id,
                        postId: post.id,
                        postTitle: post.title || post.content?.substring(0, 30) + '...' || 'Sin título',
                        ...doc.data()
                    });
                });
            } catch (err) {
                // Ignorar errores de índice
            }
        }
        
        return allComments.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });
        
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        return [];
    }
}

export async function getAllUserComments(userId) {
    try {
        const userPosts = await getUserPosts(userId);
        
        if (userPosts.length === 0) return [];
        
        let allComments = [];
        
        for (const post of userPosts) {
            try {
                const commentsRef = collection(db, 'posts', post.id, 'comments');
                const q = query(
                    commentsRef,
                    where('userId', '==', userId),
                    orderBy('createdAt', 'desc')
                );
                
                const snapshot = await getDocs(q);
                
                snapshot.docs.forEach(doc => {
                    allComments.push({
                        id: doc.id,
                        postId: post.id,
                        postTitle: post.title || post.content?.substring(0, 30) + '...' || 'Sin título',
                        ...doc.data()
                    });
                });
            } catch (err) {
                // Ignorar
            }
        }
        
        return allComments.sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || 0;
            const timeB = b.createdAt?.toMillis?.() || 0;
            return timeB - timeA;
        });
        
    } catch (error) {
        console.error('Error al obtener todos los comentarios:', error);
        return [];
    }
}

export async function updateUserProfile(userId, profileData) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp()
    });
    return true;
}

export async function getUserProfile(userId) {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
        return {
            id: userSnap.id,
            ...userSnap.data()
        };
    }
    return null;
}

export async function getCommentCount(postId) {
    try {
        const commentsRef = collection(db, 'posts', String(postId), 'comments');
        const snapshot = await getDocs(commentsRef);
        return snapshot.size;
    } catch (error) {
        return 0;
    }
}

export function canUserComment(user) {
    return user && !user.isAnonymous;
}