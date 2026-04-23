import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, ChevronDown, ChevronUp, MoreVertical, Edit3, Trash2, AlertCircle, LogIn, Clock, X, Check } from 'lucide-react';
import {
    subscribeToComments,
    createComment,
    toggleCommentLike,
    subscribeToReplies,
    createReply,
    toggleReplyLike,
    deleteComment,
    editComment,
    deleteReply,
    editReply
} from '../service/commentService';
import '../styles/CommentSection.css';

const CommentSection = ({ postId, user }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [sending, setSending] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
    const [toast, setToast] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = subscribeToComments(postId, (newComments) => {
            setComments(newComments);
        });
        return unsubscribe;
    }, [postId]);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !user || user.isAnonymous || sending) return;

        setSending(true);
        try {
            await createComment(
                postId,
                newComment,
                user.uid,
                user.displayName || user.email
            );
            setNewComment('');
            showToast('Comentario publicado', 'success');
        } catch (error) {
            console.error('Error al enviar comentario:', error);
            showToast('Error al publicar comentario', 'error');
        } finally {
            setSending(false);
        }
    };

    const handleCommentDeleted = (commentId) => {
        setComments(prev => prev.filter(c => c.id !== commentId));
        showToast('Comentario eliminado', 'success');
    };

    const LoginPromptModal = () => (
        <div className="modal-overlay" onClick={() => setShowLoginModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-icon">
                    <AlertCircle size={48} />
                </div>
                <h3>Inicia sesión para interactuar</h3>
                <p>Para comentar, dar like o responder necesitas tener una cuenta.</p>
                
                <div className="modal-actions">
                    <button 
                        className="modal-btn secondary"
                        onClick={() => setShowLoginModal(false)}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="modal-btn primary"
                        onClick={() => navigate('/login')}
                    >
                        Ir a Iniciar Sesión
                    </button>
                </div>
            </div>
        </div>
    );

    const DeleteConfirmModal = () => (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(null)}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-icon warning">
                    <AlertCircle size={48} />
                </div>
                <h3>¿Eliminar {showDeleteConfirm?.type === 'comment' ? 'comentario' : 'respuesta'}?</h3>
                <p>Esta acción no se puede deshacer.</p>
                
                <div className="modal-actions">
                    <button 
                        className="modal-btn secondary"
                        onClick={() => setShowDeleteConfirm(null)}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="modal-btn danger"
                        onClick={() => {
                            if (showDeleteConfirm) {
                                showDeleteConfirm.onConfirm();
                                setShowDeleteConfirm(null);
                            }
                        }}
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="comment-section">
            <h3>Comentarios ({comments.length})</h3>

            {user && !user.isAnonymous ? (
                <form className="comment-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Escribe un comentario..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="comment-input"
                        disabled={sending}
                    />
                    <button
                        type="submit"
                        className="comment-submit"
                        disabled={sending || !newComment.trim()}
                    >
                        {sending ? 'Enviando...' : 'Comentar'}
                    </button>
                </form>
            ) : (
                <button 
                    className="comment-login-prompt"
                    onClick={() => setShowLoginModal(true)}
                >
                    <LogIn size={18} />
                    <span>Inicia sesión para comentar</span>
                </button>
            )}

            <div className="comments-list">
                {comments.map(comment => (
                    <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={postId}
                        user={user}
                        onCommentDeleted={handleCommentDeleted}
                        setShowDeleteConfirm={setShowDeleteConfirm}
                        showToast={showToast}
                    />
                ))}
            </div>

            {showLoginModal && <LoginPromptModal />}
            {showDeleteConfirm && <DeleteConfirmModal />}
            
            {toast && (
                <div className={`toast-notification ${toast.type}`}>
                    {toast.type === 'success' && <Check size={16} />}
                    {toast.type === 'error' && <X size={16} />}
                    <span>{toast.message}</span>
                </div>
            )}
        </div>
    );
};

