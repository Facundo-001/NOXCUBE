import { Heart, MessageCircle, Share2, Edit3, Trash2, MoreVertical, Clock, Check, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { togglePostLike, deletePost, editPost } from '../service/postService';
import '../styles/PostCard.css';

const PostCard = ({ post, user, onDelete }) => {
    const { id, titulo, usuario, contenido, likes, likedBy = [], comentarios, userId, createdAt } = post;
    const [liked, setLiked] = useState(false);
    const [likeCount, setLikeCount] = useState(likes || 0);
    const [liking, setLiking] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editTitle, setEditTitle] = useState(titulo);
    const [editContent, setEditContent] = useState(contenido);
    const [deleting, setDeleting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showToast, setShowToast] = useState(null);
    const [copied, setCopied] = useState(false);
    const menuRef = useRef(null);
    const navigate = useNavigate();

    const MAX_LENGTH = 150;
    const isLong = contenido.length > MAX_LENGTH;
    const previewContent = isLong ? contenido.substring(0, MAX_LENGTH) + '...' : contenido;
    const isAuthor = user && userId === user.uid;

    // Formatear fecha
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

    useEffect(() => {
        if (user && likedBy.includes(user.uid)) {
            setLiked(true);
        } else {
            setLiked(false);
        }
    }, [user, likedBy]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const showToastMessage = (message, type = 'info') => {
        setShowToast({ message, type });
        setTimeout(() => setShowToast(null), 3000);
    };

    const handleLike = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) {
            showToastMessage('Inicia sesión para dar like', 'warning');
            return;
        }
        if (user.isAnonymous) {
            showToastMessage('Regístrate para interactuar', 'warning');
            return;
        }
        if (liking) return;
        setLiking(true);
        const newLiked = !liked;
        setLiked(newLiked);
        setLikeCount(prev => newLiked ? prev + 1 : prev - 1);
        try {
            await togglePostLike(id, user.uid);
        } catch (error) {
            setLiked(!newLiked);
            setLikeCount(prev => newLiked ? prev - 1 : prev + 1);
            console.error('Error al dar like:', error);
        } finally {
            setLiking(false);
        }
    };

    const handleShare = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/post/${id}`);
            setCopied(true);
            showToastMessage('¡Enlace copiado!', 'success');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            showToastMessage('Error al copiar enlace', 'error');
        }
    };

    const handleCardClick = () => {
        navigate(`/post/${id}`);
    };

    const handleReadMore = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setExpanded(true);
    };

    const handleEditClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        setShowEdit(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
            await editPost(id, { titulo: editTitle, contenido: editContent });
            setShowEdit(false);
            showToastMessage('Post actualizado', 'success');
        } catch (error) {
            console.error('Error al editar:', error);
            showToastMessage('Error al editar', 'error');
        }
    };

    const handleDeleteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        
        if (!window.confirm('¿Estás seguro de eliminar este post?')) return;
        
        setDeleting(true);
        try {
            await deletePost(id);
            if (onDelete) onDelete(id);
            showToastMessage('Post eliminado', 'success');
        } catch (error) {
            console.error('Error al eliminar:', error);
            showToastMessage('Error al eliminar', 'error');
        } finally {
            setDeleting(false);
        }
    };

    // Navegar al perfil del usuario
    const handleUserClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (userId) {
            navigate(`/perfil/${userId}`);
        }
    };

    if (deleting) return null;

    return (
        <>
            <article className={`post-card ${expanded ? 'expanded' : ''}`} onClick={handleCardClick}>
                <div className="post-header">
                    <div className="post-user-info">
                        <span 
                            className="post-user clickable"
                            onClick={handleUserClick}
                        >
                            {usuario}
                        </span>
                        <span className="post-time">
                            <Clock size={14} />
                            {formatDate(createdAt)}
                        </span>
                    </div>
                    {isAuthor && !showEdit && (
                        <div className="post-menu-container" ref={menuRef}>
                            <button
                                className="menu-btn"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                            >
                                <MoreVertical size={20} />
                            </button>
                            {showMenu && (
                                <div className="post-menu">
                                    <button onClick={handleEditClick}>
                                        <Edit3 size={16} />
                                        <span>Editar</span>
                                    </button>
                                    <button onClick={handleDeleteClick}>
                                        <Trash2 size={16} />
                                        <span>Eliminar</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {showEdit ? (
                    <div className="post-edit-form" onClick={(e) => e.stopPropagation()}>
                        <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="edit-input"
                            placeholder="Título"
                        />
                        <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="edit-textarea"
                            rows="4"
                        />
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
                                <button className="read-more-btn" onClick={handleReadMore}>
                                    Leer más
                                </button>
                            )}
                            {expanded && (
                                <button className="read-more-btn" onClick={() => setExpanded(false)}>
                                    Mostrar menos
                                </button>
                            )}
                        </div>
                        <div className="post-actions" onClick={(e) => e.stopPropagation()}>
                            <button
                                className={`action-btn ${liked ? 'liked' : ''}`}
                                onClick={handleLike}
                                disabled={liking}
                            >
                                <Heart size={20} fill={liked ? '#b41f1f' : 'none'} stroke={liked ? '#b41f1f' : 'currentColor'} />
                                <span>{likeCount}</span>
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => navigate(`/post/${id}`)}
                            >
                                <MessageCircle size={20} />
                                <span>{comentarios || 0}</span>
                            </button>
                            <button className="action-btn" onClick={handleShare}>
                                {copied ? <Check size={20} /> : <Share2 size={20} />}
                            </button>
                        </div>
                    </>
                )}
            </article>
            
            {showToast && (
                <div className={`toast-notification ${showToast.type}`}>
                    {showToast.message}
                </div>
            )}
        </>
    );
};

export default PostCard;