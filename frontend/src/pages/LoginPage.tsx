import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Shield, UserCheck, Lock, Phone, Mail, Sparkles, CheckCircle2,
  ArrowRight, KeyRound, Building, AlertCircle
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, login, quickLoginAs } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'student' | 'official' | 'admin'>('student');
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  
  // Student form state
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('123456');
  const [otpSent, setOtpSent] = useState(true);

  // Official & Admin form state
  const [email, setEmail] = useState('officer.finance@aicte.gov.in');
  const [password, setPassword] = useState('DemoPass@123');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'admin') navigate('/root-cause');
      else navigate('/official');
    }
  }, [user, navigate]);

  useEffect(() => {
    api.getDemoUsers()
      .then(res => setDemoUsers(res))
      .catch(() => {});
  }, []);

  // Update default form inputs when changing tabs
  const handleTabChange = (tab: 'student' | 'official' | 'admin') => {
    setActiveTab(tab);
    setError(null);
    if (tab === 'student') {
      setPhone('9876543210');
      setOtp('123456');
      setOtpSent(true);
    } else if (tab === 'official') {
      setEmail('officer.finance@aicte.gov.in');
      setPassword('DemoPass@123');
    } else {
      setEmail('admin@aicte.gov.in');
      setPassword('DemoPass@123');
    }
  };

  const fillDemoCredentials = () => {
    setError(null);
    if (activeTab === 'student') {
      setPhone('9876543210');
      setOtp('123456');
      setOtpSent(true);
    } else if (activeTab === 'official') {
      setEmail('officer.finance@aicte.gov.in');
      setPassword('DemoPass@123');
    } else {
      setEmail('admin@aicte.gov.in');
      setPassword('DemoPass@123');
    }
  };

  const handleSendOtp = async () => {
    try {
      setLoading(true);
      setError(null);
      await api.requestOtp(phone);
      setOtpSent(true);
      setOtp('123456');
    } catch (err: any) {
      setError(err.message || "Failed to dispatch OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (activeTab === 'student') {
        await login({ role: 'student', phone, otp });
        navigate('/student');
      } else {
        await login({ role: activeTab, email, password });
        if (activeTab === 'admin') {
          navigate('/root-cause');
        } else {
          navigate('/official');
        }
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoPerson: any) => {
    setError(null);
    setLoading(true);
    try {
      await quickLoginAs(demoPerson);
      if (demoPerson.role === 'student') navigate('/student');
      else if (demoPerson.role === 'admin') navigate('/root-cause');
      else navigate('/official');
    } catch (err: any) {
      setError(err.message || "Quick demo login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Subtle Tech Grid */}
      <div className="max-w-4xl mx-auto w-full space-y-6">
        
        {/* Header Title Section */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 border border-teal-500/30 text-teal-700 dark:text-cyan-400 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5" />
            <span>National Regulatory Complaint Intelligence Platform</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            AICTE Complaint Intelligence Hub (CIH)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            {t('tagline')}
          </p>
        </div>

        {/* 1-Click Demo Persona Bar (Mandatory Requirement) */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-xl border border-teal-500/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
              {t('login.demoModeBanner')}
            </span>
            <span className="text-[11px] text-slate-400">Click any persona to log in instantly</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {demoUsers.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleQuickLogin(p)}
                className="text-left p-2.5 rounded-xl bg-slate-800/80 hover:bg-teal-900/60 border border-slate-700 hover:border-cyan-400/50 transition-all hover:scale-[1.02] flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold text-teal-400 bg-teal-950/80 px-1.5 py-0.5 rounded">
                      {p.role_tab}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                  </div>
                  <div className="font-semibold text-xs text-white mt-1.5 truncate">{p.name}</div>
                  <div className="text-[11px] text-slate-300 font-mono leading-tight">{p.level}</div>
                </div>
                <div className="mt-2 text-[10px] text-cyan-300/80 italic line-clamp-2">
                  {p.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Unified Login Box with 3 Role Tabs */}
        <div className="bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Role Tabs */}
          <div className="grid grid-cols-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => handleTabChange('student')}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'student'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>Student Complainant</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('official')}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'official'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>AICTE Official</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('admin')}
              className={`py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-white dark:bg-slate-800 text-teal-600 dark:text-cyan-400 shadow-md border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin / Leadership</span>
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* STUDENT TAB */}
              {activeTab === 'student' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Enter 10-digit mobile number"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        One Time Password (OTP)
                      </label>
                      <span className="text-[11px] font-semibold text-teal-600 dark:text-cyan-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded border border-teal-500/30">
                        Mock OTP: 123456
                      </span>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={otp}
                        onChange={e => setOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* OFFICIAL & ADMIN TABS */}
              {activeTab !== 'student' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Official Government Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder={activeTab === 'admin' ? "admin@aicte.gov.in" : "officer.finance@aicte.gov.in"}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Password
                      </label>
                      <span className="text-[11px] text-slate-400 font-mono">Default: DemoPass@123</span>
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <span>{loading ? "Authenticating..." : t('login.signIn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={fillDemoCredentials}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('login.fillDemo')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
