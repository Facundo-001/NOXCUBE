import { useState } from 'react';
import '../styles/PostForm.css';

const PostForm = ({ onPostCreated }) => {
    const [content, setContent] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!content.trim()) return;
        // Aquí iría la llamada a Firebase
        console.log('Nuevo post:', content);
        setContent('');
        if (onPostCreated) onPostCreated();
    };

    return (
        <form className="post-form" onSubmit={handleSubmit}>
            <textarea
                className="post-textarea"
                placeholder="¿Qué estás pensando?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="3"
            />
            <button type="submit" className="post-submit">Publicar</button>
        </form>
    );
};

export default PostForm;