import { Heart } from 'lucide-react';
import { useState } from 'react';
import '../../styles/LoginButton.css';

const LikeButton = ({ initialLikes = 0 }) => {
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(initialLikes);

    const handleLike = () => {
        if (liked) {
            setLikes(likes - 1);
        } else {
            setLikes(likes + 1);
        }
        setLiked(!liked);
    };

    return (
        <button className={`like-button ${liked ? 'liked' : ''}`} onClick={handleLike}>
            <Heart size={20} fill={liked ? '#ef4444' : 'none'} />
            <span>{likes}</span>
        </button>
    );
};

export default LikeButton;