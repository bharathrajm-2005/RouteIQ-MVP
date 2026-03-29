import { useState, useEffect } from 'react';
import { alertApi } from '../api';
import { AlertTriangle, CheckCircle, Clock, BellOff } from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await alertApi.list();
      setAlerts(res.data);
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id) => {
    try {
      await alertApi.markRead(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, isRead: true } : a));
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const formatTime = (dt) => {
    if (!dt) return '';
    const d = new Date(dt);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Alerts</h1>
        <p className="text-slate-400 text-sm mt-1">Corridor degradation and anomaly alerts</p>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <BellOff className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-500 text-lg">No alerts</p>
          <p className="text-slate-600 text-sm mt-1">All corridors operating normally</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              onClick={() => !alert.isRead && handleMarkRead(alert.id)}
              className={`card-hover cursor-pointer flex items-start gap-4 transition-all ${
                alert.isRead ? 'opacity-60' : 'border-danger-500/20'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                alert.severity === 'high'
                  ? 'bg-danger-500/15'
                  : 'bg-amber-500/15'
              }`}>
                <AlertTriangle className={`w-5 h-5 ${
                  alert.severity === 'high' ? 'text-danger-400' : 'text-amber-400'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`badge text-[10px] ${
                    alert.severity === 'high' ? 'badge-red' : 'badge-amber'
                  }`}>
                    {alert.severity?.toUpperCase()}
                  </span>
                  <span className="text-slate-500 text-xs font-mono">{alert.corridorKey}</span>
                  {alert.courierName && (
                    <span className="text-slate-500 text-xs">• {alert.courierName}</span>
                  )}
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{alert.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTime(alert.createdAt)}
                  </span>
                  {alert.isRead && (
                    <span className="text-xs text-slate-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Read
                    </span>
                  )}
                </div>
              </div>

              {!alert.isRead && (
                <div className="w-2 h-2 rounded-full bg-danger-500 flex-shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
