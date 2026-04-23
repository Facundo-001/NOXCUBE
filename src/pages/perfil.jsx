import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { getUserPosts } from '../service/postService';
import { getUserCommentsOptimized } from '../service/commentService';
import { updateUserProfile } from '../service/userService';
import { 
    Calendar, 
    Mail, 
    Copy, 
    Check, 
    FileText, 
    MessageCircle, 
    Heart,
    Clock,
    AlertCircle,
    Edit3,
    X,
    Palette,
    Save,
    User,
    Users
} from 'lucide-react';
import '../styles/perfil.css';

// Colores predefinidos para personalizar avatar (AMPLIADO)
const AVATAR_COLORS = [
    '#C3A44B', // Oro principal
    '#67E8F9', // Celeste
    '#F472B6', // Rosa
    '#A78BFA', // Púrpura
    '#34D399', // Verde esmeralda
    '#FBBF24', // Ámbar
    '#60A5FA', // Azul
    '#F87171', // Rojo
    '#C084FC', // Violeta
    '#2DD4BF', // Teal
    '#FB923C', // Naranja
    '#4ADE80', // Verde lima
    '#EC4899', // Rosa fuerte
    '#8B5CF6', // Violeta oscuro
    '#06B6D4', // Cyan
    '#EAB308', // Amarillo
    '#EF4444', // Rojo brillante
    '#3B82F6', // Azul real
    '#14B8A6', // Verde mar
    '#F97316', // Naranja quemado
];

