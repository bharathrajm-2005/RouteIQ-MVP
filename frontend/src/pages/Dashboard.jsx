import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { shipmentApi, alertApi } from '../api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Package, TrendingUp, Leaf, AlertTriangle, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sumRes, shipRes, alertRes] = await Promise.all([
          shipmentApi.summary(),
          shipmentApi.recent(),
          alertApi.unread(),
        ]);
        setSummary(sumRes.data);
        setShipments(shipRes.data);
        setAlerts(alertRes.data);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Build SLA trend from shipments
  const slaTrend = shipments
    .slice()
    .sort((a, b) => new Date(a.dispatchedAt) - new Date(b.dispatchedAt))
    .reduce((acc, s) => {
      const date = s.dispatchedAt?.split('T')[0];
      if (!date) return acc;
      const existing = acc.find(d => d.date === date);
      if (existing) {
        if (!existing[s.courierName]) {
          existing[s.courierName] = [];
        }
        existing[s.courierName].push(s.slaScore);
      } else {
        acc.push({ date, [s.courierName]: [s.slaScore] });
      }
      return acc;
    }, [])
    .map(d => {
      const result = { date: d.date };
      Object.keys(d).filter(k => k !== 'date').forEach(k => {
        result[k] = Math.round((d[k].reduce((a, b) => a + b, 0) / d[k].length) * 100);
      });
      return result;
    });

  const courierColors = { Shiprocket: '#3391ff', Delhivery: '#22c55e', EcomExpress: '#f59e0b' };
  const courierNames = [...new Set(shipments.map(s => s.courierName).filter(Boolean))];

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Real-time dispatch intelligence overview</p>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="bg-danger-500/10 border border-danger-500/30 rounded-2xl p-4 flex items-center gap-4 animate-pulse-subtle">
          <div className="w-10 h-10 rounded-xl bg-danger-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger-400" />
          </div>
          <div className="flex-1">
            <p className="text-danger-300 font-medium text-sm">{alerts[0].message}</p>
            <p className="text-danger-400/60 text-xs mt-0.5">
              {alerts.length} unread alert{alerts.length > 1 ? 's' : ''}
            </p>
          </div>
          <button onClick={() => navigate('/alerts')} className="btn-outline border-danger-500/30 text-danger-300 hover:bg-danger-500/10 flex items-center gap-2 text-sm">
            View Details <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Package className="w-4.5 h-4.5 text-primary-400" />
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">Shipments This Month</span>
          </div>
          <p className="text-3xl font-bold text-white">{summary?.totalShipments || 0}</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-carbon-500/10 flex items-center justify-center">
              <TrendingUp className="w-4.5 h-4.5 text-carbon-400" />
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">Average SLA Rate</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {summary?.avgSlaRate ? (summary.avgSlaRate * 100).toFixed(1) : 0}%
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg bg-carbon-500/10 flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5 text-carbon-400" />
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-medium">Total CO₂ This Month</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {summary?.totalCarbonKg?.toFixed(1) || 0} <span className="text-lg text-slate-400">kg</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Trend Chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">SLA Trend by Courier (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }}
                       tickFormatter={v => v?.split('-').slice(1).join('/')} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1729', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Legend />
                {courierNames.map(name => (
                  <Line key={name} type="monotone" dataKey={name}
                        stroke={courierColors[name] || '#888'} strokeWidth={2}
                        dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Shipments Table */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Recent Shipments</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs uppercase border-b border-slate-800">
                  <th className="pb-3 text-left font-medium">Courier</th>
                  <th className="pb-3 text-left font-medium">Route</th>
                  <th className="pb-3 text-right font-medium">SLA</th>
                  <th className="pb-3 text-right font-medium">CO₂</th>
                  <th className="pb-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {shipments.slice(0, 10).map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 text-white font-medium">{s.courierName}</td>
                    <td className="py-3 text-slate-400">{s.originPin}→{s.destPin}</td>
                    <td className="py-3 text-right">
                      <span className={`${s.slaScore >= 0.9 ? 'text-carbon-400' : s.slaScore >= 0.7 ? 'text-amber-400' : 'text-danger-400'}`}>
                        {(s.slaScore * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">{s.carbonKg?.toFixed(2)}</td>
                    <td className="py-3 text-right">
                      <span className={`badge text-[10px] ${
                        s.status === 'DELIVERED' ? 'badge-green' :
                        s.status === 'IN_TRANSIT' ? 'badge-amber' : 'badge-red'
                      }`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
