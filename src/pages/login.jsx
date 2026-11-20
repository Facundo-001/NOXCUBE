import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import '../styles/login.css';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [resetEmail, setResetEmail] = useState('');

    const { register, login, resetPassword, error, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                await register(email.trim(), password, displayName.trim(), birthDate);
            } else {
                await login(email.trim(), password);
            }
            navigate('/home');
        } catch (err) {
            // El error ya se maneja en el hook
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        if (!resetEmail.trim()) return;

        try {
            await resetPassword(resetEmail.trim());
            setResetSent(true);
        } catch (err) {
            // El error ya se maneja en el hook
        }
    };

    const switchToLogin = () => {
        setIsRegistering(false);
        setShowForgotPassword(false);
        setResetSent(false);
    };

    const getErrorMessage = (errorMsg) => {
        const translations = {
            'auth/invalid-credential': 'Correo o contraseña incorrectos',
            'auth/user-not-found': 'No existe una cuenta con este correo',
            'auth/wrong-password': 'Contraseña incorrecta',
            'auth/too-many-requests': 'Demasiados intentos. Espera un momento',
            'auth/email-already-in-use': 'Este correo ya está registrado',
            'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
            'auth/invalid-email': 'Correo electrónico inválido',
            'auth/network-request-failed': 'Error de conexión. Revisa tu internet',
        };

        for (const [code, msg] of Object.entries(translations)) {
            if (errorMsg?.includes(code)) return msg;
        }
        return errorMsg || 'Error desconocido';
    };

    return (
        <div className="login-page">
            <div className="split-screen">
                {/* Panel del Formulario */}
                <div className={`form-panel ${isRegistering ? 'slide-right' : ''}`}>
                    <div className="form-wrapper">
                        {/* Logo */}
                        <div className="form-logo" onClick={() => navigate('/home')}>
                            <Sparkles size={28} />
                            <span>NoxCube</span>
                        </div>

                        {showForgotPassword ? (
                            /* ==================== FORMULARIO DE RECUPERACIÓN ==================== */
                            <>
                                <div className="form-header">
                                    <h1 className="form-title">Recuperar contraseña</h1>
                                    <p className="form-subtitle">
                                        Ingresa tu correo y te enviaremos un enlace para restablecerla.
                                    </p>
                                </div>

                                {resetSent ? (
                                    <div className="reset-success">
                                        <div className="success-icon">
                                            <CheckCircle size={56} />
                                        </div>
                                        <h3>¡Correo enviado!</h3>
                                        <p>
                                            Revisa <strong>{resetEmail}</strong>. Te hemos enviado un enlace
                                            para restablecer tu contraseña.
                                        </p>
                                        <p className="reset-spam">Si no lo ves, revisa tu carpeta de spam.</p>
                                        <a
                                            href="https://mail.google.com/mail/u/0/#inbox"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="gmail-link"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                                            </svg>
                                            Abrir Gmail
                                        </a>
                                        <button
                                            type="button"
                                            className="submit-button"
                                            onClick={switchToLogin}
                                        >
                                            Volver a Iniciar sesión
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleResetPassword} className="auth-form">
                                        <div className="input-group">
                                            <Mail size={18} className="input-icon" />
                                            <input
                                                type="email"
                                                placeholder="Correo electrónico"
                                                value={resetEmail}
                                                onChange={(e) => setResetEmail(e.target.value)}
                                                className="input-field with-icon"
                                                required
                                                autoFocus
                                            />
                                        </div>

                                        {error && (
                                            <div className="error-message">
                                                <AlertCircle size={16} />
                                                <span>{getErrorMessage(error)}</span>
                                            </div>
                                        )}

                                        <button
                                            type="submit"
                                            className="submit-button"
                                            disabled={loading || !resetEmail.trim()}
                                        >
                                            {loading ? 'Enviando...' : (
                                                <>
                                                    Enviar enlace
                                                    <ArrowRight size={18} />
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            className="text-link"
                                            onClick={switchToLogin}
                                        >
                                            ← Volver a Iniciar sesión
                                        </button>
                                    </form>
                                )}
                            </>
                        ) : (
                            /* ==================== FORMULARIO LOGIN / REGISTER ==================== */
                            <>
                                <div className="form-header">
                                    <h1 className="form-title">
                                        {isRegistering ? 'Crear cuenta' : 'Bienvenido de nuevo'}
                                    </h1>
                                    <p className="form-subtitle">
                                        {isRegistering
                                            ? 'Únete a la comunidad y comparte tus ideas'
                                            : 'Ingresa tus credenciales para continuar'}
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="auth-form">
                                    {isRegistering && (
                                        <>
                                            <div className="input-group">
                                                <User size={18} className="input-icon" />
                                                <input
                                                    type="text"
                                                    placeholder="Nombre de usuario"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    className="input-field with-icon"
                                                    required
                                                    maxLength={20}
                                                    autoComplete="username"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <Calendar size={18} className="input-icon" />
                                                <input
                                                    type="date"
                                                    value={birthDate}
                                                    onChange={(e) => setBirthDate(e.target.value)}
                                                    className="input-field with-icon"
                                                    required
                                                />
                                            </div>
                                        </>
                                    )}

                                    <div className="input-group">
                                        <Mail size={18} className="input-icon" />
                                        <input
                                            type="email"
                                            placeholder="Correo electrónico"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="input-field with-icon"
                                            required
                                            autoComplete="email"
                                        />
                                    </div>

                                    <div className="input-group">
                                        <Lock size={18} className="input-icon" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Contraseña"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="input-field with-icon"
                                            required
                                            minLength={6}
                                            autoComplete={isRegistering ? 'new-password' : 'current-password'}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {error && (
                                        <div className="error-message">
                                            <AlertCircle size={16} />
                                            <span>{getErrorMessage(error)}</span>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        className="submit-button"
                                        disabled={loading}
                                    >
                                        {loading ? 'Procesando...' : (
                                            isRegistering ? (
                                                <>
                                                    Crear cuenta
                                                    <ArrowRight size={18} />
                                                </>
                                            ) : (
                                                <>
                                                    Iniciar sesión
                                                    <ArrowRight size={18} />
                                                </>
                                            )
                                        )}
                                    </button>

                                    {!isRegistering && (
                                        <button
                                            type="button"
                                            className="text-link"
                                            onClick={() => {
                                                setShowForgotPassword(true);
                                                setResetEmail(email);
                                                setResetSent(false);
                                            }}
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
                                    )}
                                </form>

                                <div className="toggle-section">
                                    <span className="toggle-text">
                                        {isRegistering
                                            ? '¿Ya tienes una cuenta?'
                                            : '¿No tienes cuenta aún?'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsRegistering(!isRegistering);
                                            setShowForgotPassword(false);
                                            setResetSent(false);
                                        }}
                                        className="toggle-button"
                                    >
                                        {isRegistering ? 'Inicia sesión' : 'Regístrate gratis'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Panel decorativo */}
                <div className={`image-panel ${isRegistering ? 'slide-left' : ''}`}>
                    <div className="image-content">
                        <h2>
                            {showForgotPassword
                                ? 'No te preocupes'
                                : isRegistering
                                    ? 'Únete a la comunidad'
                                    : 'Conecta con el mundo'}
                        </h2>
                        <p>
                            {showForgotPassword
                                ? 'A todos nos pasa. Te ayudamos a recuperar tu acceso en segundos.'
                                : 'Comparte tus ideas, encuentra personas afines y forma parte de algo exclusivo.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;