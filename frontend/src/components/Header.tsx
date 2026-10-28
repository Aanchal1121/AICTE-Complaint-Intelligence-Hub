import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../api';
import {
  Shield, Moon, Sun, Globe, Bell, Eye, LogOut, BookOpen,
  ChevronDown, CheckCircle2, AlertTriangle, Building2,
  FileText, Activity, Network, Sliders, Menu, X, Sparkles
} from 'lucide-react';

interface HeaderProps {
  onOpenDemoGuide?: () => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onOpenDemoGuide, onToggleSidebar, sidebarOpen }) => {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggleDark, isHighContrast, toggleHighContrast, isLargeText, toggleLargeText } = useTheme();
  const location = useLocation();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const [currentLang, setCurrentLang] = useState<string>(() => i18n.language || localStorage.getItem('cih_language') || 'en');

  useEffect(() => {
    const handleLangChange = (lng: string) => {
      setCurrentLang(lng);
    };
    i18n.on('languageChanged', handleLangChange);
    return () => {
      i18n.off('languageChanged', handleLangChange);
    };
  }, [i18n]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      api.getNotifications()
        .then(res => setNotifications(res.notifications || []))
        .catch(() => {});
    }
  }, [user]);

  const changeLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang);
    setCurrentLang(lang);
    localStorage.setItem('cih_language', lang);
    setLangMenuOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Government Tricolor Stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-white to-emerald-600 dark:from-amber-600 dark:via-slate-800 dark:to-emerald-700" />

      {/* Main Header Container */}
      <div className="w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Left Group: Mobile Menu Toggle + Aligned Logo (Image 2) */}
          <div className="flex items-center space-x-3 min-w-0">
            {user && (
              <button
                onClick={onToggleSidebar}
                className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800 md:hidden"
                aria-label="Toggle Navigation Sidebar"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* Logo & Emblem - Cleanly Aligned (Image 2) */}
            <Link to="/" className="flex items-center space-x-3 group shrink-0 py-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-900 to-teal-700 dark:from-teal-600 dark:to-cyan-500 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform shrink-0">
                <Shield className="w-5 h-5 text-cyan-300 dark:text-slate-950" />
              </div>
              <div className="flex flex-col justify-center select-none">
                <div className="flex items-center space-x-1.5 leading-none mb-0.5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-teal-700 dark:text-teal-400 whitespace-nowrap">
                    {t('govtOfIndia', 'Govt. of India')}
                  </span>
                  <span className="text-[9px] text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    AICTE
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight flex items-center gap-1.5 whitespace-nowrap">
                  <span>{t('appName', 'AICTE Complaint Intelligence Hub')}</span>
                  <span className="text-[9px] text-teal-700 dark:text-cyan-400 font-bold bg-teal-50 dark:bg-teal-950/80 border border-teal-500/30 px-1.5 py-0.2 rounded font-mono">
                    CIH
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Right Side: Language, Accessibility, Theme, Notifications, Profile */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Language Switcher */}
            <div className="relative group" ref={langRef}>
              <button
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs flex items-center space-x-1"
                aria-label="Change Language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span className="uppercase font-semibold">{currentLang}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              <div
                className={`absolute right-0 mt-1 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl py-1 z-50 ${
                  langMenuOpen ? 'block' : 'hidden group-hover:block'
                }`}
              >
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => changeLanguage(l.code)}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between ${
                      currentLang === l.code ? 'font-bold text-teal-600 dark:text-teal-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{l.label}</span>
                    {currentLang === l.code && <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Accessibility: Font size & Contrast */}
            <button
              onClick={toggleLargeText}
              className={`p-1.5 rounded-lg text-xs font-bold border transition-colors ${
                isLargeText
                  ? 'bg-teal-600 text-white border-teal-600'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800'
              }`}
              title="Toggle Large Text (Accessibility)"
              aria-label="Toggle text size"
            >
              A+
            </button>

            <button
              onClick={toggleHighContrast}
              className={`p-1.5 rounded-lg text-xs border transition-colors ${
                isHighContrast
                  ? 'bg-yellow-400 text-black border-yellow-400 font-bold'
                  : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-100/80 dark:bg-slate-800'
              }`}
              title="High Contrast Mode"
              aria-label="Toggle High Contrast"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              aria-label="Toggle Light/Dark Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Notifications */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 relative"
                  aria-label="View Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl p-3 z-50">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Alerts & Escalations
                      </span>
                      <span className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold">
                        Multi-Channel Dispatch
                      </span>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-4">No new alerts</p>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            className={`p-2 rounded-lg text-xs border ${
                              n.type === 'sla_breach'
                                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900'
                                : n.type === 'conflict_alert'
                                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
                                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                              {n.type === 'sla_breach' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                              {n.type === 'conflict_alert' && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                              {n.title}
                            </div>
                            <div className="text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</div>
                            {n.channel_log && (
                              <div className="mt-1 text-[10px] font-mono text-slate-400">
                                SMS/Email dispatched
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Profile Pill or Login link */}
            {user ? (
              <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-3">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white max-w-[140px] truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-teal-600 dark:text-cyan-400 font-mono">
                    {user.level} {user.bureau ? `(${user.bureau})` : (user.state ? `(${user.state})` : '')}
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-red-600 hover:border-red-300 dark:hover:border-red-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
