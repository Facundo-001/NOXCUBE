import { useState, useEffect, useCallback } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import '../styles/CommentBubble.css';

const CommentBubble = ({ postId, postTitle }) => {
    const [visible, setVisible] = useState(false);
    const [randomComment, setRandomComment] = useState(null);
    const [fading, setFading] = useState(false);
    const navigate = useNavigate();

    // Función para obtener un comentario aleatorio
    const fetchRandomComment = useCallback(async () => {
        try {
            const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
            const { db } = await import('../lib/firebase');
            
            const commentsRef = collection(db, 'posts', String(postId), 'comments');
            const q = query(commentsRef, orderBy('createdAt', 'desc'), limit(50));
            const snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                const comments = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                const randomIndex = Math.floor(Math.random() * comments.length);
                setRandomComment(comments[randomIndex]);
            }
        } catch (error) {
            // Silencioso, no es crítico
        }
    }, [postId]);

    // Aparecer cada cierto tiempo (entre 8 y 15 segundos)
    useEffect(() => {
        if (!postId) return;

        const showBubble = async () => {
            await fetchRandomComment();
            setVisible(true);
            setFading(false);

            // Desaparece después de 5 segundos
            setTimeout(() => {
                setFading(true);
                setTimeout(() => {
                    setVisible(false);
                    setRandomComment(null);
                }, 400); // tiempo de la animación de salida
            }, 5000);
        };

        // Primera aparición a los 3 segundos
        const initialTimeout = setTimeout(showBubble, 3000);

        // Luego cada 8-15 segundos
        const interval = setInterval(() => {
            const delay = Math.floor(Math.random() * 7000) + 8000; // 8-15s
            setTimeout(showBubble, delay);
        }, 15000);

        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [postId, fetchRandomComment]);

    const handleBubbleClick = () => {
        navigate(`/post/${postId}`);
    };

    const handleClose = (e) => {
        e.stopPropagation();
        setFading(true);
        setTimeout(() => {
            setVisible(false);
            setRandomComment(null);
        }, 400);
    };

    if (!visible || !randomComment) return null;

    return (
        <div 
            className={`comment-bubble ${fading ? 'bubble-exit' : 'bubble-enter'}`}
            onClick={handleBubbleClick}
        >
            <button className="bubble-close" onClick={handleClose}>
                <X size={14} />
            </button>
            <div className="bubble-icon">
                <MessageCircle size={18} />
            </div>
            <div className="bubble-content">
                <div className="bubble-header">
                    <span className="bubble-username">{randomComment.userName}</span>
                    <span className="bubble-label">comentó en</span>
                </div>
                <p className="bubble-text">
                    {randomComment.text.length > 60 
                        ? randomComment.text.substring(0, 60) + '...' 
                        : randomComment.text}
                </p>
                <span className="bubble-post-title">{postTitle}</span>
            </div>
        </div>
    );
};

export default CommentBubble;