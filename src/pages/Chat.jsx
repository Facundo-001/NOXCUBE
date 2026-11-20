import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, X, MessageCircle, ChevronRight, Search, Hash, UserPlus, Users, Image, Pencil, Copy, Trash2, Maximize2, AlertTriangle } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { subscribeToChats, subscribeToMessages, sendMessage, sendFile, markChatAsRead, editMessage, deleteMessage } from '../service/chatService';
import {
    getUserByShortId, sendFriendRequest, subscribeToFriendRequests,
    acceptFriendRequest, rejectFriendRequest, getSentFriendRequests, cancelSentFriendRequest
} from '../service/userService';
import { createNotification } from '../service/notificationService';
import '../styles/Chat.css';
// import { read } from 'node:fs';

const Chat = ({ user }) => {
    const { userId: paramUserId } = useParams();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    const [showAddFriend, setShowAddFriend] = useState(false);
    const [friendCode, setFriendCode] = useState('');
    const [searchResult, setSearchResult] = useState(null);
    const [searchError, setSearchError] = useState('');
    const [searching, setSearching] = useState(false);
    const [addFriendSuccess, setAddFriendSuccess] = useState(false);

    const [showRequests, setShowRequests] = useState(false);
    const [activeRequestsTab, setActiveRequestsTab] = useState('received');
    const [friendRequests, setFriendRequests] = useState([]);
    const [sentRequests, setSentRequests] = useState([]);
    const [loadingSent, setLoadingSent] = useState(false);

    const [editingMessage, setEditingMessage] = useState(null);
    const [editText, setEditText] = useState('');
    const [contextMenu, setContextMenu] = useState(null);
    const [fullscreenImage, setFullscreenImage] = useState(null);

    const [toast, setToast] = useState(null);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const chatMessagesRef = useRef(null);

    useEffect(() => {
        if (!user || user.isAnonymous) return;
        const unsub = subscribeToChats(user.uid, (loaded) => {
            setChats(loaded);
            if (paramUserId && loaded.length > 0) {
                const target = loaded.find(c => c.otherUser?.uid === paramUserId);
                if (target) setSelectedChat(target);
            }
        });
        return () => unsub();
    }, [user, paramUserId]);

    useEffect(() => {
        if (!user || user.isAnonymous) return;
        const unsub = subscribeToFriendRequests(user.uid, setFriendRequests);
        return () => unsub();
    }, [user]);

    useEffect(() => {
        if (!selectedChat || !user) return;
        const unsub = subscribeToMessages(user.uid, selectedChat.otherUser.uid, (msgs) => {
            setMessages(msgs);
            setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        });
        markChatAsRead(selectedChat.chatId, user.uid);
        return () => unsub();
    }, [selectedChat, user]);

    useEffect(() => {
        if (selectedChat) setTimeout(() => inputRef.current?.focus(), 200);
    }, [selectedChat]);

    useEffect(() => {
        if (showRequests) loadSentRequests();
    }, [showRequests]);

    useEffect(() => {
        const close = () => setContextMenu(null);
        document.addEventListener('click', close);
        return () => document.removeEventListener('click', close);
    }, []);

    const loadSentRequests = async () => {
        if (!user) return;
        setLoadingSent(true);
        try { setSentRequests(await getSentFriendRequests(user.uid)); }
        catch (e) { console.error(e); }
        finally { setLoadingSent(false); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat || sending) return;
        const text = newMessage.trim();
        setNewMessage('');
        setSending(true);
        try { await sendMessage(user.uid, selectedChat.otherUser.uid, text); }
        catch { showToast('Error al enviar mensaje', 'error'); }
        finally { setSending(false); inputRef.current?.focus(); }
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !selectedChat) return;
        if (file.size > 1024 * 1024) {
            showToast('⚠️ Disculpe La imagen no debe superar 1MB.', 'warning');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }
        setSending(true);
        try { await sendFile(user.uid, selectedChat.otherUser.uid, file); }
        catch (err) { showToast(err.message || 'Error al enviar archivo', 'error'); }
        finally { setSending(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!selectedChat) return;
        try { await deleteMessage(selectedChat.chatId, messageId); setContextMenu(null); }
        catch { showToast('Error al eliminar mensaje', 'error'); }
    };

    const handleEditMessage = async (e) => {
        e.preventDefault();
        if (!editText.trim() || !selectedChat || !editingMessage) return;
        try {
            await editMessage(selectedChat.chatId, editingMessage, editText.trim());
            setEditingMessage(null); setEditText(''); setContextMenu(null);
        } catch { showToast('Error al editar mensaje', 'error'); }
    };

    const handleCopyMessage = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            showToast('Mensaje copiado', 'success');
            setContextMenu(null);
        } catch { showToast('Error al copiar', 'error'); }
    };

    const handleContextMenu = (e, messageId) => {
        e.preventDefault();
        const menuWidth = 170;
        const menuHeight = 130;
        let x = e.touches ? e.touches[0].clientX : e.clientX;
        let y = e.touches ? e.touches[0].clientY : e.clientY;
        if (x + menuWidth > window.innerWidth) x = window.innerWidth - menuWidth - 10;
        if (y + menuHeight > window.innerHeight) y = window.innerHeight - menuHeight - 10;
        if (x < 10) x = 10;
        if (y < 10) y = 10;
        setContextMenu({ messageId, x, y });
    };

    const handleTouchStart = useRef(null);
    const handleTouchEnd = (e, messageId) => {
        if (handleTouchStart.current) {
            const diff = Date.now() - handleTouchStart.current;
            if (diff > 500) {
                handleContextMenu(e, messageId);
            }
        }
    };

    const startEditMessage = (messageId, text) => {
        setEditingMessage(messageId); setEditText(text); setContextMenu(null);
    };

    const handleOpenAddFriend = () => {
        setShowAddFriend(true); setFriendCode(''); setSearchResult(null); setSearchError(''); setAddFriendSuccess(false);
    };

    const handleSearchByCode = async () => {
        if (!friendCode.trim() || friendCode.length < 3) return;
        setSearching(true); setSearchError(''); setSearchResult(null); setAddFriendSuccess(false);
        try {
            const result = await getUserByShortId(friendCode.trim().toUpperCase());
            if (!result) setSearchError('Usuario no encontrado');
            else if (result.uid === user.uid) setSearchError('¡Ese eres tú!');
            else setSearchResult(result);
        } catch { setSearchError('Error al buscar'); }
        finally { setSearching(false); }
    };

    const handleSendFriendRequest = async () => {
        if (!searchResult) return;
        setSearching(true);
        try {
            const result = await sendFriendRequest(user.uid, searchResult.uid);
            if (result === true) {
                setAddFriendSuccess(true);
                showToast(`Solicitud enviada a ${searchResult.displayName}`, 'success');
                try { await createNotification(searchResult.uid, 'friend_request', { fromUserId: user.uid, fromUserName: user.displayName || user.email, message: 'te ha enviado una solicitud de amistad' }); } catch { }
            } else if (result === 'already_friends') showToast('Ya son amigos', 'warning');
            else { showToast('Ya hay una solicitud pendiente', 'warning'); setAddFriendSuccess(true); }
        } catch { showToast('Error al enviar solicitud', 'error'); }
        finally { setSearching(false); }
    };

    const handleAcceptRequest = async (requestId, fromUserId) => {
        try { await acceptFriendRequest(user.uid, requestId, fromUserId); showToast('¡Solicitud aceptada!', 'success'); }
        catch { showToast('Error al aceptar', 'error'); }
    };

    const handleRejectRequest = async (requestId) => {
        try { await rejectFriendRequest(user.uid, requestId); showToast('Solicitud rechazada', 'info'); }
        catch { showToast('Error al rechazar', 'error'); }
    };

    const handleCancelRequest = async (requestId, toUserId) => {
        try { await cancelSentFriendRequest(user.uid, requestId, toUserId); showToast('Solicitud cancelada', 'info'); loadSentRequests(); }
        catch { showToast('Error al cancelar', 'error'); }
    };

    const showToast = (message, type = 'info') => { setToast({ message, type }); setTimeout(() => setToast(null), 3000); };
    const formatTime = (ts) => ts ? (ts.toDate ? ts.toDate() : new Date(ts)).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
    const formatMessageDate = (ts) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = Math.floor((new Date() - d) / 86400000);
        if (diff === 0) return 'Hoy';
        if (diff === 1) return 'Ayer';
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };
    const handleGoBack = () => selectedChat ? setSelectedChat(null) : navigate(-1);

    if (!user || user.isAnonymous) {
        return (
            <div className="chat-container">
                <div className="chat-empty-full">
                    <div className="chat-watermark">NoxCube</div>
                    <MessageCircle size={64} />
                    <h2>Inicia sesión para chatear</h2>
                    <p>Necesitas una cuenta para usar el chat</p>
                    <button className="chat-login-btn" onClick={() => navigate('/login')}>Iniciar Sesión</button>
                </div>
            </div>
        );
    }


    const otherUserColor = selectedChat?.otherUser?.avatarColor || '#C3A44B';
    const otherUserInitial = selectedChat?.otherUser?.displayName?.charAt(0).toUpperCase() || '?';

    return (
        <div className="chat-container">
            <div className="chat-watermark">NoxCube</div>

            <div className={`chat-sidebar ${selectedChat ? 'hidden-mobile' : ''}`}>
                <div className="chat-sidebar-header">
                    <div className="sidebar-header-left">
                        <button className="chat-back-btn sidebar-back" onClick={() => navigate('/home')}><ArrowLeft size={18} /></button>
                        <h2>Mensajes</h2>
                    </div>
                    <div className="sidebar-actions">
                        <button className="sidebar-btn" onClick={() => setShowRequests(true)} title="Solicitudes">
                            <Users size={18} />
                            {friendRequests.length > 0 && <span className="sidebar-btn-badge">{friendRequests.length}</span>}
                        </button>
                        <button className="sidebar-btn" onClick={handleOpenAddFriend} title="Agregar amigo"><Hash size={18} /></button>
                    </div>
                </div>
                <div className="chat-list">
                    {chats.length === 0 ? (
                        <div className="chat-list-empty">
                            <MessageCircle size={48} /><h3>No tienes chats</h3><p>Agrega amigos para empezar a chatear</p>
                            <button className="chat-empty-btn" onClick={handleOpenAddFriend}><UserPlus size={16} />Agregar amigo</button>
                        </div>
                    ) : chats.map(chat => (
                        <div key={chat.chatId} className={`chat-item ${selectedChat?.chatId === chat.chatId ? 'active' : ''}`} onClick={() => setSelectedChat(chat)}>
                            <div className="chat-avatar" style={{ backgroundColor: chat.otherUser?.avatarColor || '#C3A44B' }}>{chat.otherUser?.displayName?.charAt(0).toUpperCase() || '?'}</div>
                            <div className="chat-item-info">
                                <div className="chat-item-top">
                                    <span className="chat-item-name">{chat.otherUser?.displayName || 'Usuario'}</span>
                                    <span className="chat-item-time">{chat.lastMessageAt ? formatTime(chat.lastMessageAt) : ''}</span>
                                </div>
                                <div className="chat-item-bottom">
                                    <p className="chat-item-message">{chat.lastMessage || 'Sin mensajes aún'}</p>
                                    {chat.unread > 0 && <span className="chat-unread-badge">{chat.unread > 99 ? '99+' : chat.unread}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="chat-sidebar-footer"><span className="sidebar-footer-logo">NoxCube Chat</span></div>
            </div>

            <div className={`chat-main ${!selectedChat ? 'hidden-mobile' : ''}`} ref={chatMessagesRef}>
                {!selectedChat ? (
                    <div className="chat-empty-state">
                        <div className="empty-chat-icon"><MessageCircle size={56} /></div>
                        <h3>Selecciona un chat</h3>
                        <p>Elige una conversación para empezar a chatear</p>
                        <button className="chat-empty-btn" onClick={handleOpenAddFriend}><Hash size={16} />Agregar por código</button>
                    </div>
                ) : (
                    <>
                        <div className="chat-header">
                            <button className="chat-back-btn" onClick={handleGoBack}><ArrowLeft size={20} /></button>
                            <div className="chat-header-user" onClick={() => navigate(`/perfil/${selectedChat.otherUser?.uid}`)}>
                                <div className="chat-header-avatar" style={{ backgroundColor: otherUserColor }}>{otherUserInitial}</div>
                                <div className="chat-header-info">
                                    <span className="chat-header-name">{selectedChat.otherUser?.displayName}</span>
                                    <span className="chat-header-id">@{selectedChat.otherUser?.shortId}</span>
                                </div>
                            </div>
                        </div>
                        <div className="chat-messages">
                            {messages.length === 0 ? (
                                <div className="chat-messages-empty">
                                    <div className="empty-chat-icon"><MessageCircle size={40} /></div>
                                    <p>Inicia la conversación 🚀</p>
                                    <span>Envía un mensaje para empezar</span>
                                </div>
                            ) : messages.map((msg, i) => {
                                const cur = formatMessageDate(msg.createdAt);
                                const prev = i > 0 ? formatMessageDate(messages[i - 1].createdAt) : null;
                                const isMine = msg.fromUserId === user.uid;
                                return (
                                    <div key={msg.id}>
                                        {cur !== prev && <div className="message-date-separator"><span>{cur}</span></div>}
                                        <div
                                            className={`chat-message ${isMine ? 'sent' : 'received'}`}
                                            onContextMenu={(e) => isMine && msg.type === 'text' && handleContextMenu(e, msg.id)}
                                            onTouchStart={(e) => { handleTouchStart.current = Date.now(); }}
                                            onTouchEnd={(e) => isMine && msg.type === 'text' && handleTouchEnd(e, msg.id)}
                                        >
                                            {!isMine && (
                                                <div className="message-avatar" style={{ backgroundColor: otherUserColor }}>{otherUserInitial}</div>
                                            )}
                                            <div className="message-content">
                                                {editingMessage === msg.id ? (
                                                    <form className="edit-message-form" onSubmit={handleEditMessage}>
                                                        <input type="text" className="edit-message-input" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                                                        <button type="submit" className="save-edit-btn">✓</button>
                                                        <button type="button" className="cancel-edit-btn" onClick={() => setEditingMessage(null)}>✕</button>
                                                    </form>
                                                ) : (
                                                    <div className={`message-bubble ${isMine ? 'bubble-sent' : 'bubble-received'}`}>
                                                        {msg.type === 'image' ? (
                                                            <img
                                                                src={msg.fileUrl}
                                                                alt={msg.fileName || 'Imagen'}
                                                                className="message-image"
                                                                loading="lazy"
                                                                onClick={() => setFullscreenImage(msg.fileUrl)}
                                                            />
                                                        ) : (
                                                            <p>{msg.text}{msg.edited && <span className="edited-label">editado</span>}</p>
                                                        )}
                                                        <span className="message-time">
                                                            {formatTime(msg.createdAt)}

                                                            <span
                                                                className="message-status-indicator"
                                                                data-tooltip={msg.read ? 'Leído' : msg.delivered ? 'Entregado' : 'Enviado'}
                                                            >
                                                                {/* Primer círculo - SIEMPRE visible */}
                                                                <span className={`status-circle ${msg.read ? 'read' : msg.delivered ? 'delivered' : 'sent'}`} />

                                                                {/* Segundo círculo - SOLO si entregado o leído */}
                                                                {(msg.delivered || msg.read) && (
                                                                    <span className={`status-circle ${msg.read ? 'read' : 'delivered'}`} />
                                                                )}
                                                            </span>
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {fullscreenImage && (
                            <div className="fullscreen-image-overlay" onClick={() => setFullscreenImage(null)}>
                                <button className="fullscreen-close" onClick={() => setFullscreenImage(null)}><X size={28} /></button>
                                <img src={fullscreenImage} alt="Vista completa" className="fullscreen-image" />
                            </div>
                        )}

                        {contextMenu && (
                            <div className="context-menu" style={{ top: contextMenu.y, left: contextMenu.x }}>
                                <button onClick={() => { const msg = messages.find(m => m.id === contextMenu.messageId); if (msg) startEditMessage(msg.id, msg.text); }}>
                                    <Pencil size={15} /> Editar
                                </button>
                                <button onClick={() => { const msg = messages.find(m => m.id === contextMenu.messageId); if (msg) handleCopyMessage(msg.text); }}>
                                    <Copy size={15} /> Copiar
                                </button>
                                <button onClick={() => handleDeleteMessage(contextMenu.messageId)} className="danger">
                                    <Trash2 size={15} /> Eliminar
                                </button>
                            </div>
                        )}

                        <form className="chat-input-area" onSubmit={handleSend}>
                            <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/jpeg,image/png,image/gif,image/webp" style={{ display: 'none' }} />
                            <button type="button" className="chat-attach-btn" onClick={() => fileInputRef.current?.click()} disabled={sending} title="Adjuntar imagen (máx. 1MB)"><Image size={20} /></button>
                            <input ref={inputRef} type="text" className="chat-input" placeholder="Escribe un mensaje..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={sending} autoComplete="off" />
                            <button type="submit" className="chat-send-btn" disabled={!newMessage.trim() || sending}><Send size={18} /></button>
                        </form>
                    </>
                )}
            </div>

            {showRequests && (
                <div className="chat-modal-overlay" onClick={() => setShowRequests(false)}>
                    <div className="chat-modal requests-modal" onClick={e => e.stopPropagation()}>
                        <div className="requests-panel">
                            <div className="requests-header">
                                <h3><Users size={20} />Solicitudes de amistad</h3>
                                <button className="modal-close-btn" onClick={() => setShowRequests(false)}><X size={20} /></button>
                            </div>
                            <div className="requests-tabs">
                                <button className={`requests-tab ${activeRequestsTab === 'received' ? 'active' : ''}`} onClick={() => setActiveRequestsTab('received')}>Recibidas {friendRequests.length > 0 && <span className="requests-tab-badge">{friendRequests.length}</span>}</button>
                                <button className={`requests-tab ${activeRequestsTab === 'sent' ? 'active' : ''}`} onClick={() => setActiveRequestsTab('sent')}>Enviadas {sentRequests.length > 0 && <span className="requests-tab-badge sent">{sentRequests.length}</span>}</button>
                            </div>
                            {activeRequestsTab === 'received' ? (
                                friendRequests.length === 0 ? <div className="requests-empty"><UserPlus size={40} /><p>No tienes solicitudes pendientes</p></div> :
                                    <div className="requests-list">{friendRequests.map(req => (
                                        <div key={req.id} className="request-item">
                                            <div className="request-user-info"><span className="request-name">{req.fromUserName}</span><span className="request-id">@{req.fromUserShortId}</span></div>
                                            <div className="request-actions"><button className="accept-btn" onClick={() => handleAcceptRequest(req.id, req.fromUserId)}>Aceptar</button><button className="reject-btn" onClick={() => handleRejectRequest(req.id)}>Rechazar</button></div>
                                        </div>
                                    ))}</div>
                            ) : (
                                loadingSent ? <div className="requests-loading">Cargando...</div> :
                                    sentRequests.length === 0 ? <div className="requests-empty"><Send size={40} /><p>No has enviado solicitudes</p></div> :
                                        <div className="requests-list">{sentRequests.map(req => (
                                            <div key={req.id} className="request-item sent-item">
                                                <div className="request-user-info"><span className="request-name">{req.toUserName}</span><span className="request-id">@{req.toUserShortId}</span></div>
                                                <div className="request-status"><span className="status-pending">Pendiente</span></div>
                                                <div className="request-actions"><button className="cancel-request-btn" onClick={() => handleCancelRequest(req.id, req.toUserId)}><X size={16} />Cancelar</button></div>
                                            </div>
                                        ))}</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {showAddFriend && (
                <div className="chat-modal-overlay" onClick={() => { setShowAddFriend(false); setSearchResult(null); setSearchError(''); setFriendCode(''); setAddFriendSuccess(false); }}>
                    <div className="chat-modal" onClick={e => e.stopPropagation()}>
                        <div className="add-friend-panel">
                            <div className="add-friend-header"><h3><Hash size={20} />Agregar amigo</h3><button className="modal-close-btn" onClick={() => { setShowAddFriend(false); setSearchResult(null); setSearchError(''); setFriendCode(''); setAddFriendSuccess(false); }}><X size={20} /></button></div>
                            <p className="add-friend-desc">Pídele su código a la persona que quieres agregar.</p>
                            <div className="add-friend-input-group">
                                <input type="text" className="add-friend-input" placeholder="ABC123" value={friendCode} onChange={(e) => { setFriendCode(e.target.value.toUpperCase().slice(0, 6)); setSearchResult(null); setSearchError(''); setAddFriendSuccess(false); }} onKeyDown={(e) => { if (e.key === 'Enter' && friendCode.length >= 3) handleSearchByCode(); }} maxLength={6} autoFocus />
                                <button className="add-friend-search-btn" onClick={handleSearchByCode} disabled={friendCode.length < 3 || searching}>{searching ? '...' : <><Search size={16} />Buscar</>}</button>
                            </div>
                            {searchError && <p className="add-friend-error">{searchError}</p>}
                            {searchResult && (
                                <div className="search-result-card">
                                    <div className="search-result-avatar" style={{ backgroundColor: searchResult.avatarColor }}>{searchResult.displayName?.charAt(0).toUpperCase()}</div>
                                    <div className="search-result-info"><span className="search-result-name">{searchResult.displayName}</span><span className="search-result-id">@{searchResult.shortId}</span></div>
                                    {addFriendSuccess ? <button className="search-result-add-btn success" disabled>✓ Enviada</button> : <button className="search-result-add-btn" onClick={handleSendFriendRequest} disabled={searching}>{searching ? '...' : <><UserPlus size={16} />Agregar</>}</button>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {toast && <div className={`chat-toast ${toast.type}`}><span>{toast.message}</span></div>}
        </div>
    );
};

export default Chat;