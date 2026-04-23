import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import '../styles/configuracion.css';

const Configuracion = () => {
    const { user, userProfile } = useAuth();
    const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
    const [updating, setUpdating] = useState(false);
    const [message, setMessage] = useState('');

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!displayName.trim()) return;
        setUpdating(true);
        setMessage('');
        try {
            await updateProfile(auth.currentUser, { displayName });
            // También actualizar en Firestore si quieres
            setMessage('Perfil actualizado correctamente');
        } catch (error) {
            setMessage('Error al actualizar: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    if (!user || user.isAnonymous) {
        return (
            <>
                <Navbar />
                <main className="config-container">
                    <p>Debes iniciar sesión para ver esta página.</p>
                </main>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <main className="config-container">
                <div className="config-card">
                    <h1>Configuración</h1>
                    <form onSubmit={handleUpdate} className="config-form">
                        <div className="form-group">
                            <label>Nombre de usuario</label>
                            <input
                                type="text"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="config-input"
                                maxLength="20"
                            />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={user.email || ''}
                                disabled
                                className="config-input disabled"
                            />
                        </div>
                        <button type="submit" className="config-btn" disabled={updating}>
                            {updating ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                        {message && <p className="config-message">{message}</p>}
                    </form>
                </div>
            </main>
        </>
    );
};

export default Configuracion;