// {termsStep === 'terms' && (
//     <div className="terms-overlay">
//         <div className="terms-modal">
//             <h2></h2>
//             <p></p>
//         </div>
//         <div className="terms-scroll">
//             <details>
//                 <summary></summary>
//             </details>
//         </div>
//     </div>
// )}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import '../styles/Legal.css';

const TerminosDeUso = () => {
    const navigate = useNavigate();
    const [openSection, setOpenSection] = useState(null);

    const toggleSection = (index) => {
        setOpenSection(openSection === index ? null : index);
    };

    const sections = [
        {
            title: '1. Naturaleza del servicio',
            content: `NoxCube es un proyecto personal de desarrollo de software creado con fines de aprendizaje, demostración de habilidades técnicas y construcción de portafolio. No constituye una empresa registrada ni un servicio comercial profesional. El acceso y uso de la plataforma es gratuito y se ofrece "tal cual" (as-is), sin garantías de disponibilidad continua, seguridad absoluta o ausencia de errores. Al utilizar NoxCube, el usuario reconoce y acepta que se trata de un proyecto en etapa experimental, desarrollado por un estudiante de programación.`
        },
        {
            title: '2. Edad mínima y capacidad legal',
            content: `Al registrarte o utilizar NoxCube, declaras que tienes al menos 13 años de edad. Si tienes entre 13 y 18 años, debes contar con el consentimiento de tus padres o tutores legales para usar la plataforma. El creador de NoxCube no se hace responsable del uso no autorizado por parte de menores que no cumplan este requisito. Si se detecta una cuenta de un menor de 13 años, será eliminada sin previo aviso.`
        },
        {
            title: '3. Responsabilidad del usuario',
            content: `El usuario es el único responsable del contenido que publica, comparte, envía o transmite a través de NoxCube. Esto incluye, sin limitación: publicaciones (posts), comentarios y respuestas, mensajes directos (chat), imágenes y archivos, e información de perfil.\n\nEl creador de NoxCube no revisa, modera, aprueba ni controla el contenido generado por los usuarios de forma activa. El usuario acepta que no publicará contenido ilegal, difamatorio, amenazante, acosador, discriminatorio, pornográfico, violento o que viole derechos de terceros.\n\nTampoco utilizará la plataforma para actividades ilícitas como fraude, suplantación de identidad, distribución de malware, spam, phishing, acoso organizado o cualquier conducta tipificada como delito.`
        },
        {
            title: '4. Exención de responsabilidad',
            content: `El creador de NoxCube NO se hace responsable por el contenido publicado por los usuarios. Cada usuario es el único responsable legal de lo que escribe, comparte o envía.\n\nTampoco se hace responsable por daños, perjuicios, pérdidas o cualquier consecuencia derivada del uso de la plataforma, ni por interacciones entre usuarios, filtraciones de datos causadas por ataques externos, pérdida de contenido por fallos técnicos, o la disponibilidad del servicio.\n\nEl usuario acepta expresamente que utiliza NoxCube bajo su propio riesgo.`
        },
        {
            title: '5. Propiedad intelectual',
            content: `El código fuente, diseño, logotipo, nombre "NoxCube" y elementos gráficos originales de la plataforma pertenecen al creador. Los usuarios conservan los derechos sobre el contenido que publican, pero otorgan al creador una licencia no exclusiva y gratuita para almacenar, mostrar y reproducir dicho contenido únicamente dentro de la plataforma.`
        },
        {
            title: '6. Eliminación de contenido y cuentas',
            content: `El creador se reserva el derecho de eliminar cualquier contenido o cuenta que considere que viola estas políticas, sin previo aviso y a su entera discreción. Los usuarios pueden solicitar la eliminación de su cuenta y datos asociados en cualquier momento.`
        },
        {
            title: '7. Modificaciones',
            content: `El creador se reserva el derecho de modificar estas políticas en cualquier momento. Los cambios serán notificados mediante un aviso visible en la plataforma. El uso continuado de NoxCube después de dichas modificaciones implica la aceptación de las nuevas condiciones.`
        },
        {
            title: '8. Legislación aplicable',
            content: `Estas políticas se rigen por las leyes de la República Argentina. Cualquier disputa legal relacionada con NoxCube será resuelta ante los tribunales competentes de la jurisdicción que corresponda al domicilio del creador.`
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
                        <Shield size={28} />
                        <h1>Términos y Condiciones de Uso</h1>
                    </div>
                    <p className="legal-date">Última actualización: Junio 2025</p>
                    <p className="legal-intro">
                        Bienvenido a NoxCube. Al utilizar nuestra plataforma, aceptás los siguientes términos y condiciones. 
                        Por favor, leelos atentamente antes de registrarte o usar cualquiera de nuestros servicios.
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

export default TerminosDeUso;