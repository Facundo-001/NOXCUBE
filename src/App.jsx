import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import TermsModal from './components/TermsModal';
import { acceptTerms } from './service/userService';
import TerminosDeUso from './pages/terminosDeUso';
import Privacidad from './pages/Privacidad';
import Home from './pages/home';
import Login from './pages/login';
import Perfil from './pages/perfil';
import Post from './pages/post';
import NotFound from './pages/NotFound';
import CrearPost from './pages/CrearPost';
import Configuracion from './pages/Configuracion';
import PerfilAjeno from './pages/PerfilAjeno';
import Chat from './pages/Chat';
import AdminPanel from './pages/AdminPanel';
import './App.css';

// ⚠️ SOLO VOS PODÉS ENTRAR AL ADMIN
const ADMIN_UID = 'hVKsAtCptMSJ8ooHV1uIeFWodbe2';
const ADMIN_PIN = '2846'; // Cambialo por el PIN que quieras

const LoadingScreen = () => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-logo">
                    <span className="logo-text">NoxCube</span>
                </div>
                <div className="cube-container">
                    <div className="cube">
                        <div className="cube-face front">
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                        </div>
                        <div className="cube-face back">
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                        </div>
                        <div className="cube-face right">
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                        </div>
                        <div className="cube-face left">
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                        </div>
                        <div className="cube-face top">
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                        </div>
                        <div className="cube-face bottom">
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                            <div className="cube-cell"></div><div className="cube-cell"></div>
                        </div>
                    </div>
                    <div className="cube-shadow"></div>
                </div>
                <div className="loading-text">
                    <span>Cargando</span>
                    <span className="loading-dots">
                        <span>.</span><span>.</span><span>.</span>
                    </span>
                </div>
            </div>
        </div>
    );
};

// Componente que pide PIN para acceder al admin
const AdminGate = ({ user }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');
    const [authenticated, setAuthenticated] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (pin === ADMIN_PIN) {
            setAuthenticated(true);
            setError('');
        } else {
            setError('PIN incorrecto');
            setPin('');
        }
    };

    if (authenticated) {
        return <AdminPanel user={user} />;
    }

    return (
        <div className="admin-gate">
            <form onSubmit={handleSubmit} className="admin-gate-form">
                <h2>🔐 Acceso restringido</h2>
                <p>Ingresá el PIN de administrador</p>
                <input
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="admin-pin-input"
                    placeholder="••••"
                    maxLength={6}
                    autoFocus
                />
                {error && <p className="admin-pin-error">{error}</p>}
                <button type="submit">Acceder</button>
            </form>
        </div>
    );
};

function AppContent() {
    const { user, userProfile, loading, logout } = useAuth();
    const navigate = useNavigate();

    const [showTermsModal, setShowTermsModal] = useState(false);
    const [isNewUser, setIsNewUser] = useState(false);

    useEffect(() => {
        if (user && !user.isAnonymous && userProfile) {
            const needsTerms = !userProfile?.acceptedTermsAt;
            const needsPrivacy = !userProfile?.acceptedPrivacyAt;

            if (needsTerms || needsPrivacy) {
                setIsNewUser(!userProfile?.acceptedTermsAt && !userProfile?.acceptedPrivacyAt);
                setShowTermsModal(true);
            }
        }
    }, [user, userProfile]);

    const handleAcceptTerms = async () => {
        await acceptTerms(user.uid, 'terms');
        await acceptTerms(user.uid, 'privacy');
        setShowTermsModal(false);
    };

    const handleRejectTerms = async () => {
        await logout();
        setShowTermsModal(false);
        navigate('/home');
    };

    if (loading) {
        return <LoadingScreen />;
    }

    return (
        <>
            {showTermsModal && (
                <TermsModal
                    onAccept={handleAcceptTerms}
                    onReject={handleRejectTerms}
                    isNewUser={isNewUser}
                />
            )}

            <Routes>
                <Route path="/" element={<Navigate to="/home" />} />
                <Route path="/terminos" element={<TerminosDeUso />} />
                <Route path="/privacidad" element={<Privacidad />} />
                <Route path="/home" element={<Home user={user} />} />
                <Route path="/chat" element={<Chat user={user} />} />
                <Route path="/chat/:userId" element={<Chat user={user} />} />
                <Route path="/login" element={!user || user.isAnonymous ? <Login /> : <Navigate to="/home" />} />
                <Route path="/perfil" element={user && !user.isAnonymous ? <Perfil /> : <Navigate to="/login" />} />
                <Route path="/perfil/:userId" element={<PerfilAjeno />} />
                <Route path="/post/:id" element={<Post user={user} />} />
                <Route path="/crear-post" element={user && !user.isAnonymous ? <CrearPost /> : <Navigate to="/login" />} />
                <Route path="/configuracion" element={user && !user.isAnonymous ? <Configuracion /> : <Navigate to="/login" />} />
                
                {/* 🔒 Admin protegido por UID + PIN */}
                <Route 
                    path="/admin" 
                    element={
                        user && user.uid === ADMIN_UID 
                            ? <AdminGate user={user} /> 
                            : <Navigate to="/404" />
                    } 
                />
                
                <Route path="/404" element={<NotFound />} />
                <Route path="*" element={<Navigate to="/404" />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <AppContent />
        </BrowserRouter>
    );
}

export default App;