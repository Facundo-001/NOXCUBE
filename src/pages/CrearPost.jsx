import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { createPost } from '../service/postService';
import { useAuth } from '../hooks/useAuth';
import '../styles/CrearPost.css';

const CrearPost = () => {
    const [titulo, setTitulo] = useState('');
    const [contenido, setContenido] = useState('');
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!titulo.trim() || !contenido.trim()) return;

        try {
            await createPost({
                titulo,
                contenido,
                usuario: user.displayName || user.email || 'Anónimo',
                userId: user.uid
            }, user.uid);
            navigate('/home');
        } catch (error) {
            console.error('Error al crear post:', error);
        }
    };

    return (
        <>
            <Navbar />
            <main className="crear-post-container">
                <h1 className="crear-post-title">Crear nuevo post</h1>
                <form className="crear-post-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Título"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        className="crear-post-input"
                        required
                    />
                    <textarea
                        placeholder="Contenido"
                        value={contenido}
                        onChange={(e) => setContenido(e.target.value)}
                        className="crear-post-textarea"
                        rows="5"
                        required
                    />
                    <button type="submit" className="crear-post-submit">Publicar</button>
                </form>
            </main>
        </>
    );
};

export default CrearPost;