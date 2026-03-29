import { useState } from 'react';
import { recommendApi, shipmentApi } from '../api';
import toast from 'react-hot-toast';
import { Send, MapPin, Weight, Award, Leaf, TrendingUp, IndianRupee } from 'lucide-react';

export default function DispatchPage() {
  const [originPin, setOriginPin] = useState('');
  const [destPin, setDestPin] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(null);

  const pins = [
    { code: '110001', city: 'Delhi' },
    { code: '400001', city: 'Mumbai' },
    { code: '560001', city: 'Bangalore' },
    { code: '700001', city: 'Kolkata' },
    { code: '600001', city: 'Chennai' },
    { code: '302001', city: 'Jaipur' },
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!originPin || !destPin || !weightKg) return;
    setLoading(true);
    try {
      const res = await recommendApi.get(originPin, destPin, parseFloat(weightKg));
      setRecommendations(res.data);
    } catch (err) {
      toast.error('Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleDispatch = async (rec) => {
    setDispatching(rec.courierId);
    try {
      await shipmentApi.create({
        courierId: rec.courierId,
        courierName: rec.courierName,
        originPin,
        destPin,
        weightKg: parseFloat(weightKg),
        cost: rec.estimatedCost,
        slaScore: rec.predictedSlaRate,
        carbonKg: rec.estimatedCarbonKg,
        status: 'DISPATCHED',
      });
      toast.success(`Dispatched via ${rec.courierName}!`);
    } catch (err) {
      toast.error('Dispatch failed');
    } finally {
      setDispatching(null);
    }
  };

  const slaColor = (rate) => {
    if (rate >= 0.9) return 'text-carbon-400';
    if (rate >= 0.7) return 'text-amber-400';
    return 'text-danger-400';
  };

  const slaBg = (rate) => {
    if (rate >= 0.9) return 'bg-carbon-500';
    if (rate >= 0.7) return 'bg-amber-500';
    return 'bg-danger-500';
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dispatch</h1>
        <p className="text-slate-400 text-sm mt-1">Get ranked courier recommendations with SLA, cost & CO₂ tradeoff</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Origin Pin</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <select value={originPin} onChange={e => setOriginPin(e.target.value)}
                      className="input-field pl-10 appearance-none cursor-pointer" required>
                <option value="">Select origin...</option>
                {pins.map(p => (
                  <option key={p.code} value={p.code}>{p.city} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Destination Pin</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <select value={destPin} onChange={e => setDestPin(e.target.value)}
                      className="input-field pl-10 appearance-none cursor-pointer" required>
                <option value="">Select destination...</option>
                {pins.map(p => (
                  <option key={p.code} value={p.code}>{p.city} ({p.code})</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">Weight (kg)</label>
            <div className="relative">
              <Weight className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input type="number" step="0.1" min="0.1" placeholder="e.g. 2.5"
                     value={weightKg} onChange={e => setWeightKg(e.target.value)}
                     className="input-field pl-10" required />
            </div>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <><Send className="w-4 h-4" /> Get Recommendations</>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Recommendation Cards */}
      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec, idx) => (
            <div key={rec.courierId}
                 className={`card-hover relative ${idx === 0 ? 'border-primary-500/40 shadow-glow ring-1 ring-primary-500/20' : ''}`}>
              {rec.isRecommended && (
                <div className="absolute -top-3 left-4">
                  <span className="badge bg-primary-500 text-white text-[10px] shadow-lg">
                    <Award className="w-3 h-3 mr-1" /> RECOMMENDED
                  </span>
                </div>
              )}

              <div className="pt-2">
                <h3 className="text-lg font-bold text-white mb-4">{rec.courierName}</h3>

                <div className="space-y-4">
                  {/* SLA */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> Predicted SLA
                      </span>
                      <span className={`text-sm font-bold ${slaColor(rec.predictedSlaRate)}`}>
                        {(rec.predictedSlaRate * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className={`h-1.5 rounded-full transition-all ${slaBg(rec.predictedSlaRate)}`}
                           style={{ width: `${rec.predictedSlaRate * 100}%` }} />
                    </div>
                  </div>

                  {/* Cost */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" /> Estimated Cost
                    </span>
                    <span className="text-sm font-bold text-white">₹{rec.estimatedCost?.toFixed(2)}</span>
                  </div>

                  {/* Carbon */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Leaf className="w-3 h-3" /> CO₂ Estimate
                    </span>
                    <span className="text-sm font-bold text-carbon-400">{rec.estimatedCarbonKg?.toFixed(3)} kg</span>
                  </div>

                  {/* Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">Recommendation Score</span>
                      <span className="text-sm font-bold text-primary-400">{(rec.recommendationScore * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary-500 transition-all"
                           style={{ width: `${rec.recommendationScore * 100}%` }} />
                    </div>
                  </div>

                  {rec.isAnomalous && (
                    <div className="badge-red text-[10px] w-full justify-center">
                      ⚠️ SLA Degradation Detected
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDispatch(rec)}
                  disabled={dispatching === rec.courierId}
                  className={`mt-5 w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                    idx === 0
                      ? 'bg-primary-600 hover:bg-primary-500 text-white'
                      : 'btn-outline'
                  }`}
                >
                  {dispatching === rec.courierId ? (
                    <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full mx-auto" />
                  ) : (
                    'Select & Dispatch'
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && recommendations.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 flex items-center justify-center mx-auto mb-4">
            <Send className="w-7 h-7 text-slate-600" />
          </div>
          <p className="text-slate-500">Enter origin, destination and weight to get courier recommendations</p>
        </div>
      )}
    </div>
  );
}
