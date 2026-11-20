import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import '../styles/Legal.css';

const Privacidad = () => {
    const navigate = useNavigate();
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (index) => {
        setOpenSection(openSection === index ? null : index);
    };

    const sections = [
        {
            title: '1. Datos que recolectamos',
            content: `Para el funcionamiento de NoxCube, recolectamos únicamente los datos mínimos necesarios:\n\n• Email: para crear tu cuenta, iniciar sesión y recuperar tu contraseña.\n• Nombre de usuario: visible públicamente en tu perfil.\n• Fecha de nacimiento: para verificar que cumplís con la edad mínima requerida.\n• Contenido que publicás: posts, comentarios, mensajes y archivos que decidas compartir.\n• Datos técnicos: dirección IP, tipo de navegador y sistema operativo para diagnóstico.`
        },
        {
            title: '2. Cómo usamos tus datos',
            content: `Tus datos son utilizados exclusivamente para:\n\n• Permitirte crear y gestionar tu cuenta.\n• Mostrar tu perfil y contenido a otros usuarios según tu configuración de privacidad.\n• Enviarte notificaciones relacionadas con tu actividad en la plataforma.\n• Mejorar y mantener el funcionamiento técnico de NoxCube.\n\nNo utilizamos tus datos para publicidad, perfilado automatizado ni toma de decisiones automatizadas.`
        },
        {
            title: '3. Tus datos NO se venden',
            content: `Tus datos personales NO serán vendidos, compartidos, alquilados ni cedidos a terceros bajo ninguna circunstancia. La información se almacena en Firebase (Google Cloud), que cumple con estándares de seguridad internacionales como ISO 27001 y SOC 2.`
        },
        {
            title: '4. Cookies',
            content: `NoxCube utiliza cookies técnicas esenciales para mantener tu sesión iniciada y recordar tus preferencias. No utilizamos cookies de rastreo, publicidad ni analítica de terceros.`
        },
        {
            title: '5. Seguridad de tus datos',
            content: `Implementamos medidas de seguridad estándar para proteger tu información personal. Sin embargo, ningún método de transmisión por Internet o almacenamiento electrónico es 100% seguro. Si detectamos una brecha de seguridad que afecte tus datos, te lo notificaremos por correo electrónico.`
        },
        {
            title: '6. Eliminación de tus datos',
            content: `Tenés derecho a solicitar la eliminación completa de tu cuenta y todos tus datos asociados en cualquier momento. Para hacerlo, escribinos a nuestro email de soporte. Procesaremos tu solicitud en un plazo máximo de 30 días hábiles. También podés eliminar tu cuenta directamente desde la sección de Configuración.`
        },
        {
            title: '7. Menores de edad',
            content: `NoxCube no está dirigido a menores de 13 años. No recolectamos intencionalmente datos de menores de 13 años. Si descubrimos que un menor de 13 años nos ha proporcionado datos personales, eliminaremos dicha información de inmediato.`
        },
        {
            title: '8. Cambios en esta política',
            content: `Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos cualquier cambio publicando la nueva política en esta página y, si los cambios son significativos, te lo comunicaremos por correo electrónico o mediante un aviso en la plataforma.`
        },
        {
            title: '9. Contacto',
            content: `Si tenés preguntas sobre esta Política de Privacidad o querés ejercer tus derechos sobre tus datos personales, podés contactarnos a través de nuestro email de soporte.`
        }
    ];

    return (
        <>
            <Navbar />
            <main className="legal-container">
                <button className="legal-back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Volver
                </button>

                <div className="legal-card">
                    <div className="legal-header">
                        <Lock size={28} />
                        <h1>Política de Privacidad</h1>
                    </div>
                    <p className="legal-date">Última actualización: Junio 2025</p>
                    <p className="legal-intro">
                        En NoxCube valoramos y respetamos tu privacidad. Esta política describe qué datos recolectamos, 
                        cómo los usamos, cómo los protegemos y qué derechos tenés sobre tu información personal.
                    </p>

                    <div className="legal-sections">
                        {sections.map((section, index) => (
                            <div key={index} className="legal-section">
                                <button 
                                    className={`legal-section-title ${openSection === index ? 'active' : ''}`}
                                    onClick={() => toggleSection(index)}
                                >
                                    <FileText size={16} />
                                    <span>{section.title}</span>
                                    <span className="legal-arrow">{openSection === index ? '▾' : '▸'}</span>
                                </button>
                                {openSection === index && (
                                    <div className="legal-section-content">
                                        {section.content.split('\n\n').map((paragraph, i) => (
                                            <p key={i}>{paragraph}</p>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
};

export default Privacidad;