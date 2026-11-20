import { useState } from 'react';
import { X, Flag, AlertTriangle } from 'lucide-react';
import { createReport, hasAlreadyReported } from '../service/reportService';
import '../styles/ReportModal.css';

const ReportModal = ({ reporterId, targetId, targetType, onClose }) => {
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [sending, setSending] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState('');

    const reasons = [
        'Contenido inapropiado',
        'Spam o publicidad',
        'Acoso o intimidación',
        'Información falsa',
        'Violencia o amenazas',
        'Suplantación de identidad',
        'Contenido sexual',
        'Otro'
    ];

    const handleSubmit = async () => {
        if (!reason) return;
        setSending(true);
        setError('');

        try {
            const already = await hasAlreadyReported(reporterId, targetId);
            if (already) {
                setError('Ya reportaste este contenido');
                setSending(false);
                return;
            }

            await createReport(reporterId, targetId, targetType, reason, description);
            setDone(true);
        } catch (err) {
            setError('Error al enviar reporte');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="report-overlay" onClick={onClose}>
            <div className="report-modal" onClick={e => e.stopPropagation()}>
                {done ? (
                    <div className="report-done">
                        <Flag size={40} />
                        <h3>Reporte enviado</h3>
                        <p>Gracias por ayudarnos. Revisaremos tu reporte pronto.</p>
                        <button onClick={onClose}>Cerrar</button>
                    </div>
                ) : (
                    <>
                        <div className="report-header">
                            <AlertTriangle size={20} />
                            <h3>Reportar {targetType === 'post' ? 'publicación' : targetType === 'comment' ? 'comentario' : targetType === 'user' ? 'usuario' : 'contenido'}</h3>
                            <button onClick={onClose}><X size={18} /></button>
                        </div>

                        <div className="report-body">
                            <p className="report-label">Motivo del reporte</p>
                            <div className="report-reasons">
                                {reasons.map(r => (
                                    <button
                                        key={r}
                                        className={`reason-btn ${reason === r ? 'selected' : ''}`}
                                        onClick={() => setReason(r)}
                                    >
                                        {r}
                                    </button>
                                ))}
                            </div>

                            <textarea
                                className="report-textarea"
                                placeholder="Describe brevemente el problema (opcional)..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                maxLength={500}
                                rows={3}
                            />

                            {error && <p className="report-error">{error}</p>}

                            <button
                                className="report-submit"
                                onClick={handleSubmit}
                                disabled={!reason || sending}
                            >
                                {sending ? 'Enviando...' : 'Enviar reporte'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportModal;