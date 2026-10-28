import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  Activity, Building2, Network, Sliders, BookOpen,
  FileText, Sparkles, ChevronRight, Compass,
  Copy, AlertTriangle, Clock, Shield, TrendingUp
} from 'lucide-react';

interface SidebarProps {
  onOpenDemoGuide?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenDemoGuide, isOpen = true, onClose }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const isOfficial = user.role !== 'student';
  const isAdmin = user.role === 'admin';

  return (
    <aside
      className={`fixed md:sticky top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}
    >
      <div className="p-3.5 space-y-6 overflow-y-auto">
        {/* Navigation Section Title */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Compass className="w-3 h-3 text-teal-600 dark:text-teal-400" />
            <span>{t('navModules', 'Navigation Modules')}</span>
          </div>

          <nav className="space-y-1">
            {/* Student Portal Vertical Navigation Links */}
            {user.role === 'student' && (
              <div className="space-y-1">
                {/* 1. File Grievance */}
                <Link
                  to="/student?tab=file"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/student' && (new URLSearchParams(location.search).get('tab') === 'file' || !new URLSearchParams(location.search).get('tab'))
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/student' && (new URLSearchParams(location.search).get('tab') === 'file' || !new URLSearchParams(location.search).get('tab')) ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>{t('student.fileComplaint', 'File Grievance')}</span>
                  </div>
                  {location.pathname === '/student' && (new URLSearchParams(location.search).get('tab') === 'file' || !new URLSearchParams(location.search).get('tab')) && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 2. My Grievances & Tracking */}
                <Link
                  to="/student?tab=track"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'track'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'track' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <Clock className="w-4 h-4" />
                    </div>
                    <span>{t('student.trackStatus', 'My Grievances & Tracking')}</span>
                  </div>
                  {location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'track' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 3. AICTE Resolution Timeline & Progress (Prompt 3 & 4) */}
                <Link
                  to="/student?tab=timeline"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'timeline'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'timeline' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-cyan-500'}`}>
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <span>AICTE Resolution Timeline & Progress</span>
                  </div>
                  {location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'timeline' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 4. AICTE College Record (Prompt 6 & 7) */}
                <Link
                  to="/student?tab=record"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'record'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'record' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-amber-500'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>AICTE College Record</span>
                  </div>
                  {location.pathname === '/student' && new URLSearchParams(location.search).get('tab') === 'record' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>
              </div>
            )}

            {/* Admin Dedicated Navigation Links */}
            {/* Admin Dedicated Navigation Links (Prompt 2: Dashboard, Insights, Network, Institutions, Escalations, Reports, Settings) */}
            {isAdmin && (
              <>
                {/* 1. Dashboard */}
                <Link
                  to="/admin"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/admin'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-bold shadow-sm border border-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/admin' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <span>Dashboard</span>
                  </div>
                  {location.pathname === '/admin' && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                </Link>

                {/* 2. Insights */}
                <Link
                  to="/admin/insights"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/admin/insights' || location.pathname === '/root-cause'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-200 font-bold shadow-sm border border-indigo-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/admin/insights' || location.pathname === '/root-cause' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400'}`}>
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <span>Insights</span>
                  </div>
                  {(location.pathname === '/admin/insights' || location.pathname === '/root-cause') && <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />}
                </Link>

                {/* 3. Network */}
                <Link
                  to="/network"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/network'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/network' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-cyan-500'}`}>
                      <Network className="w-4 h-4" />
                    </div>
                    <span>Network</span>
                  </div>
                  {location.pathname === '/network' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 4. Institutions */}
                <Link
                  to="/institutions"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname.startsWith('/institution')
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname.startsWith('/institution') ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>Institutions</span>
                  </div>
                  {location.pathname.startsWith('/institution') && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 5. Escalations */}
                <Link
                  to="/admin/escalations"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/admin/escalations'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 font-bold shadow-sm border border-amber-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/admin/escalations' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <span>Escalations</span>
                  </div>
                  {location.pathname === '/admin/escalations' && <ChevronRight className="w-3.5 h-3.5 text-amber-600" />}
                </Link>

                {/* 6. Reports */}
                <Link
                  to="/analytics"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/analytics'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/analytics' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>Reports</span>
                  </div>
                  {location.pathname === '/analytics' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 7. Settings */}
                <Link
                  to="/settings"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/settings'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/settings' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span>Settings</span>
                  </div>
                  {location.pathname === '/settings' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>
              </>
            )}

            {/* Official Workspace Links (Only for Case Officers / Officials) */}
            {user.role === 'official' && (
              <>
                {/* 1. Official Workspace */}
                <Link
                  to="/official"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/official'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/official' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <span>{t('nav.workspace')}</span>
                  </div>
                  {location.pathname === '/official' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 2. Institution 360 */}
                <Link
                  to="/institutions"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname.startsWith('/institution')
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname.startsWith('/institution') ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <Building2 className="w-4 h-4" />
                    </div>
                    <span>{t('nav.institution360')}</span>
                  </div>
                  {location.pathname.startsWith('/institution') && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 3. Visual Analytics Studio */}
                <Link
                  to="/analytics"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/analytics'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/analytics' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-teal-600 dark:text-teal-400'}`}>
                      <Activity className="w-4 h-4" />
                    </div>
                    <span>{t('nav.analyticsStudio')}</span>
                  </div>
                  {location.pathname === '/analytics' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 4. Case Network Intelligence */}
                <Link
                  to="/network"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/network'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/network' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-cyan-500'}`}>
                      <Network className="w-4 h-4" />
                    </div>
                    <span className="bg-gradient-to-r from-teal-700 to-cyan-600 dark:from-teal-300 dark:to-cyan-400 bg-clip-text text-transparent font-bold">
                      {t('nav.networkMap')}
                    </span>
                  </div>
                  {location.pathname === '/network' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* 5. Settings & Audit */}
                <Link
                  to="/settings"
                  onClick={onClose}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    location.pathname === '/settings'
                      ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-200 font-bold shadow-sm border border-teal-500/30'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1.5 rounded-lg ${location.pathname === '/settings' ? 'bg-teal-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                      <Sliders className="w-4 h-4" />
                    </div>
                    <span>{t('nav.settings')}</span>
                  </div>
                  {location.pathname === '/settings' && <ChevronRight className="w-3.5 h-3.5 text-teal-600" />}
                </Link>

                {/* Vertical AI Intelligence Modules for Case Officers */}
                <div className="pt-3 pb-1 border-t border-slate-200 dark:border-slate-800 mt-2">
                  <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-cyan-400 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>{t('aiModules', 'AI Intelligence Modules')}</span>
                  </div>

                  <div className="space-y-0.5">
                    {/* 1. AI Complaint Classification */}
                    <Link
                      to="/official?feature=classification"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-cyan-400">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{t('aiFeatures.classification', 'AI Classification')}</span>
                      </div>
                      <span className="text-[9px] font-mono text-teal-600 font-bold">94%</span>
                    </Link>

                    {/* 2. Duplicate Complaint Detection */}
                    <Link
                      to="/official?feature=duplicates"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400">
                          <Copy className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{t('aiFeatures.duplicateDetection', 'Duplicate Detection')}</span>
                      </div>
                      <span className="text-[9px] font-mono text-amber-600 font-bold">82%</span>
                    </Link>

                    {/* 3. Cross Department Alert */}
                    <Link
                      to="/official?feature=cross_dept"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{t('aiFeatures.crossDeptAlert', 'Cross-Dept Alert')}</span>
                      </div>
                      <span className="text-[9px] font-mono text-red-600 font-bold">4 Depts</span>
                    </Link>

                    {/* 4. Deadline Tracking */}
                    <Link
                      to="/official?feature=deadlines"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{t('aiFeatures.deadlineTracking', 'Deadline Tracking')}</span>
                      </div>
                      <span className="text-[9px] font-mono text-purple-600 font-bold">30d SLA</span>
                    </Link>

                    {/* 5. College Risk Score */}
                    <Link
                      to="/official?feature=college_risk"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                          <Shield className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{t('aiFeatures.collegeRiskScore', 'College Risk Score')}</span>
                      </div>
                      <span className="text-[9px] font-mono text-orange-600 font-bold">88.5</span>
                    </Link>

                    {/* 6. Root Cause Insight Dashboard */}
                    <Link
                      to="/official?feature=root_cause"
                      onClick={onClose}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <div className="p-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate">{t('aiFeatures.rootCauseHub', 'Root Cause Hub')}</span>
                      </div>
                      <span className="text-[9px] font-mono text-indigo-600 font-bold">+38%</span>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Bottom Action: Demo Guide Button */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
        <button
          onClick={() => {
            if (onOpenDemoGuide) onOpenDemoGuide();
            if (onClose) onClose();
          }}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600 transition-all hover:scale-[1.02] active:scale-[0.98]"
          title="Open 8-step End-to-End Demo Scenario Guide"
        >
          <BookOpen className="w-4 h-4" />
          <span>{t('nav.demoScript')}</span>
        </button>
      </div>
    </aside>
  );
};
