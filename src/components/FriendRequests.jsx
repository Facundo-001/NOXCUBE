import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, X, Clock } from 'lucide-react';
import { subscribeToFriendRequests, acceptFriendRequest, rejectFriendRequest } from '../service/userService';
import '../styles/FriendRequests.css';

const FriendRequests = ({ userId, onClose }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const unsubscribe = subscribeToFriendRequests(userId, (reqs) => {
            setRequests(reqs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    const handleAccept = async (requestId, fromUserId) => {
        await acceptFriendRequest(userId, requestId, fromUserId);
    };

    const handleReject = async (requestId) => {
        await rejectFriendRequest(userId, requestId);
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffDay = Math.floor((now - date) / 86400000);
        if (diffDay === 0) return 'Hoy';
        if (diffDay === 1) return 'Ayer';
        return `Hace ${diffDay} días`;
    };

    return (
        <div className="friend-requests-panel">
            <div className="requests-header">
                <h3>
                    <UserPlus size={20} />
                    Solicitudes de amistad
                </h3>
                {onClose && (
                    <button className="requests-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                )}
            </div>

            {loading ? (
                <div className="requests-loading">Cargando...</div>
            ) : requests.length === 0 ? (
                <div className="requests-empty">
                    <p>No hay solicitudes pendientes</p>
                </div>
            ) : (
                <div className="requests-list">
                    {requests.map(req => (
                        <div key={req.id} className="request-item">
                            <div className="request-user">
                                <span className="request-name">{req.fromUserName}</span>
                                <span className="request-id">@{req.fromUserShortId}</span>
                            </div>
                            <span className="request-date">
                                <Clock size={12} />
                                {formatDate(req.createdAt)}
                            </span>
                            <div className="request-actions">
                                <button 
                                    className="accept-btn"
                                    onClick={() => handleAccept(req.id, req.fromUserId)}
                                >
                                    <UserCheck size={16} />
                                    Aceptar
                                </button>
                                <button 
                                    className="reject-btn"
                                    onClick={() => handleReject(req.id)}
                                >
                                    <X size={16} />
                                    Rechazar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default FriendRequests;