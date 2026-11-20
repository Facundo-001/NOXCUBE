import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Youtube, Github, Instagram, HelpCircle, 
    Lightbulb, Shield, FileText, Heart, Sparkles,
    Mail, ExternalLink, ChevronUp
} from 'lucide-react';
import '../styles/Footbar.css';

const Footbar = () => {
    const navigate = useNavigate();
    const [showBackToTop, setShowBackToTop] = useState(false);

    // Mostrar botón "volver arriba" al hacer scroll
    useState(() => {
        const handleScroll = () => {
            setShowBackToTop(window.scrollY > 400);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const currentYear = new Date().getFullYear();

    return (
        <footer className="footbar">
            {/* Línea decorativa superior */}
            <div className="footbar-divider" />

            <div className="footbar-content">
                {/* Columna 1 - Redes Sociales */}
                <div className="footbar-column">
                    <h4 className="footbar-title">
                        <Sparkles size={16} />
                        TheSoCube
                    </h4>
                    <p className="footbar-desc">
                        La red social exclusiva y refinada para mentes brillantes.
                    </p>
                    <div className="footbar-social">
                        <a 
                            href="https://youtube.com/@TheSoCube" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="social-link"
                            title="YouTube"
                        >
                            <Youtube size={18} />
                        </a>
                        <a 
                            href="https://github.com/noxcube" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="social-link"
                            title="GitHub"
                        >
                            <Github size={18} />
                        </a>
                        <a 
                            href="https://instagram.com/TheSoCube" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="social-link"
                            title="Instagram"
                        >
                            <Instagram size={18} />
                        </a>
                        <a 
                            href="mailto:soporte@TheSoCube.com" 
                            className="social-link"
                            title="Soporte"
                        >
                            <Mail size={18} />
                        </a>
                    </div>
                </div>

                {/* Columna 2 - Enlaces rápidos */}
                <div className="footbar-column">
                    <h4 className="footbar-title">Explorar</h4>
                    <ul className="footbar-links">
                        <li>
                            <button onClick={() => navigate('/home')}>
                                <ExternalLink size={13} />
                                Inicio
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/perfil')}>
                                <ExternalLink size={13} />
                                Perfil
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/chat')}>
                                <ExternalLink size={13} />
                                Mensajes
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/configuracion')}>
                                <ExternalLink size={13} />
                                Configuración
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Columna 3 - Legal y Soporte */}
                <div className="footbar-column">
                    <h4 className="footbar-title">Ayuda</h4>
                    <ul className="footbar-links">
                        <li>
                            <button onClick={() => navigate('/sugerencias')}>
                                <Lightbulb size={13} />
                                Sugerencias
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/aportar')}>
                                <Heart size={13} />
                                Aportar
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/politicas')}>
                                <Shield size={13} />
                                Políticas de uso
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/soporte')}>
                                <HelpCircle size={13} />
                                Soporte técnico
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Columna 4 - Descargo */}
                <div className="footbar-column">
                    <h4 className="footbar-title">Legal</h4>
                    <ul className="footbar-links">
                        <li>
                            <button onClick={() => navigate('/privacidad')}>
                                <Shield size={13} />
                                Privacidad
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/terminos')}>
                                <FileText size={13} />
                                Términos y condiciones
                            </button>
                        </li>
                        <li>
                            <button onClick={() => navigate('/descargo')}>
                                <FileText size={13} />
                                Descargo de responsabilidad
                            </button>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Línea inferior */}
            <div className="footbar-bottom">
                <p className="footbar-copy">
                    © {currentYear} TheSoCube. Todos los derechos reservados.
                </p>
                <p className="footbar-tagline">
                    Hecho con <Heart size={12} className="heart-icon" /> para la comunidad.
                </p>
            </div>

            {/* Botón volver arriba */}
            {showBackToTop && (
                <button 
                    className="back-to-top"
                    onClick={scrollToTop}
                    title="Volver arriba"
                >
                    <ChevronUp size={20} />
                </button>
            )}
        </footer>
    );
};

export default Footbar;