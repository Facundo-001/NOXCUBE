import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Navbar from './components/Navbar';
import Home from './pages/home';
import Login from './pages/login';
import Perfil from './pages/perfil';
import Post from './pages/post';
import CrearPost from './pages/CrearPost';
import Configuracion from './pages/Configuracion';
import PerfilAjeno from './pages/PerfilAjeno';
import './App.css';

// Componente de carga premium con cubo 3D dorado
const LoadingScreen = () => {
  return (
    <div className="loading-screen">
      <div className="loading-content">
        <div className="loading-logo">
          <span className="logo-text">NoxCube</span>
        </div>

        {/* Cubo 3D Dorado estilo Rubik's 2x2 */}
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
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      </div>
    </div>
  );
};

// Componente 404 Premium
const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <Navbar />
      <div className="not-found-content">
        <div className="not-found-glitch">
          <h1 className="glitch-text" data-text="404">404</h1>
        </div>

        <div className="not-found-divider"></div>

        <h2 className="not-found-title">Página no encontrada</h2>
        <p className="not-found-message">
          La página que buscas se ha perdido en el ciberespacio.
        </p>

        <div className="not-found-illustration">
          <div className="lost-cube">
            <div className="mini-cube">
              <div className="mini-face front"></div>
              <div className="mini-face back"></div>
              <div className="mini-face right"></div>
              <div className="mini-face left"></div>
              <div className="mini-face top"></div>
              <div className="mini-face bottom"></div>
            </div>
            <div className="question-mark">?</div>
          </div>
        </div>

        <div className="not-found-actions">
          <button className="nf-btn primary" onClick={() => navigate('/home')}>
            Volver al inicio
          </button>
          <button className="nf-btn secondary" onClick={() => navigate(-1)}>
            Regresar
          </button>
        </div>

        <div className="not-found-footer">
          <span>Error 404 • NoxCube</span>
        </div>
      </div>
    </div>
  );
};

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" />} />
        <Route path="/home" element={<Home user={user} />} />
        <Route path="/login" element={!user || user.isAnonymous ? <Login /> : <Navigate to="/home" />} />
        <Route path="/perfil" element={user && !user.isAnonymous ? <Perfil /> : <Navigate to="/login" />} />
        <Route path="/perfil/:userId" element={<PerfilAjeno />} />
        <Route path="/post/:id" element={<Post user={user} />} />
        <Route path="/crear-post" element={user && !user.isAnonymous ? <CrearPost /> : <Navigate to="/login" />} />
        <Route path="/configuracion" element={user && !user.isAnonymous ? <Configuracion /> : <Navigate to="/login" />} />
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;