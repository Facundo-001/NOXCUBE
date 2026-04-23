import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/login.css';

const Login = () => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [birthDate, setBirthDate] = useState('');

    const { register, login, error, loading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isRegistering) {
                await register(email, password, displayName, birthDate);
            } else {
                await login(email, password);
            }
            navigate('/home');
        } catch (err) {
            // El error ya se maneja en el hook
        }
    };

    return (
        <div className="login-page">
            <div className="split-screen">
                {/* Panel del Formulario */}
                <div className={`form-panel ${isRegistering ? 'slide-right' : ''}`}>
                    <div className="form-wrapper">
                        <h1 className="form-title">
                            {isRegistering ? 'Crear cuenta' : 'Bienvenido de nuevo'}
                        </h1>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {isRegistering && (
                                <>
                                    <input
                                        type="text"
                                        placeholder="Nombre de usuario"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="input-field"
                                        required
                                        maxLength={20}
                                    />
                                    <input
                                        type="date"
                                        value={birthDate}
                                        onChange={(e) => setBirthDate(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                </>
                            )}

                            <input
                                type="email"
                                placeholder="Correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="input-field"
                                required
                            />

                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="input-field"
                                required
                                autoComplete={isRegistering ? 'new-password' : 'current-password'}
                            />

                            {error && <div className="error-message">{error}</div>}

                            <button 
                                type="submit" 
                                className="submit-button" 
                                disabled={loading}
                            >
                                {loading 
                                    ? 'Procesando...' 
                                    : isRegistering 
                                        ? 'Registrarse' 
                                        : 'Iniciar sesión'
                                }
                            </button>
                        </form>

                        <p className="toggle-link">
                            {isRegistering 
                                ? '¿Ya tienes una cuenta?' 
                                : '¿No tienes cuenta aún?'
                            }{' '}
                            <button
                                type="button"
                                onClick={() => setIsRegistering(!isRegistering)}
                                className="toggle-button"
                            >
                                {isRegistering ? 'Inicia sesión' : 'Regístrate gratis'}
                            </button>
                        </p>
                    </div>
                </div>

                {/* Panel decorativo / Imagen */}
                <div className={`image-panel ${isRegistering ? 'slide-left' : ''}`}>
                    <div className="image-content">
                        <h2>
                            {isRegistering 
                                ? 'Únete a la comunidad' 
                                : 'Conecta con el mundo'
                            }
                        </h2>
                        <p>
                            Comparte tus ideas, encuentra personas afines y forma parte de algo exclusivo.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;