import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { authApi } from '../api';
import toast from 'react-hot-toast';
import { Zap, Mail, Lock, Building2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = isRegister
        ? await authApi.register({ email, password, companyName })
        : await authApi.login({ email, password });
      login(res.data);
      toast.success(isRegister ? 'Account created!' : 'Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-primary-950/20" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-carbon-500/5 rounded-full blur-3xl" />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 shadow-glow mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">RouteIQ</h1>
          <p className="text-slate-400 mt-1">Proactive Dispatch Intelligence</p>
        </div>

        {/* Card */}
        <div className="card border-slate-700/40">
          <div className="flex mb-6 bg-slate-800/50 rounded-xl p-1">
            <button
              onClick={() => setIsRegister(false)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                !isRegister ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setIsRegister(true)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isRegister ? 'bg-primary-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field pl-10"
                  required
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-10"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-10"
                required
                minLength={5}
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2">
              {loading ? (
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {!isRegister && (
            <div className="mt-4 p-3 bg-slate-800/40 rounded-xl border border-slate-700/40">
              <p className="text-xs text-slate-400 text-center">
                Demo: <span className="text-primary-400 font-mono">demo@routeiq.in</span> / <span className="text-primary-400 font-mono">demo123</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
