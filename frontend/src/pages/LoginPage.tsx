import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Shield, UserCheck, Lock, Mail, Sparkles, CheckCircle2,
  ArrowRight, KeyRound, Building, AlertCircle, GraduationCap,
  School, Hash, BookOpen, Calendar, User, Eye, EyeOff, AlertTriangle, X
} from 'lucide-react';

interface PopupModalState {
  isOpen: boolean;
  type: 'error' | 'success' | 'warning';
  title: string;
  message: string;
  buttonLabel?: string;
  showSignUpOption?: boolean;
  onClose?: () => void;
}

export const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { user, login, quickLoginAs } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'student' | 'official' | 'admin'>('student');
  const [studentAuthMode, setStudentAuthMode] = useState<'login' | 'signup'>('login');
  const [demoUsers, setDemoUsers] = useState<any[]>([]);
  const [institutionsList, setInstitutionsList] = useState<any[]>([]);

  // Student Sign In state
  const [enrollmentNo, setEnrollmentNo] = useState('EN2023CS0481');
  const [studentPassword, setStudentPassword] = useState('StudentPass@123');
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  // Student Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupCollege, setSignupCollege] = useState('');
  const [signupEnrollment, setSignupEnrollment] = useState('');
  const [signupClass, setSignupClass] = useState('B.Tech');
  const [signupBranch, setSignupBranch] = useState('Computer Science & Engineering');
  const [signupGender, setSignupGender] = useState('Male');
  const [signupYear, setSignupYear] = useState('1st Year');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  // Official & Admin form state
  const [email, setEmail] = useState('officer.finance@aicte.gov.in');
  const [password, setPassword] = useState('DemoPass@123');

  // English Popup Modal state
  const [popup, setPopup] = useState<PopupModalState | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/official');
    }
  }, [user, navigate]);

  useEffect(() => {
    api.getDemoUsers()
      .then(res => setDemoUsers(res))
      .catch(() => {});

    api.getInstitutions()
      .then(res => {
        if (Array.isArray(res)) setInstitutionsList(res);
        else if (res?.items) setInstitutionsList(res.items);
      })
      .catch(() => {});
  }, []);

  // Update default form inputs when changing tabs
  const handleTabChange = (tab: 'student' | 'official' | 'admin') => {
    setActiveTab(tab);
    if (tab === 'student') {
      setEnrollmentNo('EN2023CS0481');
      setStudentPassword('StudentPass@123');
    } else if (tab === 'official') {
      setEmail('officer.finance@aicte.gov.in');
      setPassword('DemoPass@123');
    } else {
      setEmail('admin@aicte.gov.in');
      setPassword('DemoPass@123');
    }
  };

  const fillDemoCredentials = () => {
    if (activeTab === 'student') {
      setStudentAuthMode('login');
      setEnrollmentNo('EN2023CS0481');
      setStudentPassword('StudentPass@123');
    } else if (activeTab === 'official') {
      setEmail('officer.finance@aicte.gov.in');
      setPassword('DemoPass@123');
    } else {
      setEmail('admin@aicte.gov.in');
      setPassword('DemoPass@123');
    }
  };

  const handleStudentSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validation checks
    if (!signupName.trim() || !signupCollege.trim() || !signupEnrollment.trim() || !signupPassword.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Incomplete Registration Details',
        message: 'Please fill in all mandatory fields: Student Name, College Name, Enrollment Number, and Password.',
        buttonLabel: 'Review Fields'
      });
      return;
    }

    if (signupPassword !== signupConfirmPassword) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please ensure Password and Confirm Password are typed identically.',
        buttonLabel: 'Fix Password'
      });
      return;
    }

    if (signupPassword.length < 4) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Password Too Short',
        message: 'Password must be at least 4 characters long.',
        buttonLabel: 'Update Password'
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: signupName.trim(),
        college_name: signupCollege.trim(),
        enrollment_no: signupEnrollment.trim().toUpperCase(),
        student_class: signupClass,
        branch: signupBranch,
        gender: signupGender,
        year: signupYear,
        password: signupPassword,
        confirm_password: signupConfirmPassword,
        phone: signupPhone.trim(),
        email: signupEmail.trim()
      };

      const res = await api.studentRegister(payload);

      setPopup({
        isOpen: true,
        type: 'success',
        title: 'Registration Successful!',
        message: `Student account registered successfully for ${signupName} (${signupEnrollment.trim().toUpperCase()})! You may now sign in using your Enrollment Number and Password.`,
        buttonLabel: 'Sign In Now',
        onClose: () => {
          setEnrollmentNo(signupEnrollment.trim().toUpperCase());
          setStudentPassword(signupPassword);
          setStudentAuthMode('login');
        }
      });
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Registration Error',
        message: err.message || 'Failed to complete student registration. Please verify your details and try again.',
        buttonLabel: 'Try Again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!enrollmentNo.trim() || !studentPassword.trim()) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Missing Credentials',
        message: 'Please enter both your Enrollment Number and Password to log in.',
        buttonLabel: 'Okay'
      });
      return;
    }

    setLoading(true);
    try {
      await login({
        role: 'student',
        enrollment_no: enrollmentNo.trim(),
        password: studentPassword
      });
      navigate('/student');
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Invalid Enrollment Number or Password. Please verify your credentials and try again.',
        buttonLabel: 'Try Again',
        showSignUpOption: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOfficialOrAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ role: activeTab, email, password });
      if (activeTab === 'admin') {
        navigate('/admin');
      } else {
        navigate('/official');
      }
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Invalid Official credentials entered. Please check your email and password.',
        buttonLabel: 'Try Again'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoPerson: any) => {
    setLoading(true);
    try {
      await quickLoginAs(demoPerson);
      if (demoPerson.role === 'student') navigate('/student');
      else if (demoPerson.role === 'admin') navigate('/admin');
      else navigate('/official');
    } catch (err: any) {
      setPopup({
        isOpen: true,
        type: 'error',
        title: 'Demo Login Failed',
        message: err.message || 'Quick demo authentication failed.',
        buttonLabel: 'Dismiss'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.25rem)] bg-slate-100 dark:bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 relative">
      
      {/* ================= ENGLISH POPUP MODAL ================= */}
      {popup && popup.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full overflow-hidden p-6 text-center transform transition-all scale-100 relative">
            <button
              onClick={() => {
                const cb = popup.onClose;
                setPopup(null);
                if (cb) cb();
              }}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${
              popup.type === 'error'
                ? 'bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900'
                : popup.type === 'warning'
                ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                : 'bg-teal-100 dark:bg-teal-950/70 text-teal-600 dark:text-cyan-400 border border-teal-200 dark:border-teal-900'
            }`}>
              {popup.type === 'error' ? (
                <AlertCircle className="w-8 h-8" />
              ) : popup.type === 'warning' ? (
                <AlertTriangle className="w-8 h-8" />
              ) : (
                <CheckCircle2 className="w-8 h-8" />
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              {popup.title}
            </h3>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {popup.message}
            </p>

            <div className="flex gap-2 justify-center">
              {popup.showSignUpOption && (
                <button
                  type="button"
                  onClick={() => {
                    setPopup(null);
                    setStudentAuthMode('signup');
                  }}
                  className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  Create Student Account
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const cb = popup.onClose;
                  setPopup(null);
                  if (cb) cb();
                }}
                className={`px-6 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-md transition ${
                  popup.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : popup.type === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                {popup.buttonLabel || 'Dismiss'}
              </button>
            </div>
          </div>
        </div>
      )}

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

        {/* 1-Click Demo Persona Bar */}
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
              <GraduationCap className="w-4 h-4" />
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
            {/* STUDENT SECTION: SIGN IN OR SIGN UP TOGGLE */}
            {activeTab === 'student' && (
              <div className="mb-6">
                <div className="flex items-center justify-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl max-w-xs mx-auto border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setStudentAuthMode('login')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      studentAuthMode === 'login'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-cyan-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Sign In (Login)
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentAuthMode('signup')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                      studentAuthMode === 'signup'
                        ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-cyan-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Sign Up (Register)
                  </button>
                </div>
              </div>
            )}

            {/* ================= STUDENT SIGN IN FORM ================= */}
            {activeTab === 'student' && studentAuthMode === 'login' && (
              <form onSubmit={handleStudentSignIn} className="space-y-4">
                <div className="p-3 bg-teal-50/70 dark:bg-teal-950/40 rounded-xl border border-teal-200 dark:border-teal-900/50 flex items-center justify-between text-xs text-teal-800 dark:text-cyan-300">
                  <span className="flex items-center gap-1.5 font-medium">
                    <UserCheck className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                    Sign in with your College Enrollment No. & Password
                  </span>
                  <button
                    type="button"
                    onClick={() => setStudentAuthMode('signup')}
                    className="font-bold underline hover:text-teal-950 dark:hover:text-white"
                  >
                    New Student? Sign Up
                  </button>
                </div>

                {/* Enrollment Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Enrollment Number <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Demo: EN2023CS0481</span>
                  </div>
                  <div className="relative">
                    <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={enrollmentNo}
                      onChange={e => setEnrollmentNo(e.target.value)}
                      placeholder="e.g. EN2023CS0481 or Roll No."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">Demo: StudentPass@123</span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type={showStudentPassword ? "text" : "password"}
                      value={studentPassword}
                      onChange={e => setStudentPassword(e.target.value)}
                      placeholder="Enter student account password"
                      className="w-full pl-9 pr-10 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowStudentPassword(!showStudentPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <span>{loading ? "Authenticating..." : "Sign In to CIH"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={fillDemoCredentials}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Fill Demo Credentials</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= STUDENT SIGN UP FORM ================= */}
            {activeTab === 'student' && studentAuthMode === 'signup' && (
              <form onSubmit={handleStudentSignUp} className="space-y-4">
                <div className="p-3 bg-cyan-50/70 dark:bg-cyan-950/40 rounded-xl border border-cyan-200 dark:border-cyan-900/50 flex items-center justify-between text-xs text-cyan-900 dark:text-cyan-200">
                  <span className="flex items-center gap-1.5 font-medium">
                    <GraduationCap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                    Student Registration: Enter your college and academic details below
                  </span>
                  <button
                    type="button"
                    onClick={() => setStudentAuthMode('login')}
                    className="font-bold underline hover:text-cyan-950 dark:hover:text-white"
                  >
                    Already registered? Sign In
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Full Student Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={signupName}
                        onChange={e => setSignupName(e.target.value)}
                        placeholder="e.g. Aarav Sharma"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Enrollment No */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Enrollment Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        value={signupEnrollment}
                        onChange={e => setSignupEnrollment(e.target.value)}
                        placeholder="e.g. EN2024CS0892"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none font-mono uppercase"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* College Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    College / Technical Institute Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <School className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      list="colleges-datalist"
                      value={signupCollege}
                      onChange={e => setSignupCollege(e.target.value)}
                      placeholder="Select or enter your AICTE approved institution"
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      required
                    />
                    <datalist id="colleges-datalist">
                      {institutionsList.map(inst => (
                        <option key={inst.id} value={inst.name}>
                          {inst.name} ({inst.state})
                        </option>
                      ))}
                      <option value="Apex Institute of Technology & Management, Indore" />
                      <option value="Malwa Institute of Science & Technology, Indore" />
                      <option value="Devi Ahilya Vishwavidyalaya - IET, Indore" />
                      <option value="Shri Govindram Seksaria Institute of Technology and Science, Indore" />
                      <option value="Bansal Institute of Science and Technology, Bhopal" />
                    </datalist>
                  </div>
                </div>

                {/* Class & Branch */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Class / Degree Program <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                      <select
                        value={signupClass}
                        onChange={e => setSignupClass(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="B.Tech">B.Tech / B.E.</option>
                        <option value="M.Tech">M.Tech / M.E.</option>
                        <option value="MCA">MCA</option>
                        <option value="MBA">MBA / PGDM</option>
                        <option value="Diploma">Diploma in Engineering</option>
                        <option value="B.Pharm">B.Pharm</option>
                        <option value="M.Pharm">M.Pharm</option>
                        <option value="B.Arch">B.Arch</option>
                        <option value="Other">Other Technical Course</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Branch / Specialization <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={signupBranch}
                      onChange={e => setSignupBranch(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Artificial Intelligence & Data Science">AI & Data Science</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Chemical Engineering">Chemical Engineering</option>
                      <option value="Pharmacy">Pharmacy</option>
                      <option value="Management Studies">Management Studies</option>
                      <option value="Other">Other Specialization</option>
                    </select>
                  </div>
                </div>

                {/* Gender & Year */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Gender <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={signupGender}
                      onChange={e => setSignupGender(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Year of Study <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                      <select
                        value={signupYear}
                        onChange={e => setSignupYear(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                        <option value="Final Year / 5th Year">Final Year / 5th Year</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        value={signupPassword}
                        onChange={e => setSignupPassword(e.target.value)}
                        placeholder="Create password"
                        className="w-full pl-9 pr-9 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword(!showSignupPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        value={signupConfirmPassword}
                        onChange={e => setSignupConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Phone & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Mobile Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={signupPhone}
                      onChange={e => setSignupPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={e => setSignupEmail(e.target.value)}
                      placeholder="student@example.com"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>{loading ? "Registering Student Account..." : "Complete Student Sign Up"}</span>
                  </button>
                </div>
              </form>
            )}

            {/* ================= OFFICIAL & ADMIN TABS ================= */}
            {activeTab !== 'student' && (
              <form onSubmit={handleOfficialOrAdminSubmit} className="space-y-4">
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
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