const Perfil = () => {
    const navigate = useNavigate();
    const { user, userProfile, refreshUserProfile } = useAuth();
    const [activeTab, setActiveTab] = useState('posts');
    const [userPosts, setUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    
    // Estados para edición
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        displayName: '',
        bio: '',
        avatarColor: AVATAR_COLORS[0]
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // Métricas de seguidores
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        if (user && !user.isAnonymous) {
            fetchUserData();
        } else {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (userProfile) {
            setEditForm({
                displayName: userProfile.displayName || user.displayName || '',
                bio: userProfile.bio || '',
                avatarColor: userProfile.avatarColor || AVATAR_COLORS[0]
            });
            setFollowersCount(userProfile.followersCount || 0);
            setFollowingCount(userProfile.followingCount || 0);
        }
    }, [userProfile, user]);

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const posts = await getUserPosts(user.uid);
            setUserPosts(posts);
            
            const comments = await getUserCommentsOptimized(user.uid, 30);
            setUserComments(comments);
        } catch (error) {
            console.error('Error al cargar datos del perfil:', error);
            setError('Error al cargar los datos. Intenta refrescar la página.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyId = async () => {
        if (userProfile?.shortId) {
            try {
                await navigator.clipboard.writeText(userProfile.shortId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (err) {
                console.error('Error al copiar:', err);
            }
        }
    };

    const handleSaveProfile = async () => {
        if (!editForm.displayName.trim()) {
            setError('El nombre no puede estar vacío');
            return;
        }
        
        setSaving(true);
        setError(null);
        
        try {
            await updateUserProfile(user.uid, {
                displayName: editForm.displayName.trim(),
                bio: editForm.bio.trim(),
                avatarColor: editForm.avatarColor,
                updatedAt: new Date()
            });
            
            if (refreshUserProfile) {
                await refreshUserProfile();
            }
            
            setIsEditing(false);
        } catch (error) {
            console.error('Error al guardar perfil:', error);
            setError('Error al guardar los cambios. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };

    const handleCommentClick = (postId) => {
        if (postId) {
            navigate(`/post/${postId}`);
        }
    };

    const handleRetry = () => {
        setError(null);
        fetchUserData();
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Fecha desconocida';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        } catch (err) {
            return 'Fecha inválida';
        }
    };

    const formatShortDate = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('es-ES', { 
                month: 'short', 
                day: 'numeric' 
            });
        } catch (err) {
            return '';
        }
    };

    if (!user || user.isAnonymous) {
        return (
            <>
                <Navbar />
                <main className="perfil-container">
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>Inicia sesión para ver tu perfil</h3>
                        <p>Necesitas una cuenta para acceder a esta sección</p>
                        <button 
                            className="modal-btn primary"
                            onClick={() => navigate('/login')}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Ir a Iniciar Sesión
                        </button>
                    </div>
                </main>
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Navbar />
                <main className="perfil-container">
                    <div className="perfil-loading">
                        <div className="loading-spinner"></div>
                        <p>Cargando perfil...</p>
                    </div>
                </main>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <main className="perfil-container">
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>Error al cargar el perfil</h3>
                        <p>{error}</p>
                        <button 
                            className="modal-btn primary"
                            onClick={handleRetry}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Reintentar
                        </button>
                    </div>
                </main>
            </>
        );
    }

    if (!userProfile) {
        return (
            <>
                <Navbar />
                <main className="perfil-container">
                    <div className="empty-state">
                        <User size={48} />
                        <h3>Perfil no encontrado</h3>
                        <p>No se pudo cargar la información del perfil</p>
                    </div>
                </main>
            </>
        );
    }

    const avatarColor = userProfile.avatarColor || AVATAR_COLORS[0];
    const userInitial = userProfile.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?';

    return (
        <>
            <Navbar />
            <main className="perfil-container">
                <div className="perfil-header">
                    <button 
                        className="perfil-edit-btn"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit3 size={18} />
                        Editar perfil
                    </button>
                    
                    <div className="perfil-cover"></div>
                    
                    <div className="perfil-avatar-wrapper">
                        <div 
                            className="perfil-avatar-large"
                            style={{ backgroundColor: avatarColor }}
                            onClick={() => setIsEditing(true)}
                        >
                            {userInitial}
                            <div className="avatar-edit-overlay">
                                <Palette size={20} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="perfil-info">
                        <h1 className="perfil-nombre">{userProfile.displayName}</h1>
                        <p className="perfil-username">@{userProfile.shortId}</p>
                        
                        <p className="perfil-bio">
                            {userProfile.bio || '📝 Sin bio aún. ¡Edita tu perfil!'}
                        </p>
                        
                        {/* Métricas con seguidores */}
                        <div className="perfil-metrics">
                            <div 
                                className={`metric-item ${activeTab === 'posts' ? 'active' : ''}`}
                                onClick={() => setActiveTab('posts')}
                            >
                                <span className="metric-value">{userPosts.length}</span>
                                <span className="metric-label">Posts</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-value">{followersCount}</span>
                                <span className="metric-label">Seguidores</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-value">{followingCount}</span>
                                <span className="metric-label">Siguiendo</span>
                            </div>
                        </div>
                        
                        <div className="perfil-details">
                            <div className="detail-item">
                                <Mail size={16} />
                                <span>{user.email}</span>
                            </div>
                            <div className="detail-item">
                                <Calendar size={16} />
                                <span>Miembro desde {formatDate(userProfile.createdAt)}</span>
                            </div>
                            <div className="perfil-id-copy">
                                <span className="id-value">ID: {userProfile.shortId}</span>
                                <button 
                                    className={`copy-btn ${copied ? 'copied' : ''}`}
                                    onClick={handleCopyId}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copiado' : 'Copiar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="perfil-tabs">
                    <button 
                        className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
                        onClick={() => setActiveTab('posts')}
                    >
                        <FileText size={18} />
                        Posts
                        <span className="tab-count">{userPosts.length}</span>
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'comments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('comments')}
                    >
                        <MessageCircle size={18} />
                        Comentarios
                        <span className="tab-count">{userComments.length}</span>
                    </button>
                </div>
                
                <div className="perfil-content">
                    {activeTab === 'posts' && (
                        <div className="perfil-posts">
                            {userPosts.length === 0 ? (
                                <div className="empty-state">
                                    <FileText size={48} />
                                    <h3>Aún no has creado ningún post</h3>
                                    <p>¡Comparte algo con la comunidad!</p>
                                </div>
                            ) : (
                                userPosts.map(post => (
                                    <PostCard 
                                        key={post.id} 
                                        post={post} 
                                        user={user}
                                    />
                                ))
                            )}
                        </div>
                    )}
                    
                    {activeTab === 'comments' && (
                        <div className="perfil-comments">
                            {userComments.length === 0 ? (
                                <div className="empty-state">
                                    <MessageCircle size={48} />
                                    <h3>Aún no has comentado</h3>
                                    <p>Interactúa con los posts de otros usuarios</p>
                                </div>
                            ) : (
                                userComments.map(comment => (
                                    <div 
                                        key={comment.id}
                                        className="comment-card"
                                        onClick={() => handleCommentClick(comment.postId)}
                                    >
                                        <div className="comment-header">
                                            <span className="comment-post-title">
                                                📝 {comment.postTitle || 'Post sin título'}
                                            </span>
                                            <span className="comment-date">
                                                <Clock size={12} />
                                                {formatShortDate(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="comment-text">{comment.text}</p>
                                        <div className="comment-footer">
                                            <span className="comment-likes">
                                                <Heart size={14} fill={comment.likes > 0 ? '#b41f1f' : 'none'} />
                                                {comment.likes || 0}
                                            </span>
                                            {comment.replyCount > 0 && (
                                                <span className="comment-replies">
                                                    <MessageCircle size={14} />
                                                    {comment.replyCount}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
                
                {/* Modal de edición */}
                {isEditing && (
                    <>
                        <div className="modal-overlay" onClick={() => setIsEditing(false)} />
                        <div className="edit-profile-modal">
                            <div className="modal-header">
                                <h3>Editar perfil</h3>
                                <button className="modal-close" onClick={() => setIsEditing(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            
                            {error && (
                                <div className="error-message" style={{ marginBottom: '1rem' }}>
                                    {error}
                                </div>
                            )}
                            
                            <div className="edit-field">
                                <label>Nombre</label>
                                <input
                                    type="text"
                                    className="edit-input"
                                    value={editForm.displayName}
                                    onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                                    placeholder="Tu nombre"
                                    maxLength={30}
                                />
                            </div>
                            
                            <div className="edit-field">
                                <label>Bio</label>
                                <textarea
                                    className="edit-textarea"
                                    value={editForm.bio}
                                    onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                                    placeholder="Cuéntanos sobre ti..."
                                    maxLength={150}
                                />
                            </div>
                            
                            <div className="edit-field">
                                <label>Color de avatar</label>
                                <div className="color-grid">
                                    {AVATAR_COLORS.map(color => (
                                        <div
                                            key={color}
                                            className={`color-option ${editForm.avatarColor === color ? 'selected' : ''}`}
                                            style={{ backgroundColor: color }}
                                            onClick={() => setEditForm({...editForm, avatarColor: color})}
                                        />
                                    ))}
                                </div>
                            </div>
                            
                            <div className="modal-actions">
                                <button 
                                    className="modal-btn secondary"
                                    onClick={() => {
                                        setIsEditing(false);
                                        setError(null);
                                    }}
                                    disabled={saving}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    className="modal-btn primary"
                                    onClick={handleSaveProfile}
                                    disabled={saving || !editForm.displayName.trim()}
                                >
                                    {saving ? (
                                        <>Guardando...</>
                                    ) : (
                                        <>
                                            <Save size={16} style={{ marginRight: '4px' }} />
                                            Guardar cambios
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </>
    );
};

export default Perfil;