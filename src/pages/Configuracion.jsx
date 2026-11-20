import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import {
    User, Mail, Lock, Shield, Bell, Eye, EyeOff, Globe, Palette,
    Moon, Sun, Smartphone, Key, Trash2, Download, LogOut, AlertCircle,
    CheckCircle, Copy, Cookie, History, Users, MessageCircle, Heart,
    Ban, Volume2, VolumeX, Monitor, SmartphoneCharging, Wifi, Cloud,
    FileText, Image, Camera, Mic, MapPin, Clock, Database, RefreshCw,
    Sliders, ToggleLeft, ToggleRight, ChevronRight, ArrowLeft, Save,
    ShieldCheck, ShieldAlert, Fingerprint, Scan, QrCode, Radio,
    MailOpen, AtSign, FileJson, HardDrive
} from 'lucide-react';
import {
    updateProfile, updateEmail, updatePassword,
    EmailAuthProvider, reauthenticateWithCredential,
    sendPasswordResetEmail, sendEmailVerification,
    deleteUser, signOut
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { updateUserProfile, getUserProfile } from '../service/userService';
import { 
    subscribeToNotifications, 
    markAllNotificationsAsRead,
    getUnreadCount 
} from '../service/notificationService';
import '../styles/Configuracion.css';

const Configuracion = () => {
    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState('cuenta');
    const [toast, setToast] = useState(null);
    const [loading, setLoading] = useState(false);

    // Cuenta
    const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
    const [bio, setBio] = useState(userProfile?.bio || '');
    const [newEmail, setNewEmail] = useState('');
    const [emailVerified, setEmailVerified] = useState(user?.emailVerified || false);

    // Contraseña
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Notificaciones
    const [unreadCount, setUnreadCount] = useState(0);

    // Configuraciones guardadas en localStorage
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('noxcube-settings');
        return saved ? JSON.parse(saved) : {
            notifications: true,
            soundEffects: true,
            emailDigest: false,
            showOnlineStatus: true,
            readReceipts: true,
            privateProfile: false,
            hideActivity: false,
            allowFriendRequests: true,
            allowMessages: true,
            allowComments: true,
            dataSaver: false,
            autoDownload: true,
        };
    });

    // Guardar settings en localStorage cuando cambien
    useEffect(() => {
        localStorage.setItem('noxcube-settings', JSON.stringify(settings));
    }, [settings]);

    // Verificar email
    useEffect(() => {
        if (user) {
            setEmailVerified(user.emailVerified);
        }
    }, [user]);

    // Contador de notificaciones
    useEffect(() => {
        if (user && !user.isAnonymous) {
            getUnreadCount(user.uid).then(setUnreadCount);
        }
    }, [user]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ==================== ACTUALIZAR PERFIL ====================
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) return;
        setLoading(true);
        try {
            await updateProfile(auth.currentUser, { displayName: displayName.trim() });
            await updateUserProfile(user.uid, { 
                displayName: displayName.trim(),
                bio: bio.trim() 
            });
            showToast('✅ Perfil actualizado correctamente');
        } catch (error) {
            showToast('❌ Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ==================== CAMBIAR EMAIL ====================
    const handleUpdateEmail = async (e) => {
        e.preventDefault();
        if (!newEmail.trim()) return;
        setLoading(true);
        try {
            await updateEmail(auth.currentUser, newEmail.trim());
            await updateUserProfile(user.uid, { email: newEmail.trim() });
            showToast('✅ Email actualizado. Verifica tu nueva bandeja.');
            setNewEmail('');
        } catch (error) {
            if (error.code === 'auth/requires-recent-login') {
                showToast('🔐 Por seguridad, cierra sesión y vuelve a iniciar.', 'error');
            } else {
                showToast('❌ Error: ' + error.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== VERIFICAR EMAIL ====================
    const handleVerifyEmail = async () => {
        if (!user || emailVerified) return;
        setLoading(true);
        try {
            await sendEmailVerification(auth.currentUser);
            showToast('📧 Email de verificación enviado. Revisa tu bandeja.');
        } catch (error) {
            showToast('❌ Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ==================== CAMBIAR CONTRASEÑA ====================
    const handleUpdatePassword = async (e) => {
        e.preventDefault();
        if (!currentPassword || !newPassword || !confirmPassword) return;
        if (newPassword !== confirmPassword) {
            showToast('❌ Las contraseñas no coinciden', 'error');
            return;
        }
        if (newPassword.length < 8) {
            showToast('❌ La contraseña debe tener al menos 8 caracteres', 'error');
            return;
        }
        setLoading(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(auth.currentUser, credential);
            await updatePassword(auth.currentUser, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showToast('✅ Contraseña actualizada correctamente');
        } catch (error) {
            if (error.code === 'auth/wrong-password') {
                showToast('❌ Contraseña actual incorrecta', 'error');
            } else {
                showToast('❌ Error: ' + error.message, 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== OLVIDÉ CONTRASEÑA ====================
    const handleResetPassword = async () => {
        if (!user?.email) return;
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, user.email);
            showToast('📧 Enlace de restablecimiento enviado a tu email');
        } catch (error) {
            showToast('❌ Error: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    // ==================== TOGGLE SETTINGS ====================
    const toggleSetting = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
        
        const messages = {
            notifications: settings.notifications ? '🔕 Notificaciones desactivadas' : '🔔 Notificaciones activadas',
            soundEffects: settings.soundEffects ? '🔇 Sonidos desactivados' : '🔊 Sonidos activados',
            privateProfile: settings.privateProfile ? '🌐 Perfil público' : '🔒 Perfil privado',
            dataSaver: settings.dataSaver ? '📶 Modo normal activado' : '📉 Modo ahorro de datos activado',
        };
        if (messages[key]) showToast(messages[key]);
    };

    // ==================== MARCAR NOTIFICACIONES LEÍDAS ====================
    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsAsRead(user.uid);
            setUnreadCount(0);
            showToast('✅ Todas las notificaciones marcadas como leídas');
        } catch (error) {
            showToast('❌ Error al marcar notificaciones', 'error');
        }
    };

    // ==================== LIMPIAR CACHÉ ====================
    const handleClearCache = () => {
        const before = localStorage.length;
        // Solo limpiar caché, no settings
        const settingsBackup = localStorage.getItem('noxcube-settings');
        localStorage.clear();
        if (settingsBackup) localStorage.setItem('noxcube-settings', settingsBackup);
        const after = localStorage.length;
        showToast(`🧹 Caché limpiada (${before - after} elementos eliminados)`);
    };

    // ==================== DESCARGAR DATOS ====================
    const handleDownloadData = async () => {
        setLoading(true);
        try {
            const profile = await getUserProfile(user.uid);
            const data = {
                perfil: profile,
                settings: settings,
                exportado: new Date().toISOString(),
            };
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `noxcube-datos-${user.uid.slice(0, 8)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('📦 Datos descargados correctamente');
        } catch (error) {
            showToast('❌ Error al descargar datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    // ==================== CERRAR SESIÓN ====================
    const handleLogout = async () => {
        await logout();
        navigate('/home');
    };

    // ==================== ELIMINAR CUENTA ====================
    const handleDeleteAccount = async () => {
        if (window.confirm('⚠️ ¿Estás ABSOLUTAMENTE seguro? Esta acción NO se puede deshacer. Todos tus posts, comentarios, chats y datos se perderán PARA SIEMPRE.')) {
            if (window.confirm('🗑️ ÚLTIMA CONFIRMACIÓN: ¿Eliminar tu cuenta de NoxCube DEFINITIVAMENTE?')) {
                setLoading(true);
                try {
                    await deleteUser(auth.currentUser);
                    localStorage.clear();
                    showToast('Cuenta eliminada. Te extrañaremos 💔');
                    setTimeout(() => navigate('/home'), 2000);
                } catch (error) {
                    if (error.code === 'auth/requires-recent-login') {
                        showToast('🔐 Por seguridad, cierra sesión y vuelve a iniciar antes de eliminar la cuenta.', 'error');
                    } else {
                        showToast('❌ Error: ' + error.message, 'error');
                    }
                } finally {
                    setLoading(false);
                }
            }
        }
    };

    // ==================== COPIAR ID ====================
    const handleCopyId = async () => {
        try {
            await navigator.clipboard.writeText(userProfile?.shortId || '');
            showToast('📋 ID copiado: ' + userProfile?.shortId);
        } catch {
            showToast('❌ Error al copiar', 'error');
        }
    };

    // ==================== ACTUALIZAR ESTADO EMAIL ====================
    const handleRefreshEmailStatus = async () => {
        await auth.currentUser?.reload();
        setEmailVerified(auth.currentUser?.emailVerified || false);
        showToast('🔄 Estado de email actualizado');
    };

    if (!user || user.isAnonymous) {
        return (
            <>
                <Navbar />
                <main className="config-container">
                    <div className="config-empty">
                        <AlertCircle size={48} />
                        <h2>Inicia sesión para acceder</h2>
                        <p>Necesitas una cuenta para configurar tus preferencias</p>
                        <button className="config-btn-primary" onClick={() => navigate('/login')}>Iniciar Sesión</button>
                    </div>
                </main>
            </>
        );
    }

    const sections = [
        { id: 'cuenta', icon: User, label: 'Cuenta' },
        { id: 'seguridad', icon: Shield, label: 'Seguridad' },
        { id: 'privacidad', icon: Eye, label: 'Privacidad' },
        { id: 'notificaciones', icon: Bell, label: 'Notificaciones' },
        { id: 'apariencia', icon: Palette, label: 'Apariencia' },
        { id: 'datos', icon: Database, label: 'Datos' },
    ];

    return (
        <>
            <Navbar />
            <main className="config-container">
                <button className="config-back-btn" onClick={() => navigate('/home')}>
                    <ArrowLeft size={18} /> Volver
                </button>

                <div className="config-layout">
                    <nav className="config-nav">
                        <h2 className="config-nav-title">Configuración</h2>
                        {sections.map(section => (
                            <button
                                key={section.id}
                                className={`config-nav-item ${activeSection === section.id ? 'active' : ''}`}
                                onClick={() => setActiveSection(section.id)}
                            >
                                <section.icon size={18} />
                                <span>{section.label}</span>
                                <ChevronRight size={16} className="nav-arrow" />
                            </button>
                        ))}
                    </nav>

                    <div className="config-content">
                        {/* ==================== CUENTA ==================== */}
                        {activeSection === 'cuenta' && (
                            <div className="config-section">
                                <h3 className="section-title"><User size={20} /> Información de la cuenta</h3>

                                <form onSubmit={handleUpdateProfile} className="config-form">
                                    <div className="form-group">
                                        <label>Nombre de usuario</label>
                                        <div className="input-with-icon">
                                            <User size={16} className="input-icon-left" />
                                            <input
                                                type="text" value={displayName}
                                                onChange={(e) => setDisplayName(e.target.value)}
                                                className="config-input" maxLength={20}
                                                placeholder="Tu nombre público"
                                            />
                                        </div>
                                        <span className="input-hint">{displayName.length}/20 caracteres</span>
                                    </div>

                                    <div className="form-group">
                                        <label>Bio</label>
                                        <div className="input-with-icon">
                                            <FileText size={16} className="input-icon-left" />
                                            <input
                                                type="text" value={bio}
                                                onChange={(e) => setBio(e.target.value)}
                                                className="config-input" maxLength={150}
                                                placeholder="Cuéntanos sobre ti..."
                                            />
                                        </div>
                                        <span className="input-hint">{bio.length}/150 caracteres</span>
                                    </div>

                                    <div className="form-group">
                                        <label>Email actual</label>
                                        <div className="input-with-icon">
                                            <Mail size={16} className="input-icon-left" />
                                            <input type="email" value={user.email || ''} disabled className="config-input disabled" />
                                            {emailVerified ? (
                                                <span className="verified-badge"><CheckCircle size={14} /> Verificado</span>
                                            ) : (
                                                <span className="unverified-badge"><AlertCircle size={14} /> No verificado</span>
                                            )}
                                        </div>
                                        {!emailVerified && (
                                            <div className="email-actions">
                                                <button type="button" className="config-btn-secondary-small" onClick={handleVerifyEmail}>
                                                    <MailOpen size={14} /> Verificar email
                                                </button>
                                                <button type="button" className="config-btn-secondary-small" onClick={handleRefreshEmailStatus}>
                                                    <RefreshCw size={14} /> Actualizar estado
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <div className="form-group">
                                        <label>Cambiar email</label>
                                        <div className="input-row">
                                            <div className="input-with-icon" style={{ flex: 1 }}>
                                                <AtSign size={16} className="input-icon-left" />
                                                <input
                                                    type="email" value={newEmail}
                                                    onChange={(e) => setNewEmail(e.target.value)}
                                                    className="config-input" placeholder="nuevo@email.com"
                                                />
                                            </div>
                                            <button type="button" className="config-btn-secondary" onClick={handleUpdateEmail} disabled={loading || !newEmail.trim()}>
                                                {loading ? '...' : 'Cambiar'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>ID de usuario</label>
                                        <div className="id-display">
                                            <code>{userProfile?.shortId || 'Cargando...'}</code>
                                            <button type="button" className="icon-btn" onClick={handleCopyId} title="Copiar ID"><Copy size={14} /></button>
                                        </div>
                                    </div>

                                    <button type="submit" className="config-btn-primary" disabled={loading || !displayName.trim()}>
                                        <Save size={16} /> {loading ? 'Guardando...' : 'Guardar cambios'}
                                    </button>
                                </form>

                                <div className="divider" />

                                <div className="danger-zone">
                                    <h4><AlertCircle size={18} /> Zona de peligro</h4>
                                    <p>Estas acciones afectan permanentemente tu cuenta.</p>
                                    <div className="danger-actions">
                                        <button className="config-btn-danger" onClick={handleLogout}>
                                            <LogOut size={16} /> Cerrar sesión en este dispositivo
                                        </button>
                                        <button className="config-btn-danger-outline" onClick={handleDeleteAccount} disabled={loading}>
                                            <Trash2 size={16} /> Eliminar cuenta permanentemente
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== SEGURIDAD ==================== */}
                        {activeSection === 'seguridad' && (
                            <div className="config-section">
                                <h3 className="section-title"><Shield size={20} /> Seguridad y contraseña</h3>

                                <form onSubmit={handleUpdatePassword} className="config-form">
                                    <div className="form-group">
                                        <label>Contraseña actual</label>
                                        <div className="input-with-icon">
                                            <Lock size={16} className="input-icon-left" />
                                            <input
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                                className="config-input" placeholder="••••••••"
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Nueva contraseña</label>
                                        <div className="input-with-icon">
                                            <Lock size={16} className="input-icon-left" />
                                            <input
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                                className="config-input" placeholder="Mínimo 8 caracteres"
                                            />
                                            <button type="button" className="password-toggle" onClick={() => setShowNewPassword(!showNewPassword)}>
                                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Confirmar nueva contraseña</label>
                                        <div className="input-with-icon">
                                            <Lock size={16} className="input-icon-left" />
                                            <input
                                                type="password" value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="config-input" placeholder="Repite la contraseña"
                                            />
                                        </div>
                                    </div>

                                    <div className="password-actions">
                                        <button type="submit" className="config-btn-primary" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
                                            <Save size={16} /> {loading ? 'Actualizando...' : 'Cambiar contraseña'}
                                        </button>
                                        <button type="button" className="config-btn-secondary" onClick={handleResetPassword} disabled={loading}>
                                            <Mail size={16} /> Enviar reseteo por email
                                        </button>
                                    </div>
                                </form>

                                <div className="divider" />

                                <div className="settings-list">
                                    <h4>Autenticación avanzada</h4>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <QrCode size={20} />
                                            <div>
                                                <span className="setting-label">Autenticación en dos pasos (2FA)</span>
                                                <span className="setting-desc">Añade una capa extra de seguridad con Google Authenticator</span>
                                            </div>
                                        </div>
                                        <span className="setting-badge coming-soon">Próximamente</span>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Fingerprint size={20} />
                                            <div>
                                                <span className="setting-label">Bloqueo biométrico</span>
                                                <span className="setting-desc">Usa tu huella digital o reconocimiento facial</span>
                                            </div>
                                        </div>
                                        <span className="setting-badge coming-soon">Próximamente</span>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Key size={20} />
                                            <div>
                                                <span className="setting-label">Claves de acceso (Passkeys)</span>
                                                <span className="setting-desc">Inicia sesión sin contraseña con tu dispositivo</span>
                                            </div>
                                        </div>
                                        <span className="setting-badge coming-soon">Próximamente</span>
                                    </div>
                                </div>

                                <div className="divider" />

                                <div className="settings-list">
                                    <h4>Sesiones activas</h4>
                                    <div className="session-item">
                                        <div className="setting-left">
                                            <Monitor size={18} />
                                            <div>
                                                <span className="setting-label">Dispositivo actual</span>
                                                <span className="setting-desc">{navigator.userAgentData?.platform || navigator.platform || 'Desconocido'} • {navigator.language}</span>
                                            </div>
                                        </div>
                                        <span className="session-active">Activo ahora</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== PRIVACIDAD ==================== */}
                        {activeSection === 'privacidad' && (
                            <div className="config-section">
                                <h3 className="section-title"><Eye size={20} /> Privacidad y visibilidad</h3>

                                <div className="settings-list">
                                    <div className="setting-item" onClick={() => toggleSetting('privateProfile')}>
                                        <div className="setting-left">
                                            <Shield size={20} />
                                            <div>
                                                <span className="setting-label">Perfil privado</span>
                                                <span className="setting-desc">Solo tus amigos pueden ver tus posts completos</span>
                                            </div>
                                        </div>
                                        {settings.privateProfile ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>

                                    <div className="setting-item" onClick={() => toggleSetting('hideActivity')}>
                                        <div className="setting-left">
                                            <Clock size={20} />
                                            <div>
                                                <span className="setting-label">Ocultar estado de actividad</span>
                                                <span className="setting-desc">No mostrar cuándo fue tu última conexión</span>
                                            </div>
                                        </div>
                                        {settings.hideActivity ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>

                                    <div className="setting-item" onClick={() => toggleSetting('allowFriendRequests')}>
                                        <div className="setting-left">
                                            <Users size={20} />
                                            <div>
                                                <span className="setting-label">Permitir solicitudes de amistad</span>
                                                <span className="setting-desc">Cualquiera puede enviarte una solicitud</span>
                                            </div>
                                        </div>
                                        {settings.allowFriendRequests ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>

                                    <div className="setting-item" onClick={() => toggleSetting('allowMessages')}>
                                        <div className="setting-left">
                                            <MessageCircle size={20} />
                                            <div>
                                                <span className="setting-label">Permitir mensajes directos</span>
                                                <span className="setting-desc">Recibir mensajes de otros usuarios</span>
                                            </div>
                                        </div>
                                        {settings.allowMessages ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>

                                    <div className="setting-item" onClick={() => toggleSetting('allowComments')}>
                                        <div className="setting-left">
                                            <FileText size={20} />
                                            <div>
                                                <span className="setting-label">Permitir comentarios en tus posts</span>
                                                <span className="setting-desc">Otros pueden comentar en tu contenido</span>
                                            </div>
                                        </div>
                                        {settings.allowComments ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== NOTIFICACIONES ==================== */}
                        {activeSection === 'notificaciones' && (
                            <div className="config-section">
                                <h3 className="section-title"><Bell size={20} /> Preferencias de notificaciones</h3>

                                <div className="notif-stats">
                                    <div className="notif-stat">
                                        <span className="notif-stat-value">{unreadCount}</span>
                                        <span className="notif-stat-label">Sin leer</span>
                                    </div>
                                    <button className="config-btn-secondary-small" onClick={handleMarkAllRead}>
                                        <CheckCircle size={14} /> Marcar todas leídas
                                    </button>
                                </div>

                                <div className="divider" />

                                <div className="settings-list">
                                    <div className="setting-item" onClick={() => toggleSetting('notifications')}>
                                        <div className="setting-left">
                                            <Bell size={20} />
                                            <div>
                                                <span className="setting-label">Notificaciones push</span>
                                                <span className="setting-desc">Recibe alertas de actividad en tiempo real</span>
                                            </div>
                                        </div>
                                        {settings.notifications ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>

                                    <div className="setting-item" onClick={() => toggleSetting('soundEffects')}>
                                        <div className="setting-left">
                                            {settings.soundEffects ? <Volume2 size={20} /> : <VolumeX size={20} />}
                                            <div>
                                                <span className="setting-label">Efectos de sonido</span>
                                                <span className="setting-desc">Reproducir sonido al recibir mensajes</span>
                                            </div>
                                        </div>
                                        {settings.soundEffects ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>

                                    <div className="setting-item" onClick={() => toggleSetting('emailDigest')}>
                                        <div className="setting-left">
                                            <MailOpen size={20} />
                                            <div>
                                                <span className="setting-label">Resumen por email</span>
                                                <span className="setting-desc">Recibe un resumen semanal de tu actividad</span>
                                            </div>
                                        </div>
                                        {settings.emailDigest ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== APARIENCIA ==================== */}
                        {activeSection === 'apariencia' && (
                            <div className="config-section">
                                <h3 className="section-title"><Palette size={20} /> Apariencia y temas</h3>

                                <div className="settings-list">
                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Moon size={20} />
                                            <div>
                                                <span className="setting-label">Tema oscuro clásico</span>
                                                <span className="setting-desc">Diseño refinado con toques dorados</span>
                                            </div>
                                        </div>
                                        <div className="theme-active-badge">
                                            <CheckCircle size={16} /> Activo
                                        </div>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Sun size={20} />
                                            <div>
                                                <span className="setting-label">Tema claro</span>
                                                <span className="setting-desc">Disponible próximamente</span>
                                            </div>
                                        </div>
                                        <span className="setting-badge coming-soon">Próximamente</span>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Smartphone size={20} />
                                            <div>
                                                <span className="setting-label">Tema del sistema</span>
                                                <span className="setting-desc">Sigue automáticamente el tema de tu dispositivo</span>
                                            </div>
                                        </div>
                                        <span className="setting-badge coming-soon">Próximamente</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ==================== DATOS ==================== */}
                        {activeSection === 'datos' && (
                            <div className="config-section">
                                <h3 className="section-title"><Database size={20} /> Datos y almacenamiento</h3>

                                <div className="settings-list">
                                    <div className="setting-item" onClick={() => toggleSetting('dataSaver')}>
                                        <div className="setting-left">
                                            <Wifi size={20} />
                                            <div>
                                                <span className="setting-label">Modo ahorro de datos</span>
                                                <span className="setting-desc">Reduce calidad de imágenes y descargas</span>
                                            </div>
                                        </div>
                                        {settings.dataSaver ? <ToggleRight size={28} className="toggle-on" /> : <ToggleLeft size={28} className="toggle-off" />}
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Download size={20} />
                                            <div>
                                                <span className="setting-label">Descargar mis datos</span>
                                                <span className="setting-desc">Obtén una copia de tu información en formato JSON</span>
                                            </div>
                                        </div>
                                        <button className="config-btn-secondary-small" onClick={handleDownloadData} disabled={loading}>
                                            <FileJson size={14} /> {loading ? '...' : 'Exportar'}
                                        </button>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Cloud size={20} />
                                            <div>
                                                <span className="setting-label">Copia de seguridad en la nube</span>
                                                <span className="setting-desc">Respaldar chats y configuraciones automáticamente</span>
                                            </div>
                                        </div>
                                        <span className="setting-badge coming-soon">Próximamente</span>
                                    </div>

                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <RefreshCw size={20} />
                                            <div>
                                                <span className="setting-label">Sincronización</span>
                                                <span className="setting-desc">Tus datos se sincronizan en tiempo real</span>
                                            </div>
                                        </div>
                                        <span className="session-active">Sincronizado</span>
                                    </div>
                                </div>

                                <div className="divider" />

                                <div className="settings-list">
                                    <h4>Cookies y caché local</h4>
                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <Cookie size={20} />
                                            <div>
                                                <span className="setting-label">Cookies esenciales</span>
                                                <span className="setting-desc">Necesarias para el funcionamiento de la aplicación</span>
                                            </div>
                                        </div>
                                        <span className="session-active">Activas</span>
                                    </div>
                                    <div className="setting-item">
                                        <div className="setting-left">
                                            <HardDrive size={20} />
                                            <div>
                                                <span className="setting-label">Limpiar caché local</span>
                                                <span className="setting-desc">Elimina datos temporales y libera espacio</span>
                                            </div>
                                        </div>
                                        <button className="config-btn-secondary-small" onClick={handleClearCache}>
                                            <Trash2 size={14} /> Limpiar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {toast && (
                    <div className={`config-toast ${toast.type}`}>
                        <span>{toast.message}</span>
                    </div>
                )}
            </main>
        </>
    );
};

export default Configuracion;