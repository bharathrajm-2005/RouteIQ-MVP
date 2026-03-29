import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { alertApi } from '../api';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Send, AlertTriangle, Leaf, LogOut, Zap
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [alertCount, setAlertCount] = useState(0);
  const location = useLocation();

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await alertApi.count();
        setAlertCount(res.data.count || 0);
      } catch { setAlertCount(0); }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const linkClass = (path) =>
    location.pathname === path ? 'nav-link-active' : 'nav-link';

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/60 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">RouteIQ</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Dispatch Intelligence</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 p-4 space-y-1">
        <NavLink to="/" className={linkClass('/')}>
          <LayoutDashboard className="w-4 h-4" />
          Dashboard
        </NavLink>
        <NavLink to="/dispatch" className={linkClass('/dispatch')}>
          <Send className="w-4 h-4" />
          Dispatch
        </NavLink>
        <NavLink to="/alerts" className={linkClass('/alerts')}>
          <div className="flex items-center gap-2 w-full">
            <AlertTriangle className="w-4 h-4" />
            <span>Alerts</span>
            {alertCount > 0 && (
              <span className="ml-auto bg-danger-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {alertCount}
              </span>
            )}
          </div>
        </NavLink>
        <NavLink to="/carbon" className={linkClass('/carbon')}>
          <Leaf className="w-4 h-4" />
          Carbon Report
        </NavLink>
      </div>

      {/* User section */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-white truncate">{user?.companyName}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="nav-link w-full text-danger-400 hover:text-danger-300 hover:bg-danger-500/10"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </nav>
  );
}
