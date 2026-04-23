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
    deleteDoc
} from 'firebase/firestore';

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
    await addDoc(postsCollection, {
        ...postData,
        likes: 0,
        likedBy: [],
        commentCount: 0,
        createdAt: serverTimestamp()
    });
}

export async function togglePostLike(postId, userId) {
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
}

// Obtener posts de un usuario específico
export async function getUserPosts(userId) {
    const q = query(postsCollection, where('userId', '==', userId), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
}

// Eliminar un post y todos sus comentarios
export async function deletePost(postId) {
    // Primero eliminar todos los comentarios (y sus respuestas)
    const commentsRef = collection(db, 'posts', String(postId), 'comments');
    const commentsSnap = await getDocs(commentsRef);
    const batch = writeBatch(db);

    for (const commentDoc of commentsSnap.docs) {
        // Eliminar respuestas de cada comentario
        const repliesRef = collection(db, 'posts', String(postId), 'comments', commentDoc.id, 'replies');
        const repliesSnap = await getDocs(repliesRef);
        repliesSnap.docs.forEach(replyDoc => {
            batch.delete(replyDoc.ref);
        });
        // Eliminar comentario
        batch.delete(commentDoc.ref);
    }
    // Finalmente eliminar el post
    const postRef = doc(db, 'posts', String(postId));
    batch.delete(postRef);
    await batch.commit();
}

// Editar un post
export async function editPost(postId, newData) {
    const postRef = doc(db, 'posts', String(postId));
    await updateDoc(postRef, {
        ...newData,
        editedAt: serverTimestamp()
    });
}