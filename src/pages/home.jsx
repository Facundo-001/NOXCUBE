import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PostCard from '../components/PostCard';
import PostForm from '../components/PostForm';
import { subscribeToPosts } from '../service/postService';
import { auth } from '../lib/firebase';
import { Activity, X, Copy, Check, User, Mail, Key, Shield } from 'lucide-react';
import '../styles/home.css';

const Home = ({ user }) => {
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [showDiagnostic, setShowDiagnostic] = useState(false);
    const [diagnosticData, setDiagnosticData] = useState(null);
    const [copied, setCopied] = useState(false);
    const [loadingDiag, setLoadingDiag] = useState(false);

    useEffect(() => {
        const unsubscribe = subscribeToPosts((newPosts) => {
            setPosts(newPosts);
        });
        return unsubscribe;
    }, []);

    const runDiagnostic = async () => {
        setLoadingDiag(true);
        try {
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                setDiagnosticData({
                    error: 'No hay usuario autenticado',
                    status: '❌ Sin sesión'
                });
                return;
            }

            // Forzar refresco del token
            await currentUser.getIdToken(true);
            const token = await currentUser.getIdTokenResult();
            
            setDiagnosticData({
                status: '✅ Autenticado',
                email: currentUser.email || 'No disponible',
                uid: currentUser.uid,
                isAnonymous: currentUser.isAnonymous,
                emailVerified: currentUser.emailVerified,
                provider: currentUser.providerData[0]?.providerId || 'unknown',
                tokenIsAnonymous: token.claims.isAnonymous,
                tokenProvider: token.claims.firebase?.sign_in_provider || 'no disponible',
                tokenEmail: token.claims.email,
                tokenEmailVerified: token.claims.email_verified,
                creationTime: currentUser.metadata.creationTime,
                lastSignInTime: currentUser.metadata.lastSignInTime
            });

            console.log('🔍 DIAGNÓSTICO COMPLETO:', diagnosticData);
            
        } catch (error) {
            console.error('Error en diagnóstico:', error);
            setDiagnosticData({
                error: error.message,
                status: '❌ Error',
                code: error.code
            });
        } finally {
            setLoadingDiag(false);
        }
    };

    const copyDiagnostic = async () => {
        if (diagnosticData) {
            await navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShowDiagnostic = () => {
        setShowDiagnostic(true);
        runDiagnostic();
    };

    return (
        <>
            <Navbar />
            <main className="home-container">
                <div className="feed-header">
                    <h1 className="feed-title">Feeds</h1>
                    
                    {/* Botón de diagnóstico premium */}
                    <button 
                        className="diagnostic-btn"
                        onClick={handleShowDiagnostic}
                        title="Diagnosticar autenticación"
                    >
                        <Activity size={18} />
                        <span>Diagnosticar</span>
                    </button>
                </div>

                {/* {user && !user.isAnonymous && <PostForm user={user} />} */}
                
                <div className="posts-feed">
                    {posts.length === 0 ? (
                        <div className="no-posts">
                            <Activity size={48} />
                            <h3>No hay posts aún</h3>
                            <p>¡Sé el primero en compartir algo!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <PostCard key={post.id} post={post} user={user} />
                        ))
                    )}
                </div>

                {/* Modal de diagnóstico premium */}
                {showDiagnostic && (
                    <div className="diagnostic-modal-overlay" onClick={() => setShowDiagnostic(false)}>
                        <div className="diagnostic-modal" onClick={e => e.stopPropagation()}>
                            <div className="diagnostic-header">
                                <div className="diagnostic-title">
                                    <Shield size={20} />
                                    <h3>Diagnóstico de Autenticación</h3>
                                </div>
                                <button 
                                    className="diagnostic-close"
                                    onClick={() => setShowDiagnostic(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="diagnostic-body">
                                {loadingDiag ? (
                                    <div className="diagnostic-loading">
                                        <div className="spinner-gold"></div>
                                        <p>Analizando sesión...</p>
                                    </div>
                                ) : diagnosticData ? (
                                    <>
                                        <div className={`diagnostic-status ${diagnosticData.error ? 'error' : 'success'}`}>
                                            {diagnosticData.status}
                                        </div>

                                        {!diagnosticData.error ? (
                                            <div className="diagnostic-info">
                                                <div className="info-row">
                                                    <User size={16} />
                                                    <span className="label">Email:</span>
                                                    <span className="value">{diagnosticData.email}</span>
                                                </div>
                                                <div className="info-row">
                                                    <Key size={16} />
                                                    <span className="label">UID:</span>
                                                    <span className="value mono">{diagnosticData.uid?.slice(0, 12)}...</span>
                                                </div>
                                                <div className="info-row">
                                                    <Mail size={16} />
                                                    <span className="label">Proveedor:</span>
                                                    <span className="value">{diagnosticData.provider}</span>
                                                </div>
                                                
                                                <div className="divider"></div>
                                                
                                                <div className="info-row warning">
                                                    <Shield size={16} />
                                                    <span className="label">¿Es anónimo?:</span>
                                                    <span className={`value ${diagnosticData.isAnonymous ? 'error-text' : 'success-text'}`}>
                                                        {diagnosticData.isAnonymous ? 'SÍ ⚠️' : 'NO ✅'}
                                                    </span>
                                                </div>
                                                
                                                <div className="info-row">
                                                    <Shield size={16} />
                                                    <span className="label">Token isAnonymous:</span>
                                                    <span className={`value ${diagnosticData.tokenIsAnonymous ? 'error-text' : 'success-text'}`}>
                                                        {diagnosticData.tokenIsAnonymous ? 'SÍ ⚠️' : 'NO ✅'}
                                                    </span>
                                                </div>

                                                <div className="info-row">
                                                    <Shield size={16} />
                                                    <span className="label">Token Provider:</span>
                                                    <span className="value">{diagnosticData.tokenProvider}</span>
                                                </div>

                                                <div className="divider"></div>

                                                <div className="info-row">
                                                    <span className="label">Creado:</span>
                                                    <span className="value small">
                                                        {new Date(diagnosticData.creationTime).toLocaleString()}
                                                    </span>
                                                </div>

                                                <div className="info-row">
                                                    <span className="label">Último acceso:</span>
                                                    <span className="value small">
                                                        {new Date(diagnosticData.lastSignInTime).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="diagnostic-error">
                                                <p>{diagnosticData.error}</p>
                                                {diagnosticData.code && <code>{diagnosticData.code}</code>}
                                            </div>
                                        )}

                                        <div className="diagnostic-actions">
                                            {!diagnosticData.error && (
                                                <button 
                                                    className="diag-btn secondary"
                                                    onClick={copyDiagnostic}
                                                >
                                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                                    {copied ? 'Copiado' : 'Copiar JSON'}
                                                </button>
                                            )}
                                            <button 
                                                className="diag-btn primary"
                                                onClick={runDiagnostic}
                                            >
                                                <Activity size={16} />
                                                Actualizar
                                            </button>
                                        </div>
                                    </>
                                ) : null}
                            </div>

                            <div className="diagnostic-footer">
                                <p className="hint">
                                    💡 Si "¿Es anónimo?" dice SÍ, cierra sesión y regístrate de nuevo.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </>
    );
};

export default Home;