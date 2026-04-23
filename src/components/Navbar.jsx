import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    Home, 
    User, 
    LogIn, 
    LogOut, 
    PlusSquare, 
    Settings, 
    ChevronLeft, 
    ChevronRight,
    Menu,
    X,
    ChevronUp,
    Bell
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../service/notificationService';
import '../styles/Navbar.css';

const Navbar = () => {
    const [expanded, setExpanded] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // ==================== NUEVO: ESTADOS DE NOTIFICACIONES ====================
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const notificationRef = useRef(null);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // ==================== NUEVO: SUSCRIPCIÓN A NOTIFICACIONES ====================
    useEffect(() => {
        if (user && !user.isAnonymous) {
            const unsubscribe = subscribeToNotifications(user.uid, (notifs) => {
                setNotifications(notifs);
                setUnreadCount(notifs.filter(n => !n.read).length);
            });
            return unsubscribe;
        }
    }, [user]);

    // ==================== NUEVO: CERRAR NOTIFICACIONES AL HACER CLIC FUERA ====================
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Cerrar menú móvil al navegar
    useEffect(() => {
        setMobileMenuOpen(false);
        setExpanded(false);
        setShowNotifications(false);
    }, [location.pathname]);

    const toggleSidebar = () => setExpanded(!expanded);
    const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
    const toggleNotifications = () => setShowNotifications(!showNotifications);

    const handleLogout = async () => {
        await logout();
        navigate('/home');
        setExpanded(false);
        setMobileMenuOpen(false);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setExpanded(false);
        setMobileMenuOpen(false);
    };

    // ==================== NUEVO: MANEJAR NOTIFICACIONES ====================
    const handleNotificationClick = async (notification) => {
        if (!notification.read) {
            await markNotificationAsRead(user.uid, notification.id);
        }
        
        // Navegar según el tipo de notificación
        if (notification.type === 'follow') {
            navigate(`/perfil/${notification.fromUserId}`);
        } else if (notification.type === 'comment' || notification.type === 'like') {
            navigate(`/post/${notification.postId}`);
        }
        
        setShowNotifications(false);
    };

    const handleMarkAllRead = async () => {
        await markAllNotificationsAsRead(user.uid);
    };

    const formatNotificationTime = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffMins = Math.floor((now - date) / 60000);
            
            if (diffMins < 1) return 'Ahora';
            if (diffMins < 60) return `Hace ${diffMins}m`;
            if (diffMins < 1440) return `Hace ${Math.floor(diffMins / 60)}h`;
            return `Hace ${Math.floor(diffMins / 1440)}d`;
        } catch (err) {
            return '';
        }
    };

    useEffect(() => {
        const sidebarWidth = expanded ? '280px' : '80px';
        document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
    }, [expanded]);

    const isAuthenticated = user && !user.isAnonymous;

    const menuItems = [
        { path: '/home', icon: Home, label: 'Home', showWhenAuth: null, color: '#C3A44B' },
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

    // Sidebar para Desktop
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
                                className={`sidebar-item logout-item`} 
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
                            <Icon size={20} />
                            {expanded && <span className="sidebar-label">{item.label}</span>}
                        </li>
                    );
                })}
            </ul>
        </aside>
    );

    // Menú Móvil Premium (Bottom Sheet)
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
                                <div
                                    key={index}
                                    className="mobile-menu-item logout-mobile"
                                    onClick={handleLogout}
                                >
                                    <div className="mobile-item-icon" style={{ backgroundColor: item.color + '20', color: item.color }}>
                                        <Icon size={22} />
                                    </div>
                                    <span className="mobile-item-label">{item.label}</span>
                                    <ChevronUp size={18} className="mobile-item-arrow" />
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
                                    <Icon size={22} />
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

    // ==================== NUEVO: COMPONENTE DE NOTIFICACIONES ====================
    const NotificationDropdown = () => (
        <div className="notification-wrapper" ref={notificationRef}>
            <button 
                className="notification-btn"
                onClick={toggleNotifications}
            >
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
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-text">
                                            <span className="notification-user">{notif.fromUserName}</span>
                                            {' '}{notif.message}
                                        </p>
                                        <span className="notification-time">
                                            {formatNotificationTime(notif.createdAt)}
                                        </span>
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

    // Necesitamos importar MessageCircle y Heart para las notificaciones
    // Ya están arriba en los imports

    return (
        <>
            {/* Navbar Superior */}
            <nav className="navbar">
                <div className="navbar-left">
                    {isMobile && (
                        <button className="mobile-hamburger" onClick={toggleMobileMenu}>
                            <Menu size={24} />
                        </button>
                    )}
                    <div className="navbar-logo" onClick={() => handleNavigation('/home')}>
                        <span className="logo-text">NoxCube</span>
                    </div>
                </div>
                
                <div className="navbar-right">
                    {/* ==================== NUEVO: BOTÓN DE NOTIFICACIONES ==================== */}
                    {isAuthenticated && <NotificationDropdown />}
                    
                    {!isMobile && (
                        isAuthenticated ? (
                            <div className="user-badge">
                                <span>{user?.displayName || user?.email}</span>
                            </div>
                        ) : (
                            <button 
                                className="navbar-login-btn"
                                onClick={() => handleNavigation('/login')}
                            >
                                Iniciar sesión
                            </button>
                        )
                    )}
                </div>
            </nav>

            {/* Sidebar Desktop o Menú Móvil */}
            {!isMobile ? <DesktopSidebar /> : <MobileMenu />}
            
            {/* Botón flotante para crear post (móvil) */}
            {isMobile && isAuthenticated && (
                <button 
                    className="mobile-fab"
                    onClick={() => handleNavigation('/crear-post')}
                >
                    <PlusSquare size={24} />
                </button>
            )}
        </>
    );
};

export default Navbar;