// Función helper para formatear fechas
const formatDate = (timestamp) => {
    if (!timestamp) return 'Ahora mismo';
    try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins} min`;
        if (diffHours < 24) return `Hace ${diffHours} h`;
        if (diffDays < 7) return `Hace ${diffDays} d`;
        
        return date.toLocaleDateString('es-ES', { 
            day: 'numeric', 
            month: 'short',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    } catch (err) {
        return 'Ahora mismo';
    }
};

const CommentItem = ({ comment, postId, user, onCommentDeleted, setShowDeleteConfirm, showToast }) => {
    const [showReplies, setShowReplies] = useState(false);
    const [replies, setReplies] = useState([]);
    const [replyText, setReplyText] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(comment.likes || 0);
    const [liking, setLiking] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editText, setEditText] = useState(comment.text);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const isAuthor = user && comment.userId === user.uid;

    useEffect(() => {
        if (showReplies) {
            const unsubscribe = subscribeToReplies(postId, comment.id, setReplies);
            return unsubscribe;
        }
    }, [showReplies, postId, comment.id]);

    useEffect(() => {
        if (user && comment.likedBy?.includes(user.uid)) {
            setLiked(true);
        }
    }, [user, comment]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLike = async () => {
        if (!user || user.isAnonymous) {
            showToast('Inicia sesión para dar like', 'warning');
            return;
        }
        if (liking) return;
        setLiking(true);
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        try {
            await toggleCommentLike(postId, comment.id, user.uid);
        } catch (error) {
            setLiked(!newLiked);
            setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
        } finally {
            setLiking(false);
        }
    };

    const handleReplySubmit = async (e) => {
        e.preventDefault();
        if (!replyText.trim() || !user || user.isAnonymous || sendingReply) return;
        setSendingReply(true);
        try {
            await createReply(postId, comment.id, replyText, user.uid, user.displayName || user.email);
            setReplyText('');
            setShowReplies(true);
            showToast('Respuesta publicada', 'success');
        } catch (error) {
            console.error('Error al enviar respuesta:', error);
            showToast('Error al publicar respuesta', 'error');
        } finally {
            setSendingReply(false);
        }
    };

    const handleDelete = () => {
        setMenuOpen(false);
        setShowDeleteConfirm({
            type: 'comment',
            onConfirm: async () => {
                try {
                    await deleteComment(postId, comment.id);
                    if (onCommentDeleted) onCommentDeleted(comment.id);
                } catch (error) {
                    console.error('Error al eliminar comentario:', error);
                    showToast('Error al eliminar', 'error');
                }
            }
        });
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editText.trim()) return;
        try {
            await editComment(postId, comment.id, editText);
            setShowEdit(false);
            setMenuOpen(false);
            showToast('Comentario actualizado', 'success');
        } catch (error) {
            console.error('Error al editar comentario:', error);
            showToast('Error al editar', 'error');
        }
    };

    const handleUserClick = (e) => {
        e.stopPropagation();
        if (comment.userId) {
            navigate(`/perfil/${comment.userId}`);
        }
    };

    return (
        <div className="comment-item">
            <div className="comment-main">
                <div className="comment-header">
                    <div className="comment-user-info">
                        <span 
                            className="comment-user clickable"
                            onClick={handleUserClick}
                        >
                            {comment.userName}
                        </span>
                        <span className="comment-time">
                            <Clock size={12} />
                            {formatDate(comment.createdAt)}
                        </span>
                    </div>
                    {isAuthor && !showEdit && (
                        <div className="comment-menu-container" ref={menuRef}>
                            <button className="menu-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                                <MoreVertical size={16} />
                            </button>
                            {menuOpen && (
                                <div className="comment-menu">
                                    <button onClick={() => { setMenuOpen(false); setShowEdit(true); }}>
                                        <Edit3 size={14} /> <span>Editar</span>
                                    </button>
                                    <button onClick={handleDelete}>
                                        <Trash2 size={14} /> <span>Eliminar</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showEdit ? (
                    <form className="comment-edit-form" onSubmit={handleEdit}>
                        <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="comment-edit-input"
                            autoFocus
                        />
                        <div className="edit-actions">
                            <button type="submit" className="save-btn">Guardar</button>
                            <button type="button" className="cancel-btn" onClick={() => setShowEdit(false)}>Cancelar</button>
                        </div>
                    </form>
                ) : (
                    <p className="comment-text">{comment.text}</p>
                )}

                <div className="comment-footer">
                    {user && !user.isAnonymous && (
                        <button className="comment-like-btn" onClick={handleLike} disabled={liking}>
                            <Heart 
                                size={18} 
                                fill={liked ? "#b41f1f" : "none"} 
                                stroke={liked ? "#b41f1f" : "currentColor"}
                                strokeWidth={liked ? 1.5 : 2}
                            />
                            <span>{likeCount}</span>
                        </button>
                    )}
                    <button
                        className="comment-reply-btn"
                        onClick={() => setShowReplies(!showReplies)}
                    >
                        <MessageCircle size={18} />
                        <span>{comment.replyCount || 0} respuestas</span>
                        {showReplies ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>
            </div>

            {showReplies && (
                <div className="replies-section">
                    {replies.map(reply => (
                        <ReplyItem
                            key={reply.id}
                            reply={reply}
                            postId={postId}
                            commentId={comment.id}
                            user={user}
                            setShowDeleteConfirm={setShowDeleteConfirm}
                            showToast={showToast}
                        />
                    ))}
                    {user && !user.isAnonymous && (
                        <form className="reply-form" onSubmit={handleReplySubmit}>
                            <input
                                type="text"
                                placeholder="Escribe una respuesta..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                className="reply-input"
                                disabled={sendingReply}
                            />
                            <button 
                                type="submit" 
                                className="reply-submit" 
                                disabled={sendingReply || !replyText.trim()}
                            >
                                {sendingReply ? 'Enviando...' : 'Responder'}
                            </button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

const ReplyItem = ({ reply, postId, commentId, user, setShowDeleteConfirm, showToast }) => {
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(reply.likes || 0);
    const [liking, setLiking] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editText, setEditText] = useState(reply.text);
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();
    const isAuthor = user && reply.userId === user.uid;

    useEffect(() => {
        if (user && reply.likedBy?.includes(user.uid)) setLiked(true);
    }, [user, reply]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLike = async () => {
        if (!user || user.isAnonymous) {
            showToast('Inicia sesión para dar like', 'warning');
            return;
        }
        if (liking) return;
        setLiking(true);
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        try {
            await toggleReplyLike(postId, commentId, reply.id, user.uid);
        } catch (error) {
            setLiked(!newLiked);
            setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
        } finally {
            setLiking(false);
        }
    };

    const handleDelete = () => {
        setMenuOpen(false);
        setShowDeleteConfirm({
            type: 'reply',
            onConfirm: async () => {
                try {
                    await deleteReply(postId, commentId, reply.id);
                    showToast('Respuesta eliminada', 'success');
                } catch (error) {
                    console.error('Error al eliminar respuesta:', error);
                    showToast('Error al eliminar', 'error');
                }
            }
        });
    };

    const handleEdit = async (e) => {
        e.preventDefault();
        if (!editText.trim()) return;
        try {
            await editReply(postId, commentId, reply.id, editText);
            setShowEdit(false);
            setMenuOpen(false);
            showToast('Respuesta actualizada', 'success');
        } catch (error) {
            console.error('Error al editar respuesta:', error);
            showToast('Error al editar', 'error');
        }
    };

    const handleUserClick = (e) => {
        e.stopPropagation();
        if (reply.userId) {
            navigate(`/perfil/${reply.userId}`);
        }
    };

    return (
        <div className="reply-item">
            <div className="reply-header">
                <div className="reply-user-info">
                    <span 
                        className="reply-user clickable"
                        onClick={handleUserClick}
                    >
                        {reply.userName}
                    </span>
                    <span className="reply-time">
                        <Clock size={11} />
                        {formatDate(reply.createdAt)}
                    </span>
                </div>
                {isAuthor && !showEdit && (
                    <div className="reply-menu-container" ref={menuRef}>
                        <button className="menu-btn" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                            <MoreVertical size={14} />
                        </button>
                        {menuOpen && (
                            <div className="reply-menu">
                                <button onClick={() => { setMenuOpen(false); setShowEdit(true); }}>
                                    <Edit3 size={12} /> <span>Editar</span>
                                </button>
                                <button onClick={handleDelete}>
                                    <Trash2 size={12} /> <span>Eliminar</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {showEdit ? (
                <form className="reply-edit-form" onSubmit={handleEdit}>
                    <input
                        type="text"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="reply-edit-input"
                        autoFocus
                    />
                    <div className="edit-actions">
                        <button type="submit" className="save-btn">Guardar</button>
                        <button type="button" className="cancel-btn" onClick={() => setShowEdit(false)}>Cancelar</button>
                    </div>
                </form>
            ) : (
                <>
                    <p className="reply-text">{reply.text}</p>
                    <div className="reply-footer">
                        {user && !user.isAnonymous && (
                            <button className="reply-like-btn" onClick={handleLike} disabled={liking}>
                                <Heart 
                                    size={16} 
                                    fill={liked ? "#b41f1f" : "none"} 
                                    stroke={liked ? "#b41f1f" : "currentColor"}
                                    strokeWidth={liked ? 1.8 : 2.2}
                                />
                                <span>{likeCount}</span>
                            </button>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CommentSection;