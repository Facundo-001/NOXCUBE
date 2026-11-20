import { useState } from 'react';
import { Shield, Lock, Sparkles, ChevronRight, AlertTriangle } from 'lucide-react';
import '../styles/TermsModal.css';

const TermsModal = ({ onAccept, onReject, isNewUser }) => {
    const [step, setStep] = useState(0); // 0 = intro, 1 = términos, 2 = privacidad

    const steps = [
        {
            title: '¡Nuevas políticas!',
            icon: Sparkles,
            text: isNewUser 
                ? 'Bienvenido a NoxCube. Antes de comenzar tu aventura, necesitamos que leas y aceptes nuestras políticas.'
                : 'Hemos actualizado nuestras políticas. Por favor, lee atentamente los siguientes documentos para continuar.',
            button: 'Comenzar'
        },
        {
            title: 'Términos y Condiciones',
            icon: Shield,
            text: 'Estas son las reglas del reino. Al usar NoxCube aceptás cumplirlas. Si rompés las reglas, serás desterrado.',
            link: '/terminos',
            button: 'Aceptar términos'
        },
        {
            title: 'Política de Privacidad',
            icon: Lock,
            text: 'Tus datos son tuyos. Nosotros solo guardamos lo mínimo para que la app funcione. No vendemos nada a nadie.',
            link: '/privacidad',
            button: 'Aceptar privacidad'
        }
    ];

    const currentStep = steps[step];

    const handleNext = () => {
        if (step < 2) {
            setStep(step + 1);
        } else {
            // Último paso, aceptó todo
            onAccept();
        }
    };

    return (
        <div className="terms-modal-overlay">
            <div className="terms-modal-card">
                {/* Decoración superior */}
                <div className="terms-modal-decoration" />

                {/* Icono animado */}
                <div className="terms-modal-icon">
                    <currentStep.icon size={48} />
                </div>

                {/* Título */}
                <h2 className="terms-modal-title">{currentStep.title}</h2>

                {/* Texto */}
                <p className="terms-modal-text">{currentStep.text}</p>

                {/* Link para leer */}
                {currentStep.link && (
                    <a 
                        href={currentStep.link} 
                        target="_blank" 
                        className="terms-modal-link"
                        rel="noopener noreferrer"
                    >
                        <ChevronRight size={16} />
                        Leer documento completo (se abre en nueva pestaña)
                    </a>
                )}

                {/* Barra de progreso */}
                <div className="terms-modal-progress">
                    {[0, 1, 2].map(i => (
                        <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
                    ))}
                </div>

                {/* Botones */}
                <div className="terms-modal-actions">
                    <button className="terms-btn accept" onClick={handleNext}>
                        {currentStep.button}
                    </button>
                    {step > 0 && (
                        <button className="terms-btn reject" onClick={onReject}>
                            Rechazar y salir
                        </button>
                    )}
                </div>

                {/* Advertencia */}
                {step === 0 && (
                    <p className="terms-modal-warning">
                        <AlertTriangle size={14} />
                        Al rechazar no podrás usar NoxCube
                    </p>
                )}
            </div>
        </div>
    );
};

export default TermsModal;