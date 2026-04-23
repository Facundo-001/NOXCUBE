import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import '../styles/post.css';

const Post = ({ user }) => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPost = async () => {
            const docRef = doc(db, 'posts', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setPost({ id: docSnap.id, ...docSnap.data() });
            } else {
                setPost(null);
            }
            setLoading(false);
        };
        fetchPost();
    }, [id]);

    if (loading) return <div>Cargando...</div>;
    if (!post) return <div>Post no encontrado</div>;

    return (
        <>
            <Navbar />
            <main className="post-detalle-container">
                <PostCard post={post} user={user} />
                <CommentSection postId={id} user={user} />
            </main>
        </>
    );
};

export default Post;