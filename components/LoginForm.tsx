import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { ShieldCheck, Lock, User as UserIcon, AlertTriangle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Mock Authentication Logic
    setTimeout(() => {
      if (username.toLowerCase() === 'admin' && password === 'admin') {
        onLogin({ username: 'Administrator', role: 'ADMIN', lastLogin: new Date().toLocaleString() });
      } else if (username.toLowerCase() === 'manager' && password === 'manager') {
        onLogin({ username: 'Site Manager', role: 'MANAGER', lastLogin: new Date().toLocaleString() });
      } else if (username.toLowerCase() === 'user' && password === 'user') {
        onLogin({ username: 'Operator', role: 'USER', lastLogin: new Date().toLocaleString() });
      } else {
        setError('Invalid credentials. Access denied.');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-scada-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-scada-accent rounded-full blur-[100px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-scada-panel border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-scada-accent/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-scada-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">EcoFlux SCADA</h1>
          <p className="text-scada-muted text-sm mt-1">Secure Industrial Access Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2 text-red-400 text-sm">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-scada-muted uppercase tracking-wider mb-2">Username</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-scada-accent focus:border-transparent transition-all"
                placeholder="Enter ID"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-scada-muted uppercase tracking-wider mb-2">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-500" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-scada-accent focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 bg-scada-accent hover:bg-sky-400 text-white font-bold rounded-lg shadow-lg shadow-sky-500/20 transition-all duration-200 transform active:scale-95 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Authenticating...
              </>
            ) : (
              'Access System'
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700/50">
          <div className="flex justify-between text-xs text-scada-muted font-mono">
            <span>System Status: <span className="text-green-500">ONLINE</span></span>
            <span>v2.1.0-build</span>
          </div>
          
          <div className="mt-4 p-3 bg-slate-800/50 rounded border border-slate-700/50 text-[10px] text-scada-muted">
             <p className="font-bold mb-1">Demo Credentials:</p>
             <div className="grid grid-cols-3 gap-2">
                 <div>Admin: admin/admin</div>
                 <div>Mgr: manager/manager</div>
                 <div>User: user/user</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
