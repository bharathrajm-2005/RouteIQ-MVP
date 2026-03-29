import { useState, useEffect } from 'react';
import { carbonApi } from '../api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';
import { Leaf, TrendingDown, TrendingUp, Package, Calendar } from 'lucide-react';

export default function CarbonDashboard() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await carbonApi.report(month, year);
      setReport(res.data);
    } catch (err) {
      console.error('Failed to fetch carbon report:', err);
    } finally {
      setLoading(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const courierColors = {
    Shiprocket: '#3391ff', Delhivery: '#22c55e', EcomExpress: '#f59e0b'
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin w-8 h-8 border-2 border-carbon-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const changePercent = report?.comparedToPreviousMonth || 0;
  const isDown = changePercent < 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Carbon Report</h1>
          <p className="text-slate-400 text-sm mt-1">Scope 3 emissions tracking for BRSR/ESG compliance</p>
        </div>

        {/* Month/Year selector */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-500" />
          <select value={month} onChange={e => setMonth(parseInt(e.target.value))}
                  className="input-field py-2 px-3 w-36 text-sm">
            {months.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <select value={year} onChange={e => setYear(parseInt(e.target.value))}
                  className="input-field py-2 px-3 w-24 text-sm">
            {[2024, 2025, 2026].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center">
              <Package className="w-4 h-4 text-primary-400" />
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">Total Shipments</span>
          </div>
          <p className="text-2xl font-bold text-white">{report?.totalShipments || 0}</p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-carbon-500/10 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-carbon-400" />
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">Total CO₂</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {report?.totalCarbonKg?.toFixed(2) || 0} <span className="text-sm text-slate-400">kg</span>
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-carbon-500/10 flex items-center justify-center">
              <Leaf className="w-4 h-4 text-carbon-400" />
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">Avg CO₂/Shipment</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {report?.avgCarbonPerShipment?.toFixed(3) || 0} <span className="text-sm text-slate-400">kg</span>
          </p>
        </div>

        <div className="metric-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              {isDown ? <TrendingDown className="w-4 h-4 text-carbon-400" /> : <TrendingUp className="w-4 h-4 text-danger-400" />}
            </div>
            <span className="text-slate-400 text-xs uppercase tracking-wider">vs Last Month</span>
          </div>
          <p className={`text-2xl font-bold ${isDown ? 'text-carbon-400' : changePercent > 0 ? 'text-danger-400' : 'text-slate-400'}`}>
            {isDown ? '↓' : changePercent > 0 ? '↑' : '—'} {Math.abs(changePercent).toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CO₂ per Courier - Bar Chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">CO₂ by Courier</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={report?.courierBreakdown || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="courier" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" kg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1729', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Bar dataKey="carbonKg" name="CO₂ (kg)" radius={[6, 6, 0, 0]}>
                  {(report?.courierBreakdown || []).map((entry, i) => (
                    <rect key={i} fill={courierColors[entry.courier] || '#3391ff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily CO₂ Trend - Line Chart */}
        <div className="card">
          <h3 className="text-sm font-semibold text-white mb-4">Daily CO₂ Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={report?.dailyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }}
                       tickFormatter={v => v?.split('-').slice(1).join('/')} />
                <YAxis tick={{ fill: '#64748b', fontSize: 11 }} unit=" kg" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f1729', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line type="monotone" dataKey="carbonKg" name="CO₂ (kg)"
                      stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insight text */}
      {report?.lowestCarbonCourier && report.lowestCarbonCourier !== 'N/A' && (
        <div className="card bg-carbon-500/5 border-carbon-500/20">
          <div className="flex items-start gap-3">
            <Leaf className="w-5 h-5 text-carbon-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-carbon-200">
                Your lowest carbon courier this month was <span className="font-bold text-carbon-400">{report.lowestCarbonCourier}</span>.
                Switching all orders to {report.lowestCarbonCourier} would save approximately{' '}
                <span className="font-bold text-carbon-400">{report.potentialSavingsKg?.toFixed(2)} kg CO₂</span>.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
