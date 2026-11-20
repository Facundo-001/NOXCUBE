import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home, User, LogIn, LogOut, PlusSquare, Settings,
    ChevronLeft, ChevronRight, Menu, X, Bell, MessageCircle,
    Heart, Users, Hash, Search, UserPlus, Send, MessageSquare, UserCheck
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
    subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead
} from '../service/notificationService';
import {
    getUserByShortId, sendFriendRequest,
    subscribeToFriendRequests, acceptFriendRequest, rejectFriendRequest,
    getSentFriendRequests, cancelSentFriendRequest
} from '../service/userService';
import GatoLogo from '../pages/img/gato.png'
// NUEVO: Import para los mensajes no leídos
import { subscribeToChats } from '../service/chatService';
import { createNotification } from '../service/notificationService';
import '../styles/Navbar.css';
import messageSound from '@assets/sounds/Mensaje.mp3';

const Navbar = () => {
    const [expanded, setExpanded] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Notificaciones
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef(null);

    // Modal agregar amigo
    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendCode, setFriendCode] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [searching, setSearching] = useState(false);
    const [sendingRequest, setSendingRequest] = useState(false);
    const [addFriendSuccess, setAddFriendSuccess] = useState(false);

    // Solicitudes de amistad
    const [showRequests, setShowRequests] = useState(false);
    const [activeRequestsTab, setActiveRequestsTab] = useState('received'); // 'received' | 'sent'
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loadingSent, setLoadingSent] = useState(false);
    const requestsRef = useRef(null);

    // NUEVO: State para los mensajes no leídos
    const [unreadMessages, setUnreadMessages] = useState(0);

    // Toast
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) setMobileMenuOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Suscripción a notificaciones
    useEffect(() => {
        if (user && !user.isAnonymous) {
            const unsub = subscribeToNotifications(user.uid, (notifs) => {
                setNotifications(notifs);
                setUnreadCount(notifs.filter(n => !n.read).length);
            });
            return unsub;
        }
    }, [user]);

    // Suscripción a solicitudes recibidas
    useEffect(() => {
        if (user && !user.isAnonymous) {
            const unsub = subscribeToFriendRequests(user.uid, setFriendRequests);
            return unsub;
        }
    }, [user]);

    // NUEVO: Suscripción a chats para obtener mensajes no leídos + SONIDO
    useEffect(() => {
        if (!user || user.isAnonymous) return;

        let previousTotal = 0;

        const unsub = subscribeToChats(user.uid, (chats) => {
            const total = chats.reduce((sum, chat) => sum + (chat.unread || 0), 0);

            // 🔊 Sonido si aumentó y NO estamos en /chat
            if (total > previousTotal && window.location.pathname !== '/chat') {
                playMessageSound();
            }

            previousTotal = total;
            setUnreadMessages(total);
        });

        return () => unsub();
    }, [user]);

    // 🎵 Función de sonido para mensajes nuevos (respeta configuración)
    const playMessageSound = () => {
        try {
            const settings = JSON.parse(localStorage.getItem('noxcube-settings') || '{}');
            if (settings.soundEffects === false) return;
            // Ruta real :.\sounds\here-i-am-449.mp3
            const audio = new Audio(messageSound);
            audio.volume = 1;
            audio.play().catch(() => { });
        } catch (e) { }
    };

    // Cargar enviadas al abrir dropdown
    useEffect(() => {
        if (showRequests) loadSentRequests();
    }, [showRequests]);

    const loadSentRequests = async () => {
        if (!user) return;
        setLoadingSent(true);
        try {
            const sent = await getSentFriendRequests(user.uid);
            setSentRequests(sent);
        } catch (e) { console.error(e); }
        finally { setLoadingSent(false); }
    };

    // Cerrar dropdowns al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
            if (requestsRef.current && !requestsRef.current.contains(event.target)) {
                setShowRequests(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cerrar al navegar
    useEffect(() => {
        setMobileMenuOpen(false); setExpanded(false);
        setShowNotifications(false); setShowRequests(false);
    }, [location.pathname]);

    const toggleSidebar = () => setExpanded(!expanded);
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const toggleNotifications = () => { setShowNotifications(!showNotifications); setShowRequests(false); };
    const toggleRequests = () => { setShowRequests(!showRequests); setShowNotifications(false); };

    const handleLogout = async () => {
        await logout(); navigate('/home');
        setExpanded(false); setMobileMenuOpen(false);
    };

    const handleNavigation = (path) => {
        navigate(path); setExpanded(false); setMobileMenuOpen(false);
    };

    // Notificaciones
    const handleNotificationClick = async (notification) => {
        if (!notification.read) await markNotificationAsRead(user.uid, notification.id);
        if (notification.type === 'follow' || notification.type === 'friend_request' || notification.type === 'friend_accepted') {
            navigate(`/perfil/${notification.fromUserId}`);
        } else if (notification.type === 'comment' || notification.type === 'like') {
            navigate(`/post/${notification.postId}`);
        }
        setShowNotifications(false);
    };

    const handleMarkAllRead = async () => { await markAllNotificationsAsRead(user.uid); };

    // Agregar amigo
    const handleOpenAddFriend = () => {
        setShowAddFriend(true); setFriendCode(''); setSearchResult(null); setSearchError(''); setAddFriendSuccess(false);
    };

    const handleSearchByCode = async () => {
        if (!friendCode.trim() || friendCode.length < 3) return;
        setSearching(true); setSearchError(''); setSearchResult(null); setAddFriendSuccess(false);
        try {
            const result = await getUserByShortId(friendCode.trim().toUpperCase());
            if (!result) setSearchError('Usuario no encontrado');
            else if (result.uid === user.uid) setSearchError('No puedes agregarte a ti mismo');
            else setSearchResult(result);
        } catch { setSearchError('Error al buscar'); }
        finally { setSearching(false); }
    };

    const handleSendFriendRequest = async () => {
        if (!searchResult) return;
        setSendingRequest(true);
        try {
            const result = await sendFriendRequest(user.uid, searchResult.uid);
            if (result === true) {
                setAddFriendSuccess(true);
                showToast(`Solicitud enviada a ${searchResult.displayName}`, 'success');
                try { await createNotification(searchResult.uid, 'friend_request', { fromUserId: user.uid, fromUserName: user.displayName || user.email, message: 'te ha enviado una solicitud de amistad' }); } catch { }
            } else if (result === 'already_friends') {
                showToast('Ya son amigos', 'warning');
            } else {
                showToast('Ya hay una solicitud pendiente', 'warning');
                setAddFriendSuccess(true);
            }
        } catch { showToast('Error al enviar solicitud', 'error'); }
        finally { setSendingRequest(false); }
    };

    // Solicitudes
    const handleAcceptRequest = async (requestId, fromUserId) => {
        try {
            await acceptFriendRequest(user.uid, requestId, fromUserId);
            showToast('Solicitud aceptada', 'success');

            try {
                await createNotification(fromUserId, 'friend_accepted', {
                    fromUserId: user.uid,
                    fromUserName: user.displayName || user.email,
                    message: 'ha aceptado tu solicitud de amistad'
                });
            } catch { }

            // Redirigir al chat con la persona
            navigate(`/chat/${fromUserId}`);
            setShowRequests(false);

        } catch { showToast('Error al aceptar', 'error'); }
    };

    const handleRejectRequest = async (requestId) => {
        try { await rejectFriendRequest(user.uid, requestId); showToast('Solicitud rechazada', 'info'); }
        catch { showToast('Error al rechazar', 'error'); }
    };

    const handleCancelRequest = async (requestId, toUserId) => {
        try { await cancelSentFriendRequest(user.uid, requestId, toUserId); showToast('Solicitud cancelada', 'info'); loadSentRequests(); }
        catch { showToast('Error al cancelar', 'error'); }
    };

    // Utilidades
    const showToast = (message, type = 'info') => {
        setToast({ message, type }); setTimeout(() => setToast(null), 3000);
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const diffMins = Math.floor((new Date() - date) / 60000);
            if (diffMins < 1) return 'Ahora';
            if (diffMins < 60) return `Hace ${diffMins}m`;
            if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
            return `Hace ${Math.floor(diffMins / 1440)}d`;
        } catch { return ''; }
    };

    useEffect(() => {
        document.documentElement.style.setProperty('--sidebar-width', expanded ? '280px' : '80px');
    }, [expanded]);

    const isAuthenticated = user && !user.isAnonymous;

    // NUEVO: Se añade la propiedad 'badge' solo al item de Chat
    const menuItems = [
        { path: '/home', icon: Home, label: 'Home', showWhenAuth: null, color: '#C3A44B' },
        { path: '/chat', icon: MessageSquare, label: 'Chat', showWhenAuth: true, color: '#67E8F9', badge: unreadMessages },
        { path: '/perfil', icon: User, label: 'Perfil', showWhenAuth: true, color: '#67E8F9' },
        { path: '/crear-post', icon: PlusSquare, label: 'Crear Post', showWhenAuth: true, color: '#F472B6' },
        { path: '/configuracion', icon: Settings, label: 'Configuración', showWhenAuth: true, color: '#A78BFA' },
        { action: 'logout', icon: LogOut, label: 'Cerrar sesión', showWhenAuth: true, color: '#ef4444' },
        { path: '/login', icon: LogIn, label: 'Iniciar sesión', showWhenAuth: false, color: '#10b981' },
    ];

    const filteredItems = menuItems.filter(item => {
        if (item.showWhenAuth === null) return true;
        if (item.showWhenAuth === true) return isAuthenticated;
        if (item.showWhenAuth === false) return !isAuthenticated;
        return false;
    });

    // DesktopSidebar modificado para envolver el botón de chat en un div con el badge
    const DesktopSidebar = () => (
        <aside className={`sidebar ${expanded ? 'expanded' : 'collapsed'}`}>
            <div className="sidebar-toggle" onClick={toggleSidebar}>
                {expanded ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </div>
            <ul className="sidebar-menu">
                {filteredItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    if (item.action === 'logout') {
                        return (
                            <li
                                key={index}
                                className="sidebar-item logout-item"
                                onClick={handleLogout}
                            >
                                <Icon size={20} />
                                {expanded && <span className="sidebar-label">{item.label}</span>}
                            </li>
                        );
                    }
                    return (
                        <li
                            key={index}
                            className={`sidebar-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleNavigation(item.path)}
                            style={{ '--item-color': item.color }}
                        >
                            {/* NUEVO: div envolvente solo para el ícono del chat con badge */}
                            {item.label === 'Chat' ? (
                                <div style={{ position: 'relative', display: 'inline-flex' }}>
                                    <Icon size={15} />
                                    {item.badge > 0 && (
                                        <span className="sidebar-chat-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                                    )}
                                </div>
                            ) : (
                                <Icon size={20} />
                            )}
                            {expanded && <span className="sidebar-label">{item.label}</span>}
                        </li>
                    );
                })}
            </ul>
        </aside>
    );

    // Menú Móvil (también modificado para envolver solo el botón de chat)
    const MobileMenu = () => (
        <>
            <div
                className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
                onClick={toggleMobileMenu}
            />
            <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
                <div className="mobile-menu-handle">
                    <div className="handle-bar" />
                </div>
                <div className="mobile-menu-header">
                    <h3>Menú</h3>
                    <button className="mobile-menu-close" onClick={toggleMobileMenu}>
                        <X size={24} />
                    </button>
                </div>
                <div className="mobile-menu-items">
                    {filteredItems.map((item, index) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;

                        if (item.action === 'logout') {
                            return (
                                <div key={index} className="mobile-menu-item logout-mobile" onClick={handleLogout}>
                                    <div className="mobile-item-icon" style={{ backgroundColor: item.color + '20', color: item.color }}>
                                        <Icon size={22} />
                                    </div>
                                    <span className="mobile-item-label">{item.label}</span>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={index}
                                className={`mobile-menu-item ${isActive ? 'active' : ''}`}
                                onClick={() => handleNavigation(item.path)}
                            >
                                <div className="mobile-item-icon" style={{ backgroundColor: item.color + '20', color: item.color }}>
                                    {/* NUEVO: div envolvente solo para el ícono del chat en móvil */}
                                    {item.label === 'Chat' ? (
                                        <div style={{ position: 'relative' }}>
                                            <Icon size={22} />
                                            {item.badge > 0 && (
                                                <span className="sidebar-chat-badge mobile-badge">{item.badge > 99 ? '99+' : item.badge}</span>
                                            )}
                                        </div>
                                    ) : (
                                        <Icon size={22} />
                                    )}
                                </div>
                                <span className="mobile-item-label">{item.label}</span>
                                {isActive && <div className="active-indicator" />}
                            </div>
                        );
                    })}
                </div>
                {isAuthenticated && (
                    <div className="mobile-menu-footer">
                        <div className="user-info-mobile">
                            <div className="user-avatar-mobile">
                                {user?.displayName?.charAt(0) || user?.email?.charAt(0) || '?'}
                            </div>
                            <div className="user-details-mobile">
                                <span className="user-name-mobile">{user?.displayName || 'Usuario'}</span>
                                <span className="user-email-mobile">{user?.email}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );

    // Dropdown de notificaciones (sin cambios)
    const NotificationDropdown = () => (
        <div className="notification-wrapper" ref={notificationRef}>
            <button className="notification-btn" onClick={toggleNotifications}>
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
            </button>

            {showNotifications && (
                <div className="notifications-dropdown">
                    <div className="notifications-header">
                        <h4>Notificaciones</h4>
                        {unreadCount > 0 && (
                            <button onClick={handleMarkAllRead} className="mark-all-read">
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <div className="no-notifications">
                                <Bell size={32} />
                                <p>No hay notificaciones</p>
                            </div>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                    onClick={() => handleNotificationClick(notif)}
                                >
                                    <div className="notification-icon">
                                        {notif.type === 'follow' && <User size={16} />}
                                        {notif.type === 'comment' && <MessageCircle size={16} />}
                                        {notif.type === 'like' && <Heart size={16} />}
                                        {(notif.type === 'friend_request' || notif.type === 'friend_accepted') && <Users size={16} />}
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-text">
                                            <span className="notification-user">{notif.fromUserName}</span>
                                            {' '}{notif.message}
                                        </p>
                                        <span className="notification-time">{formatTime(notif.createdAt)}</span>
                                    </div>
                                    {!notif.read && <div className="notification-dot" />}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    // Dropdown de solicitudes (sin cambios)
    const RequestsDropdown = () => (
        <div className="notification-wrapper" ref={requestsRef}>
            <button className="notification-btn" onClick={toggleRequests} title="Solicitudes de amistad">
                <Users size={20} />
                {friendRequests.length > 0 && (
                    <span className="notification-badge">{friendRequests.length > 9 ? '9+' : friendRequests.length}</span>
                )}
            </button>

            {showRequests && (
                <div className="notifications-dropdown requests-dropdown">
                    <div className="notifications-header">
                        <h4>Solicitudes de amistad</h4>
                    </div>

                    {/* TABS */}
                    <div className="requests-tabs">
                        <button
                            className={`requests-tab ${activeRequestsTab === 'received' ? 'active' : ''}`}
                            onClick={() => setActiveRequestsTab('received')}
                        >
                            Recibidas
                            {friendRequests.length > 0 && <span className="requests-tab-badge">{friendRequests.length}</span>}
                        </button>
                        <button
                            className={`requests-tab ${activeRequestsTab === 'sent' ? 'active' : ''}`}
                            onClick={() => setActiveRequestsTab('sent')}
                        >
                            Enviadas
                            {sentRequests.length > 0 && <span className="requests-tab-badge sent">{sentRequests.length}</span>}
                        </button>
                    </div>

                    {/* CONTENIDO */}
                    <div className="notifications-list">
                        {activeRequestsTab === 'received' ? (
                            friendRequests.length === 0 ? (
                                <div className="no-notifications"><Users size={32} /><p>No hay solicitudes pendientes</p></div>
                            ) : (
                                friendRequests.map(req => (
                                    <div key={req.id} className="notification-item">
                                        <div className="notification-icon"><UserPlus size={16} /></div>
                                        <div className="notification-content">
                                            <p className="notification-text"><span className="notification-user">{req.fromUserName}</span></p>
                                            <span className="notification-subtext">@{req.fromUserShortId}</span>
                                        </div>
                                        <div className="request-actions-mini">
                                            <button className="accept-mini" onClick={() => handleAcceptRequest(req.id, req.fromUserId)}><UserCheck size={14} /></button>
                                            <button className="reject-mini" onClick={() => handleRejectRequest(req.id)}><X size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )
                        ) : (
                            loadingSent ? (
                                <div className="no-notifications"><p>Cargando...</p></div>
                            ) : sentRequests.length === 0 ? (
                                <div className="no-notifications"><Send size={32} /><p>No has enviado solicitudes</p></div>
                            ) : (
                                sentRequests.map(req => (
                                    <div key={req.id} className="notification-item sent-item">
                                        <div className="notification-icon"><Send size={16} /></div>
                                        <div className="notification-content">
                                            <p className="notification-text"><span className="notification-user">{req.toUserName}</span></p>
                                            <span className="notification-subtext">@{req.toUserShortId} · Pendiente</span>
                                        </div>
                                        <div className="request-actions-mini">
                                            <button className="reject-mini" onClick={() => handleCancelRequest(req.id, req.toUserId)} title="Cancelar solicitud">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    return (
        <>
            <nav className="navbar">
                <div className="navbar-left">
                    {isMobile && <button className="mobile-hamburger" onClick={toggleMobileMenu}><Menu size={24} /></button>}
                    <div className="navbar-logo" onClick={() => handleNavigation('/home')}><img src={GatoLogo} className='log-img'></img><span className="logo-text">TheSoCube</span></div>
                </div>
                <div className="navbar-right">
                    {isAuthenticated && (
                        <button className="navbar-icon-btn" onClick={handleOpenAddFriend} title="Agregar amigo"><Hash size={20} /></button>
                    )}
                    {isAuthenticated && <RequestsDropdown />}
                    {isAuthenticated && <NotificationDropdown />}
                    {!isMobile && (isAuthenticated ? (
                        <div className="user-badge"><span>{user?.displayName || user?.email}</span></div>
                    ) : (
                        <button className="navbar-login-btn" onClick={() => handleNavigation('/login')}>Iniciar sesión</button>
                    ))}
                </div>
            </nav>

            {!isMobile ? <DesktopSidebar /> : <MobileMenu />}

            {isMobile && isAuthenticated && (
                <button className="mobile-fab" onClick={() => handleNavigation('/crear-post')}><PlusSquare size={24} /></button>
            )}

            {/* Modal agregar amigo */}
            {showAddFriend && (
                <div className="modal-overlay" onClick={() => setShowAddFriend(false)}>
                    <div className="modal-content-m add-friend-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3><Hash size={20} />Agregar amigo por código</h3>
                            <button className="modal-close-btn" onClick={() => setShowAddFriend(false)}><X size={20} /></button>
                        </div>
                        <p className="add-friend-desc">Pídele su código a la persona que quieres agregar.</p>
                        <div className="add-friend-input-group">
                            <input type="text" className="add-friend-input" placeholder="ABC123" value={friendCode}
                                onChange={(e) => { setFriendCode(e.target.value.toUpperCase().slice(0, 6)); setSearchResult(null); setSearchError(''); setAddFriendSuccess(false); }}
                                onKeyDown={(e) => { if (e.key === 'Enter' && friendCode.length >= 3) handleSearchByCode(); }}
                                maxLength={6} autoFocus />
                            <button className="add-friend-search-btn" onClick={handleSearchByCode} disabled={friendCode.length < 3 || searching}>
                                {searching ? '...' : <><Search size={16} />Buscar</>}
                            </button>
                        </div>
                        {searchError && <p className="add-friend-error">{searchError}</p>}
                        {searchResult && (
                            <div className="search-result-card">
                                <div className="search-result-avatar" style={{ backgroundColor: searchResult.avatarColor }}>{searchResult.displayName?.charAt(0).toUpperCase()}</div>
                                <div className="search-result-info"><span className="search-result-name">{searchResult.displayName}</span><span className="search-result-id">@{searchResult.shortId}</span></div>
                                {addFriendSuccess ? (
                                    <button className="search-result-add-btn success" disabled><Send size={16} />Enviada</button>
                                ) : (
                                    <button className="search-result-add-btn" onClick={handleSendFriendRequest} disabled={sendingRequest}>
                                        {sendingRequest ? '...' : <><UserPlus size={16} />Agregar</>}
                                    </button>
                                )}
                            </div>
                        )}
                        <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                            <button className="modal-btn secondary" onClick={() => setShowAddFriend(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className={`toast-notification ${toast.type}`}><span>{toast.message}</span></div>}
        </>
    );
};

export default Navbar;