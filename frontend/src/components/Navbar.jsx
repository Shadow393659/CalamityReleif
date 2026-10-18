import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Radio,
  Layers,
  Map,
  BarChart3,
  Flame,
  PhoneCall,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { getSocket } from '../services/socket';

export default function Navbar({ user, onLogout }) {
  const [isConnected, setIsConnected] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const socket = getSocket();
    if (user) {
      socket.connect();
    } else {
      socket.disconnect();
      setIsConnected(false);
    }

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (socket.connected) {
      setIsConnected(true);
    }

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, [user?.id]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const allLinks = [
    { to: '/', label: 'Overview', icon: Layers },
    { to: '/report', label: 'Report Emergency (SOS)', icon: Flame, isEmergency: true, roles: ['citizen', 'admin'] },
    { to: '/field-feed', label: 'Field Dispatch', icon: Radio, roles: ['ngo', 'admin'] },
    { to: '/command-center', label: 'Command Center', icon: Map, roles: ['admin'] },
    { to: '/admin', label: 'SitRep & Analytics', icon: BarChart3, roles: ['admin'] },
  ];
  const navLinks = user
    ? allLinks.filter((link) => !link.roles || link.roles.includes(user.accessRole))
    : [];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Official Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-blue-900 transition-colors">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-tight text-slate-900 group-hover:text-blue-900 transition-colors">
                  NOOR
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  //
                </span>
                <span className="text-xs font-semibold text-slate-600 hidden sm:inline">
                  National Operations & Relief
                </span>
              </div>
              <span className="text-[10px] uppercase font-medium tracking-wider text-slate-500 block -mt-0.5">
                Disaster Coordination Command
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon, isEmergency }) => {
              if (isEmergency) {
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                        isActive
                          ? 'bg-rose-700 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`
                    }
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </NavLink>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Understated Status Indicators */}
          <div className="hidden lg:flex items-center gap-3">
            {user && <span className="text-xs font-semibold text-slate-600">{user.name} · {user.accessRole.toUpperCase()}</span>}
            {user ? (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            ) : (
              <Link to="/login" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800">
                Sign in
              </Link>
            )}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                }`}
              />
              <span>{isConnected ? 'Telemetry Active' : 'Connecting...'}</span>
            </div>

            <a
              href="tel:112"
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-slate-600" />
              <span>Helpline: 112</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {!user && (
              <Link to="/login" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white">
                Sign in
              </Link>
            )}
            {user && (
              <button type="button" onClick={onLogout} aria-label="Sign out" className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100">
                <LogOut className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-1.5 shadow-lg">
          {!user && (
            <Link to="/login" className="block rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white">
              Sign in
            </Link>
          )}
          {user && <div className="px-3 py-2 text-xs font-semibold text-slate-600">{user.name} · {user.accessRole.toUpperCase()}</div>}
          {navLinks.map(({ to, label, icon: Icon, isEmergency }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEmergency
                    ? 'bg-rose-600 text-white font-semibold'
                    : isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </NavLink>
          ))}
          <div className="pt-2 border-t border-slate-100 text-xs flex justify-between text-slate-500">
            <span>System: {isConnected ? 'Online' : 'Offline'}</span>
            <span className="font-semibold text-slate-700">Helpline: 112</span>
          </div>
        </div>
      )}
    </header>
  );
}
