import { useState, useEffect } from 'react';
import { Shield, Users, FileText, MessageCircle, Flag, Activity, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { subscribeToReports, updateReportStatus } from '../service/reportService';
import { getBotStatus } from '../service/botService';
import { getAllUsers } from '../service/userService';
import '../styles/AdminPanel.css';

const AdminPanel = ({ user }) => {
    const [reports, setReports] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('reports');
    const [botStatus, setBotStatus] = useState(getBotStatus());
    const [stats, setStats] = useState({ totalReports: 0, pendingReports: 0, totalUsers: 0 });

    useEffect(() => {
        const unsub = subscribeToReports(setReports);
        return () => unsub();
    }, []);

    useEffect(() => {
        getAllUsers().then(setUsers);
        setBotStatus(getBotStatus());
    }, []);

    useEffect(() => {
        setStats({
            totalReports: reports.length,
            pendingReports: reports.filter(r => r.status === 'pending').length,
            totalUsers: users.length
        });
    }, [reports, users]);

    const handleUpdateStatus = async (reportId, status) => {
        await updateReportStatus(reportId, status);
    };

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <Shield size={28} />
                <h1>Panel de Administración</h1>
                <span className="bot-badge">Bot: {botStatus.online ? '🟢 Online' : '🔴 Offline'}</span>
            </div>

            <div className="admin-stats">
                <div className="stat-card">
                    <Flag size={24} />
                    <span className="stat-value">{stats.totalReports}</span>
                    <span className="stat-label">Reportes totales</span>
                </div>
                <div className="stat-card warning">
                    <AlertTriangle size={24} />
                    <span className="stat-value">{stats.pendingReports}</span>
                    <span className="stat-label">Pendientes</span>
                </div>
                <div className="stat-card">
                    <Users size={24} />
                    <span className="stat-value">{stats.totalUsers}</span>
                    <span className="stat-label">Usuarios</span>
                </div>
                <div className="stat-card">
                    <Activity size={24} />
                    <span className="stat-value">{botStatus.bannedWordsCount}</span>
                    <span className="stat-label">Palabras baneadas</span>
                </div>
            </div>

            <div className="admin-tabs">
                <button className={activeTab === 'reports' ? 'active' : ''} onClick={() => setActiveTab('reports')}>
                    <Flag size={18} /> Reportes
                </button>
                <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>
                    <Users size={18} /> Usuarios
                </button>
                <button className={activeTab === 'bot' ? 'active' : ''} onClick={() => setActiveTab('bot')}>
                    <Activity size={18} /> Bot
                </button>
            </div>

            <div className="admin-content">
                {activeTab === 'reports' && (
                    <div className="reports-list">
                        {reports.length === 0 ? (
                            <p className="empty-message">No hay reportes 🎉</p>
                        ) : (
                            reports.map(report => (
                                <div key={report.id} className={`report-card ${report.status}`}>
                                    <div className="report-info">
                                        <span className="report-reason">{report.reason}</span>
                                        <span className="report-meta">
                                            Reportado por {report.reporterName} • {report.targetType}
                                        </span>
                                        {report.description && <p className="report-desc">{report.description}</p>}
                                    </div>
                                    <div className="report-actions">
                                        {report.status === 'pending' && (
                                            <>
                                                <button className="resolve-btn" onClick={() => handleUpdateStatus(report.id, 'resolved')}>
                                                    <CheckCircle size={16} /> Resolver
                                                </button>
                                                <button className="dismiss-btn" onClick={() => handleUpdateStatus(report.id, 'dismissed')}>
                                                    <XCircle size={16} /> Descartar
                                                </button>
                                            </>
                                        )}
                                        {report.status !== 'pending' && (
                                            <span className="status-badge">{report.status}</span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="users-list">
                        {users.slice(0, 20).map(u => (
                            <div key={u.uid} className="user-card">
                                <span>{u.displayName}</span>
                                <span className="user-id">@{u.shortId}</span>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'bot' && (
                    <div className="bot-status">
                        <h3>Estado del Bot Moderador</h3>
                        <div className="status-grid">
                            <div className="status-item">
                                <span>Estado</span>
                                <span className={botStatus.online ? 'online' : 'offline'}>
                                    {botStatus.online ? '🟢 Online' : '🔴 Offline'}
                                </span>
                            </div>
                            <div className="status-item">
                                <span>Palabras prohibidas</span>
                                <span>{botStatus.bannedWordsCount}</span>
                            </div>
                            <div className="status-item">
                                <span>Patrones de spam</span>
                                <span>{botStatus.spamPatterns}</span>
                            </div>
                            <div className="status-item">
                                <span>Uptime</span>
                                <span>{Math.floor(botStatus.uptime / 60)} min</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminPanel;

// Todo parece correcto pero todavia me falta solucionar el problema de que otros usuarios-
// Puedan vulnerar el panel de administrador cual les permitiría hacer cosas malas 
// Deberia poner tener acceso yo solo al panel con cierta id de cuenta o pin
// Muy estricto

// Y por el lado del bot parece todo normal aun no se probaron el usuarios-
// podria aver ban o warns inesperados