import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import ReportModal from '../components/ReportModal';
import { getUserPosts } from '../service/postService';
import { getUserCommentsOptimized } from '../service/commentService';
import {
    getUserProfile,
    followUser,
    unfollowUser,
    isFollowing,
    sendFriendRequest,
    areFriends,
    getUserByShortId
} from '../service/userService';
import { createNotification } from '../service/notificationService';
import {
    Calendar,
    FileText,
    MessageCircle,
    Heart,
    Clock,
    AlertCircle,
    ArrowLeft,
    UserPlus,
    UserCheck,
    Users,
    MessageSquare,
    Search,
    X,
    Send,
    Hash,
    Flag
} from 'lucide-react';
import '../styles/perfil.css';

const PerfilAjeno = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [userComments, setUserComments] = useState([]);
    const [activeTab, setActiveTab] = useState('posts');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const [isFriend, setIsFriend] = useState(false);
    const [friendRequestSent, setFriendRequestSent] = useState(false);
    const [sendingDirectRequest, setSendingDirectRequest] = useState(false);

    const [showFriendModal, setShowFriendModal] = useState(false);
    const [friendCode, setFriendCode] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [sendingRequest, setSendingRequest] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (userId) {
            fetchProfileData();
            if (user && !user.isAnonymous && user.uid !== userId) {
                checkFollowStatus();
                checkFriendStatus();
            }
        }
    }, [userId, user]);

    const fetchProfileData = async () => {
        setLoading(true);
        setError(null);
        try {
            const profileData = await getUserProfile(userId);
            if (!profileData) {
                setError('Usuario no encontrado');
                setLoading(false);
                return;
            }
            setProfile(profileData);
            setFollowersCount(profileData.followersCount || 0);
            setFollowingCount(profileData.followingCount || 0);

            const posts = await getUserPosts(userId);
            setUserPosts(posts);

            const comments = await getUserCommentsOptimized(userId, 30);
            setUserComments(comments);
        } catch (err) {
            console.error('Error al cargar perfil:', err);
            setError('Error al cargar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const checkFollowStatus = async () => {
        try {
            const status = await isFollowing(user.uid, userId);
            setFollowing(status);
        } catch (err) {
            console.error('Error al verificar follow:', err);
        }
    };

    const checkFriendStatus = async () => {
        try {
            const status = await areFriends(user.uid, userId);
            setIsFriend(status);
        } catch (err) {
            console.error('Error al verificar amistad:', err);
        }
    };

    const handleFollow = async () => {
        if (!user || user.isAnonymous) {
            navigate('/login');
            return;
        }
        setFollowLoading(true);
        try {
            if (following) {
                const success = await unfollowUser(user.uid, userId);
                if (success) {
                    setFollowersCount(prev => Math.max(0, prev - 1));
                    setFollowing(false);
                }
            } else {
                const success = await followUser(user.uid, userId);
                if (success) {
                    setFollowersCount(prev => prev + 1);
                    setFollowing(true);
                    try {
                        await createNotification(userId, 'follow', {
                            fromUserId: user.uid,
                            fromUserName: user.displayName || 'Alguien',
                            message: 'te ha seguido'
                        });
                    } catch (err) { }
                }
            }
        } catch (err) {
            console.error('Error al seguir/dejar de seguir:', err);
            showToast('Error al realizar la acción', 'error');
        } finally {
            setFollowLoading(false);
        }
    };

    const handleSendDirectFriendRequest = async () => {
        if (!user || user.isAnonymous || !profile) return;

        setSendingDirectRequest(true);
        try {
            const success = await sendFriendRequest(user.uid, profile.uid);

            if (success) {
                setFriendRequestSent(true);
                showToast(`Solicitud enviada a ${profile.displayName}`, 'success');

                try {
                    await createNotification(profile.uid, 'friend_request', {
                        fromUserId: user.uid,
                        fromUserName: user.displayName || 'Alguien',
                        message: 'te ha enviado una solicitud de amistad'
                    });
                } catch (err) { }
            } else {
                showToast('Ya existe una solicitud pendiente', 'warning');
                setFriendRequestSent(true);
            }
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            showToast('Error al enviar solicitud', 'error');
        } finally {
            setSendingDirectRequest(false);
        }
    };

    const handleOpenCodeModal = () => {
        setShowFriendModal(true);
        setFriendCode('');
        setSearchResult(null);
        setSearchError('');
    };

    const handleSearchByCode = async () => {
        if (!friendCode.trim() || friendCode.length < 3) return;
        setSendingRequest(true);
        setSearchError('');
        setSearchResult(null);

        try {
            const result = await getUserByShortId(friendCode.trim().toUpperCase());

            if (!result) {
                setSearchError('No se encontró ningún usuario con ese código');
            } else if (result.uid === user.uid) {
                setSearchError('No puedes agregarte a ti mismo');
            } else {
                setSearchResult(result);
            }
        } catch (error) {
            setSearchError('Error al buscar usuario');
        } finally {
            setSendingRequest(false);
        }
    };

    const handleSendCodeFriendRequest = async () => {
        if (!searchResult) return;

        setSendingRequest(true);
        try {
            const success = await sendFriendRequest(user.uid, searchResult.uid);

            if (success) {
                showToast(`Solicitud enviada a ${searchResult.displayName}`, 'success');

                try {
                    await createNotification(searchResult.uid, 'friend_request', {
                        fromUserId: user.uid,
                        fromUserName: user.displayName || 'Alguien',
                        message: 'te ha enviado una solicitud de amistad'
                    });
                } catch (err) { }

                setTimeout(() => setShowFriendModal(false), 1500);
            } else {
                showToast('Ya existe una solicitud pendiente', 'warning');
            }
        } catch (error) {
            console.error('Error al enviar solicitud:', error);
            showToast('Error al enviar solicitud', 'error');
        } finally {
            setSendingRequest(false);
        }
    };

    const handleOpenChat = () => {
        navigate(`/chat/${userId}`);
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return 'Fecha desconocida';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            if (isNaN(date.getTime())) return 'Fecha desconocida';

            return date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (err) {
            return 'Fecha desconocida';
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

    const handleCommentClick = (postId) => {
        navigate(`/post/${postId}`);
    };

    const isOwnProfile = user && user.uid === userId;

    useEffect(() => {
        if (isOwnProfile) {
            navigate('/perfil', { replace: true });
        }
    }, [isOwnProfile, navigate]);

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

    if (error || !profile) {
        return (
            <>
                <Navbar />
                <main className="perfil-container">
                    <div className="empty-state">
                        <AlertCircle size={48} />
                        <h3>{error || 'Perfil no encontrado'}</h3>
                        <p>El usuario que buscas no existe o ha sido eliminado.</p>
                        <button
                            className="modal-btn primary"
                            onClick={() => navigate('/home')}
                            style={{ marginTop: '1.5rem' }}
                        >
                            Volver al inicio
                        </button>
                    </div>
                </main>
            </>
        );
    }

    const avatarColor = profile.avatarColor || '#C3A44B';
    const userInitial = profile.displayName?.charAt(0).toUpperCase() || '?';

    return (
        <>
            <Navbar />
            <main className="perfil-container">
                <button className="back-button" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Volver
                </button>

                <div className="perfil-header">
                    <div className="perfil-cover"></div>

                    {user && !user.isAnonymous && !isOwnProfile && (
                        <div className="perfil-actions">
                            <button
                                className={`follow-btn ${following ? 'following' : ''}`}
                                onClick={handleFollow}
                                disabled={followLoading}
                            >
                                {following ? (
                                    <>
                                        <UserCheck size={18} />
                                        <span>Siguiendo</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus size={18} />
                                        <span>Seguir</span>
                                    </>
                                )}
                            </button>

                            {isFriend ? (
                                <button
                                    className="friend-btn is-friend"
                                    onClick={handleOpenChat}
                                >
                                    <MessageSquare size={18} />
                                    <span>Chat</span>
                                </button>
                            ) : friendRequestSent ? (
                                <button className="friend-btn pending" disabled>
                                    <Send size={18} />
                                    <span>Enviada</span>
                                </button>
                            ) : (
                                <button
                                    className="friend-btn"
                                    onClick={handleSendDirectFriendRequest}
                                    disabled={sendingDirectRequest}
                                >
                                    {sendingDirectRequest ? (
                                        <span>Enviando...</span>
                                    ) : (
                                        <>
                                            <Users size={18} />
                                            <span>Agregar amigo</span>
                                        </>
                                    )}
                                </button>
                            )}

                            <button className="friend-btn code-btn" onClick={() => setShowReportModal(true)} title="Reportar usuario">
                                <Flag size={18} />
                            </button>
                        </div>
                    )}

                    <div className="perfil-avatar-wrapper">
                        <div
                            className="perfil-avatar-large"
                            style={{ backgroundColor: avatarColor }}
                        >
                            {userInitial}
                        </div>
                    </div>

                    <div className="perfil-info">
                        <h1 className="perfil-nombre">{profile.displayName}</h1>
                        <p className="perfil-username">@{profile.shortId}</p>

                        <p className="perfil-bio">
                            {profile.bio || '📝 Sin bio.'}
                        </p>

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
                                <Calendar size={16} />
                                <span>Miembro desde {formatDate(profile.createdAt)}</span>
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
                                    <h3>Aún no ha creado ningún post</h3>
                                    <p>Este usuario todavía no ha compartido nada.</p>
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
                                    <h3>Aún no ha comentado</h3>
                                    <p>Este usuario todavía no ha interactuado.</p>
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

                {showFriendModal && (
                    <div className="modal-overlay" onClick={() => setShowFriendModal(false)}>
                        <div className="modal-content add-friend-modal" onClick={e => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>
                                    <Hash size={20} />
                                    Agregar por código
                                </h3>
                                <button className="modal-close-btn" onClick={() => setShowFriendModal(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <p className="add-friend-desc">
                                Ingresa el código de 6 dígitos del usuario que quieres agregar.
                            </p>

                            <div className="add-friend-input-group">
                                <input
                                    type="text"
                                    className="add-friend-input"
                                    placeholder="ABC123"
                                    value={friendCode}
                                    onChange={(e) => {
                                        setFriendCode(e.target.value.toUpperCase().slice(0, 6));
                                        setSearchResult(null);
                                        setSearchError('');
                                    }}
                                    maxLength={6}
                                    autoFocus
                                />
                                <button
                                    className="add-friend-search-btn"
                                    onClick={handleSearchByCode}
                                    disabled={friendCode.length < 3 || sendingRequest}
                                >
                                    {sendingRequest ? '...' : (
                                        <>
                                            <Search size={16} />
                                            Buscar
                                        </>
                                    )}
                                </button>
                            </div>

                            {searchError && (
                                <p className="add-friend-error">{searchError}</p>
                            )}

                            {searchResult && (
                                <div className="search-result-card">
                                    <div
                                        className="search-result-avatar"
                                        style={{ backgroundColor: searchResult.avatarColor }}
                                    >
                                        {searchResult.displayName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="search-result-info">
                                        <span className="search-result-name">{searchResult.displayName}</span>
                                        <span className="search-result-id">@{searchResult.shortId}</span>
                                    </div>
                                    <button
                                        className="search-result-add-btn"
                                        onClick={handleSendCodeFriendRequest}
                                        disabled={sendingRequest}
                                    >
                                        {sendingRequest ? '...' : (
                                            <>
                                                <UserPlus size={16} />
                                                Agregar
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                                <button
                                    className="modal-btn secondary"
                                    onClick={() => setShowFriendModal(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {showReportModal && (
                    <ReportModal 
                        reporterId={user?.uid}
                        targetId={userId} 
                        targetType="user"
                        onClose={() => setShowReportModal(false)}
                    />
                )}

                {toast && (
                    <div className={`toast-notification ${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                )}
            </main>
        </>
    );
};

export default PerfilAjeno;