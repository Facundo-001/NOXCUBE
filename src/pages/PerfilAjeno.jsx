import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import { getUserPosts } from '../service/postService';
import { getUserCommentsOptimized } from '../service/commentService';
import { getUserProfile, followUser, unfollowUser, isFollowing } from '../service/userService';
import {
    Calendar,
    Mail,
    FileText,
    MessageCircle,
    Heart,
    Clock,
    AlertCircle,
    ArrowLeft,
    UserPlus,
    UserCheck
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

    // Estados para follow
    const [following, setFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    useEffect(() => {
        if (userId) {
            fetchProfileData();
            if (user && !user.isAnonymous && user.uid !== userId) {
                checkFollowStatus();
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
                }
            }
        } catch (err) {
            console.error('Error al seguir/dejar de seguir:', err);
        } finally {
            setFollowLoading(false);
        }
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
    const userInitial = profile.displayName?.charAt(0).toUpperCase() || profile.email?.charAt(0).toUpperCase() || '?';

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

                    {/* Botón de seguir - SOLO para otros usuarios */}
                    {user && !user.isAnonymous && !isOwnProfile && (
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
                                <span>{profile.email}</span>
                            </div>
                            <div className="detail-item">
                                <Calendar size={16} />
                                <span>Miembro desde {formatDate(profile.createdAt)}</span>
                            </div>
                            <div className="perfil-id-copy">
                                <span className="id-value">ID: {profile.shortId}</span>
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
            </main>
        </>
    );
};

export default PerfilAjeno;