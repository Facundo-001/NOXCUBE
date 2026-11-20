import { Heart, MessageCircle, Share2, Edit3, Trash2, MoreVertical, Clock, Check, Copy, Flag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import ReportModal from './ReportModal';
import { togglePostLike, deletePost, editPost } from '../service/postService';
import { subscribeToComments } from '../service/commentService';
import '../styles/PostCard.css';

// ==================== FORMATO DE FECHA ESTILO YOUTUBE ====================
const formatDateYouTube = (timestamp) => {
    if (!timestamp) return 'Ahora mismo';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffSec = Math.floor((now - date) / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffMonth = Math.floor(diffDay / 30.44);

        if (diffSec < 60) return 'Ahora mismo';
        if (diffMin === 1) return 'Hace 1 minuto';
        if (diffMin < 60) return `Hace ${diffMin} minutos`;
        if (diffHour === 1) return 'Hace 1 hora';
        if (diffHour < 24) return `Hace ${diffHour} horas`;
        if (diffDay === 1) return 'Hace 1 día';
        if (diffDay < 7) return `Hace ${diffDay} días`;
        if (diffDay < 30) {
            const semanas = Math.floor(diffDay / 7);
            return semanas === 1 ? 'Hace 1 semana' : `Hace ${semanas} semanas`;
        }
        if (diffMonth < 12) return diffMonth === 1 ? 'Hace 1 mes' : `Hace ${diffMonth} meses`;
        const diffYear = Math.floor(diffDay / 365.25);
        return diffYear === 1 ? 'Hace 1 año' : `Hace ${diffYear} años`;
    } catch (err) {
        return 'Ahora mismo';
    }
};

const formatDateExact = (timestamp) => {
    if (!timestamp) return '';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long',
            year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch (err) { return ''; }
};

// ==================== MINI BURBUJA SOBRE COMENTARIOS (CON RESPUESTAS) ====================
const CommentPreviewBubble = ({ postId }) => {
    const [visible, setVisible] = useState(false);
    const [preview, setPreview] = useState(null);
    const [fading, setFading] = useState(false);

    const fetchRandomItem = useCallback(async () => {
        try {
            if (!postId) return;
            const { db } = await import('../lib/firebase');
            const { collection, getDocs, query, orderBy, limit } = await import('firebase/firestore');
            
            const commentsRef = collection(db, 'posts', String(postId), 'comments');
            const commentsQ = query(commentsRef, orderBy('createdAt', 'desc'), limit(30));
            const commentsSnap = await getDocs(commentsQ);
            
            const allItems = [];
            
            commentsSnap.docs.forEach(doc => {
                allItems.push({
                    type: 'comment',
                    userName: doc.data().userName,
                    text: doc.data().text,
                    replyTo: null
                });
            });
            
            const commentsToCheck = commentsSnap.docs.slice(0, 5);
            
            for (const commentDoc of commentsToCheck) {
                try {
                    const repliesRef = collection(
                        db, 'posts', String(postId), 'comments', commentDoc.id, 'replies'
                    );
                    const repliesQ = query(repliesRef, orderBy('createdAt', 'desc'), limit(10));
                    const repliesSnap = await getDocs(repliesQ);
                    
                    repliesSnap.docs.forEach(doc => {
                        allItems.push({
                            type: 'reply',
                            userName: doc.data().userName,
                            text: doc.data().text,
                            replyTo: commentDoc.data().userName
                        });
                    });
                } catch (err) {}
            }
            
            if (allItems.length > 0) {
                setPreview(allItems[Math.floor(Math.random() * allItems.length)]);
            }
        } catch (error) {}
    }, [postId]);

    useEffect(() => {
        if (!postId) return;
        const showBubble = async () => {
            await fetchRandomItem();
            setVisible(true);
            setFading(false);
            setTimeout(() => {
                setFading(true);
                setTimeout(() => { setVisible(false); setPreview(null); }, 350);
            }, 4000);
        };
        const initialTimeout = setTimeout(showBubble, 3000);
        const interval = setInterval(() => {
            const delay = Math.floor(Math.random() * 8000) + 10000;
            setTimeout(showBubble, delay);
        }, 18000);
        return () => { clearTimeout(initialTimeout); clearInterval(interval); };
    }, [postId, fetchRandomItem]);

    if (!visible || !preview) return null;

    return (
        <div className={`comment-preview-bubble ${fading ? 'preview-exit' : 'preview-enter'}`}>
            {preview.type === 'reply' && preview.replyTo ? (
                <>
                    <span className="preview-username">
                        {preview.userName}
                        <span className="preview-reply-indicator"> respondió a </span>
                        <span className="preview-reply-to">@{preview.replyTo}</span>
                    </span>
                    <p className="preview-text">
                        {preview.text.length > 40 ? preview.text.substring(0, 40) + '...' : preview.text}
                    </p>
                </>
            ) : (
                <>
                    <span className="preview-username">{preview.userName}</span>
                    <p className="preview-text">
                        {preview.text.length > 50 ? preview.text.substring(0, 50) + '...' : preview.text}
                    </p>
                </>
            )}
            <div className="preview-arrow" />
        </div>
    );
};

// ==================== POST CARD ====================
const PostCard = ({ post, user, onDelete }) => {
    const { id, titulo, usuario, contenido, likes, likedBy = [], userId, createdAt } = post;
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes || 0);
    const [liking, setLiking] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editTitle, setEditTitle] = useState(titulo);
    const [editContent, setEditContent] = useState(contenido);
    const [deleting, setDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const [copied, setCopied] = useState(false);
    const [commentCount, setCommentCount] = useState(0);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const MAX_LENGTH = 150;
    const isLong = contenido.length > MAX_LENGTH;
    const previewContent = isLong ? contenido.substring(0, MAX_LENGTH) + '...' : contenido;
    const isAuthor = user && userId === user.uid;

    // ==================== CONTADOR TOTAL (COMENTARIOS + RESPUESTAS) ====================
    const fetchTotalComments = useCallback(async (postId) => {
        try {
            const { db } = await import('../lib/firebase');
            const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
            
            const commentsRef = collection(db, 'posts', String(postId), 'comments');
            const commentsSnap = await getDocs(query(commentsRef, orderBy('createdAt', 'desc')));
            
            let total = commentsSnap.size;
            
            for (const commentDoc of commentsSnap.docs) {
                try {
                    const repliesRef = collection(
                        db, 'posts', String(postId), 'comments', commentDoc.id, 'replies'
                    );
                    const repliesSnap = await getDocs(repliesRef);
                    total += repliesSnap.size;
                } catch (err) {}
            }
            
            return total;
        } catch (error) {
            return 0;
        }
    }, []);

    useEffect(() => {
        const fetchInitial = async () => {
            const count = await fetchTotalComments(id);
            setCommentCount(count);
        };
        fetchInitial();

        const unsubscribe = subscribeToComments(id, async () => {
            const count = await fetchTotalComments(id);
            setCommentCount(count);
        });

        return () => unsubscribe();
    }, [id, fetchTotalComments]);

    useEffect(() => {
        if (user && likedBy.includes(user.uid)) setLiked(true);
        else setLiked(false);
    }, [user, likedBy]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) setShowMenu(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToastMessage = (message, type = 'info') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    const handleLike = async (e) => {
        e.preventDefault(); e.stopPropagation();
        if (!user) { showToastMessage('Inicia sesión para dar like', 'warning'); return; }
        if (user.isAnonymous) { showToastMessage('Regístrate para interactuar', 'warning'); return; }
        if (liking) return;
        setLiking(true);
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        try { await togglePostLike(id, user.uid); }
        catch (error) {
            setLiked(!newLiked);
            setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
        }
        finally { setLiking(false); }
    };

    const handleShare = async (e) => {
        e.preventDefault(); e.stopPropagation();
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
            setCopied(true);
            showToastMessage('¡Enlace copiado!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) { showToastMessage('Error al copiar enlace', 'error'); }
    };

    const handleCardClick = () => navigate(`/post/${id}`);
    
    const handleCommentClick = (e) => {
        e.preventDefault(); e.stopPropagation();
        navigate(`/post/${id}`);
    };

    const handleReadMore = (e) => { e.preventDefault(); e.stopPropagation(); setExpanded(true); };
    const handleEditClick = (e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(false); setShowEdit(true); };
    
    const handleSaveEdit = async (e) => {
        e.preventDefault(); e.stopPropagation();
        try {
            await editPost(id, { titulo: editTitle, contenido: editContent });
            setShowEdit(false);
            showToastMessage('Post actualizado', 'success');
        } catch (error) { showToastMessage('Error al editar', 'error'); }
    };

    const handleDeleteClick = async (e) => {
        e.preventDefault(); e.stopPropagation();
        setShowMenu(false);
        if (!window.confirm('¿Estás seguro de eliminar este post?')) return;
        setDeleting(true);
        try {
            await deletePost(id);
            if (onDelete) onDelete(id);
            showToastMessage('Post eliminado', 'success');
        } catch (error) { showToastMessage('Error al eliminar', 'error'); }
        finally { setDeleting(false); }
    };

    const handleUserClick = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (userId) navigate(`/perfil/${userId}`);
    };

    if (deleting) return null;

    return (
        <>
            <article className={`post-card ${expanded ? 'expanded' : ''}`} onClick={handleCardClick}>
                <div className="post-header">
                    <div className="post-user-info">
                        <span className="post-user clickable" onClick={handleUserClick}>{usuario}</span>
                        <span className="post-time" title={formatDateExact(createdAt)}>
                            <Clock size={14} />
                            {formatDateYouTube(createdAt)}
                        </span>
                    </div>
                    <div className="post-menu-container" ref={menuRef}>
                        <button className="menu-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}>
                            <MoreVertical size={20} />
                        </button>
                        {showMenu && (
                            <div className="post-menu">
                                {isAuthor && (
                                    <>
                                        <button onClick={handleEditClick}><Edit3 size={16} /><span>Editar</span></button>
                                        <button onClick={handleDeleteClick}><Trash2 size={16} /><span>Eliminar</span></button>
                                    </>
                                )}
                                {!isAuthor && user && !user.isAnonymous && (
                                    <button onClick={(e) => { e.stopPropagation(); setShowMenu(false); setShowReportModal(true); }}>
                                        <Flag size={16} />
                                        <span>Reportar</span>
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {showEdit ? (
                    <div className="post-edit-form" onClick={(e) => e.stopPropagation()}>
                        <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="edit-input" placeholder="Título" />
                        <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className="edit-textarea" rows="4" />
                        <div className="edit-actions">
                            <button onClick={handleSaveEdit} className="save-btn">Guardar</button>
                            <button onClick={() => setShowEdit(false)} className="cancel-btn">Cancelar</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <h3 className="post-title">{titulo}</h3>
                        <div className="post-content" onClick={(e) => e.stopPropagation()}>
                            <p>{expanded ? contenido : previewContent}</p>
                            {isLong && !expanded && (
                                <button className="read-more-btn" onClick={handleReadMore}>Leer más</button>
                            )}
                            {expanded && (
                                <button className="read-more-btn" onClick={() => setExpanded(false)}>Mostrar menos</button>
                            )}
                        </div>
                        <div className="post-actions" onClick={(e) => e.stopPropagation()}>
                            <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike} disabled={liking}>
                                <Heart size={20} fill={liked ? '#b41f1f' : 'none'} stroke={liked ? '#b41f1f' : 'currentColor'} />
                                <span>{likeCount}</span>
                            </button>
                            
                            <div className="comment-btn-wrapper">
                                <button className="action-btn" onClick={handleCommentClick}>
                                    <MessageCircle size={20} />
                                    <span>{commentCount}</span>
                                </button>
                                <CommentPreviewBubble postId={id} />
                            </div>

                            <button className="action-btn" onClick={handleShare}>
                                {copied ? <Check size={20} /> : <Share2 size={20} />}
                            </button>
                        </div>
                    </>
                )}
            </article>

            {showReportModal && (
                <ReportModal 
                    reporterId={user?.uid}
                    targetId={id} 
                    targetType="post"
                    onClose={() => setShowReportModal(false)}
                />
            )}

            {showToast && (
                <div className={`toast-notification ${showToast.type}`}>{showToast.message}</div>
            )}
        </>
    );
};

export default PostCard;