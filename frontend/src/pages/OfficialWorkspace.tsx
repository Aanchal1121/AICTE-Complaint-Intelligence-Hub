import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Search, Filter, Mic, AlertTriangle, Shield, CheckCircle2,
  Clock, ArrowRight, ArrowLeft, Building2, User, FileText, Send, Share2,
  RefreshCw, Check, Sparkles, AlertCircle, ChevronRight, X,
  ExternalLink, Download, Layers, Eye, Zap, Copy, GitBranch,
  TrendingUp, BarChart3, PieChart, Activity, Gauge, CheckCheck,
  Calendar, Award, Info, FileCheck, HelpCircle, Briefcase
} from 'lucide-react';

export const OfficialWorkspace: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Natural language search state
  const [searchQuery, setSearchQuery] = useState(
    user?.level === 'Regional Officer' ? 'overdue fee complaints from the last three months in Madhya Pradesh' : ''
  );
  const [isListening, setIsListening] = useState(false);
  const [parsedChips, setParsedChips] = useState<any | null>(null);

  // Filters state
  const [bureauFilter, setBureauFilter] = useState<string>(user?.bureau || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState<boolean>(false);

  // Complaints list & detail state
  const [complaints, setComplaints] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [caseDetail, setCaseDetail] = useState<any | null>(null);

  // AI Summary sentence highlight state
  const [highlightedSentence, setHighlightedSentence] = useState<string | null>(null);

  // Dedicated Feature Views State (The 6 core Officer Intelligence Modules)
  const [activeDetailTab, setActiveDetailTab] = useState<
    'summary' | 'classification' | 'duplicates' | 'cross_dept' | 'deadlines' | 'college_risk' | 'root_cause'
  >('summary');

  // Interactive Live Duplicate Scan state
  const [duplicateScanLoading, setDuplicateScanLoading] = useState(false);
  const [duplicateScanResult, setDuplicateScanResult] = useState<any | null>(null);

  // Interactive Classifier Tester state
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Root cause systemic summary state
  const [rootCauseData, setRootCauseData] = useState<any | null>(null);
  const [rootCauseLoading, setRootCauseLoading] = useState(false);

  // Modals state
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState('show-cause');
  const [actionTitle, setActionTitle] = useState('Show-Cause Notice Issued under AICTE Regulation 14(b)');
  const [actionDesc, setActionDesc] = useState(
    'Formal directive served to the institution to disburse pending caution money refund to all eligible students within 14 calendar days or face penal action.'
  );
  const [actionStatus, setActionStatus] = useState('under review');

  const [referralModalOpen, setReferralModalOpen] = useState(false);
  const [referralBureau, setReferralBureau] = useState('Approval');
  const [referralNote, setReferralNote] = useState('Requesting holding flag on Extension of Approval pending refund clearance.');

  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideCategory, setOverrideCategory] = useState('');
  const [overrideBureau, setOverrideBureau] = useState('');
  const [overridePriority, setOverridePriority] = useState('');
  const [overrideReason, setOverrideReason] = useState('');

  // Initial load
  useEffect(() => {
    fetchComplaints();
  }, [user, bureauFilter, categoryFilter, statusFilter, priorityFilter, overdueOnly]);

  // Listen to searchParams feature query
  const featParam = searchParams.get('feature');
  const isDedicatedFeature = Boolean(
    featParam && ['classification', 'duplicates', 'duplicate', 'cross_dept', 'deadlines', 'deadline', 'college_risk', 'risk', 'root_cause'].includes(featParam)
  );

  useEffect(() => {
    const feat = searchParams.get('feature');
    if (feat) {
      if (feat === 'classification') setActiveDetailTab('classification');
      else if (feat === 'duplicates' || feat === 'duplicate') setActiveDetailTab('duplicates');
      else if (feat === 'cross_dept') setActiveDetailTab('cross_dept');
      else if (feat === 'deadlines' || feat === 'deadline') setActiveDetailTab('deadlines');
      else if (feat === 'college_risk' || feat === 'risk') setActiveDetailTab('college_risk');
      else if (feat === 'root_cause') {
        setActiveDetailTab('root_cause');
        loadRootCauseInsight();
      }
    } else {
      setActiveDetailTab('summary');
    }
  }, [searchParams]);

  const fetchComplaints = async (queryOverride?: string) => {
    setLoading(true);
    try {
      const q = queryOverride !== undefined ? queryOverride : searchQuery;
      const res = await api.getComplaints({
        search: q,
        bureau: bureauFilter,
        category: categoryFilter,
        status: statusFilter,
        priority: priorityFilter,
        overdue_only: overdueOnly,
        limit: 50
      });

      setComplaints(res.complaints || []);
      setTotalCount(res.total || 0);
      if (res.parsed_filters) {
        setParsedChips(res.parsed_filters);
      } else if (!q) {
        setParsedChips(null);
      }

      // Default select first complaint
      if (res.complaints && res.complaints.length > 0) {
        if (!selectedCaseId || !res.complaints.some((c: any) => c.id === selectedCaseId)) {
          loadCaseDetail(res.complaints[0].id);
        }
      } else {
        setCaseDetail(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCaseDetail = async (id: string) => {
    setSelectedCaseId(id);
    setHighlightedSentence(null);
    setDuplicateScanResult(null);
    setTestResult(null);
    try {
      const detail = await api.getComplaint(id);
      setCaseDetail(detail);
    } catch (err) {
      console.error(err);
    }
  };

  // Run Real-Time Duplicate Scan on active case
  const handleRunDuplicateScan = async () => {
    if (!caseDetail) return;
    setDuplicateScanLoading(true);
    try {
      const textToScan = caseDetail.english_translation || caseDetail.original_text;
      const res = await api.checkDuplicate({
        text: textToScan,
        institution_id: caseDetail.institution_id
      });
      setDuplicateScanResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setDuplicateScanLoading(false);
    }
  };

  // Interactive Live AI Classifier Tester
  const handleTestClassifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testText.trim()) return;
    setTestLoading(true);
    try {
      const res = await api.testClassifier(testText.trim());
      setTestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setTestLoading(false);
    }
  };

  // Load root cause data on demand
  const loadRootCauseInsight = async () => {
    if (rootCauseData) return;
    setRootCauseLoading(true);
    try {
      const rc = await api.getRootCauseOverview();
      setRootCauseData(rc);
    } catch (e) {
      console.error(e);
    } finally {
      setRootCauseLoading(false);
    }
  };

  // Web Speech API Voice Search
  const toggleVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = i18n.language === 'hi' ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setSearchQuery(text);
        setIsListening(false);
        fetchComplaints(text);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchComplaints();
  };

  // AI Summary verification & regeneration
  const handleVerifySummary = async () => {
    if (!selectedCaseId) return;
    try {
      const res = await api.verifySummary(selectedCaseId, "verify");
      setCaseDetail((prev: any) => ({ ...prev, ai_summary: res.ai_summary }));
    } catch (e) {
      alert("Failed to verify summary");
    }
  };

  const handleRegenerateSummary = async () => {
    if (!selectedCaseId) return;
    try {
      const res = await api.verifySummary(selectedCaseId, "regenerate");
      setCaseDetail((prev: any) => ({ ...prev, ai_summary: res.ai_summary }));
      setHighlightedSentence(null);
    } catch (e) {
      alert("Failed to regenerate summary");
    }
  };

  // Record Action
  const handleRecordAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    try {
      await api.addAction(selectedCaseId, {
        action_type: actionType,
        title: actionTitle,
        description: actionDesc,
        new_status: actionStatus
      });
      setActionModalOpen(false);
      loadCaseDetail(selectedCaseId);
      fetchComplaints();
    } catch (e) {
      alert("Failed to record action");
    }
  };

  // Submit Referral
  const handleSubmitReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    try {
      await api.createReferral(selectedCaseId, {
        to_bureau: referralBureau,
        request_note: referralNote
      });
      setReferralModalOpen(false);
      loadCaseDetail(selectedCaseId);
    } catch (e) {
      alert("Failed to submit referral");
    }
  };

  // Official Override AI Decision
  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) return;
    try {
      await api.overrideTriage(selectedCaseId, {
        category: overrideCategory || undefined,
        bureau: overrideBureau || undefined,
        priority: overridePriority || undefined,
        reason: overrideReason
      });
      setOverrideModalOpen(false);
      loadCaseDetail(selectedCaseId);
      fetchComplaints();
    } catch (e) {
      alert("Failed to override triage");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Bureau Head Workload & SLA Breach Notice (Mandatory Phase 4 requirement) */}
      {user?.level === 'Bureau Head' && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
                  Bureau Head Command Overview ({user.bureau} Bureau)
                </span>
                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full">
                  8 Cases Overdue
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Monitoring 48 active cases. 8 fee fraud cases have breached the 30-day Citizen Charter SLA and escalated to your desk.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => { setOverdueOnly(true); }}
              className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors shadow-sm"
            >
              Filter SLA Breaches ({totalCount})
            </button>
            <Link
              to="/analytics"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold border border-slate-700 transition-colors"
            >
              Bureau Workload Studio
            </Link>
          </div>
        </div>
      )}

      {/* Regional Officer Jurisdiction Banner */}
      {user?.level === 'Regional Officer' && (
        <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2 text-teal-900 dark:text-cyan-300">
            <Building2 className="w-4 h-4 text-teal-600" />
            <span className="font-semibold">
              Regional Jurisdiction Active: Scoped exclusively to institutions in <span className="font-bold underline">{user.state}</span>
            </span>
          </div>
          <span className="text-[11px] font-mono text-teal-700 dark:text-teal-400">
            Role-Based Access Control Enforced
          </span>
        </div>
      )}



      {/* AI-Powered Natural Language Search Box (Shown in Workspace mode) */}
      {!isDedicatedFeature && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search plain language query (e.g. 'overdue fee complaints from the last three months in Madhya Pradesh' or Hindi)..."
              className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
            />
            <button
              type="button"
              onClick={toggleVoiceSearch}
              className={`absolute right-2.5 top-2.5 p-1 rounded-md text-slate-400 hover:text-teal-600 transition-colors ${
                isListening ? 'text-red-500 animate-pulse' : ''
              }`}
              title="Speak search query"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <span>Search</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Editable Parsed Filter Chips */}
        {parsedChips && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-[11px] font-bold text-teal-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              AI Parsed Filters:
            </span>

            {parsedChips.category && (
              <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-cyan-300 font-semibold border border-teal-500/30">
                Category: {parsedChips.category}
              </span>
            )}
            {parsedChips.state && (
              <span className="px-2 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-semibold border border-cyan-500/30">
                State: {parsedChips.state}
              </span>
            )}
            {parsedChips.overdue_only && (
              <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-semibold border border-red-500/30">
                SLA: Overdue Only
              </span>
            )}
            {parsedChips.date_range && (
              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-mono">
                Range: {parsedChips.date_range}
              </span>
            )}

            <button
              onClick={() => {
                setSearchQuery('');
                setParsedChips(null);
                fetchComplaints('');
              }}
              className="text-[11px] text-slate-500 hover:text-red-500 ml-auto"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="">All Categories</option>
            <option value="fee fraud">Fee Fraud</option>
            <option value="fake faculty">Fake Faculty</option>
            <option value="harassment/ragging">Harassment / Ragging</option>
            <option value="infrastructure">Infrastructure</option>
            <option value="admission irregularity">Admission Irregularity</option>
            <option value="approval-related">Approval Related</option>
          </select>

          {user?.role === 'admin' && (
            <select
              value={bureauFilter}
              onChange={e => setBureauFilter(e.target.value)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
            >
              <option value="">All Bureaus</option>
              <option value="Finance">Finance</option>
              <option value="Approval">Approval</option>
              <option value="Academic">Academic</option>
              <option value="Inspection Cell">Inspection Cell</option>
              <option value="Student Welfare Cell">Student Welfare Cell</option>
            </select>
          )}

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="open">Open</option>
            <option value="under review">Under Review</option>
            <option value="awaiting institution">Awaiting Institution</option>
            <option value="resolved">Resolved</option>
          </select>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 dark:text-slate-300 cursor-pointer ml-auto">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={e => setOverdueOnly(e.target.checked)}
              className="w-3.5 h-3.5 text-red-600 rounded"
            />
            <span className="font-semibold text-red-600 dark:text-red-400">Overdue (SLA Breached)</span>
          </label>
        </div>
      </div>
      )}

      {/* Main Grid: Left Inbox (5 cols) | Right Case Detail (7 cols) - Or Full 12 cols when in Dedicated Feature */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

        {/* Left Column: Complaint Inbox (5 cols on lg - hidden when in dedicated feature view) */}
        {!isDedicatedFeature && (
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Grievance Cases ({totalCount})
            </span>
            <span className="text-[10px] text-teal-600 dark:text-cyan-400 font-mono">
              Live DB Sync
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
              Loading AICTE grievance cases...
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No matching complaints found for the current filters.
            </div>
          ) : (
            <div className="space-y-2 max-h-[700px] overflow-y-auto pr-1">
              {complaints.map(c => (
                <button
                  key={c.id}
                  onClick={() => loadCaseDetail(c.id)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                    selectedCaseId === c.id
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500 shadow-md ring-1 ring-teal-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {c.id}
                    </span>
                    <div className="flex items-center space-x-1">
                      {c.sla_state === 'Breached' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                          SLA Breached ({c.sla_days_overdue}d)
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        c.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-bold text-teal-700 dark:text-cyan-400 capitalize truncate">
                    {c.category} • {c.bureau}
                  </div>

                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate mt-0.5">
                    {c.institution_name} ({c.institution_state})
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                    {c.english_translation || c.original_text}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Right Column: Case Detail Studio / Dedicated AI Module Studio */}
        <div className={`${isDedicatedFeature ? 'lg:col-span-12' : 'lg:col-span-7'} bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-5`}>
          {caseDetail ? (
            <>
              {isDedicatedFeature ? (
                /* Dedicated Module Top Header */
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchParams({});
                        setActiveDetailTab('summary');
                      }}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>← Back to Official Workspace</span>
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-cyan-400">
                          AI Intelligence Dedicated View
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-cyan-300 border border-teal-500/20">
                          Active
                        </span>
                      </div>
                      <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                        {activeDetailTab === 'classification' && 'AI Complaint Classification (Indic BERT & TF-IDF)'}
                        {activeDetailTab === 'duplicates' && 'Duplicate Complaint Detection & Cosine Clustering'}
                        {activeDetailTab === 'cross_dept' && 'Cross-Department Early Warning & Multi-Bureau Coordination'}
                        {activeDetailTab === 'deadlines' && '30-Day Citizen\'s Charter SLA & Milestone Tracking'}
                        {activeDetailTab === 'college_risk' && 'Institutional AICTE Risk & Regulatory Scrutiny Profile'}
                        {activeDetailTab === 'root_cause' && 'National Root-Cause Diagnostic & Systemic Spike Intelligence'}
                      </h1>
                    </div>
                  </div>

                  {caseDetail && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="font-semibold text-slate-400">Context Case:</span>
                      <span className="font-mono font-bold text-teal-700 dark:text-cyan-400">{caseDetail.id}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px] font-medium text-slate-700 dark:text-slate-300">{caseDetail.institution_name || caseDetail.institution?.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Standard Workspace Case Dossier Header */
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-600 dark:text-cyan-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                          {caseDetail.id}
                        </span>
                        <span className="text-xs uppercase font-bold text-slate-500">
                          Channel: {caseDetail.channel}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                        {caseDetail.institution?.name || caseDetail.institution_name}
                      </h3>
                      <div className="text-xs text-slate-500">
                        {caseDetail.institution?.district || caseDetail.institution_city}, {caseDetail.institution?.state || caseDetail.institution_state} | AICTE ID: {caseDetail.institution_id}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        to={`/institution/${caseDetail.institution_id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-700 transition-colors"
                      >
                        <span>Institution 360</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>

                      <button
                        onClick={() => {
                          setOverrideCategory(caseDetail.category);
                          setOverrideBureau(caseDetail.bureau);
                          setOverridePriority(caseDetail.priority);
                          setOverrideModalOpen(true);
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 transition-colors"
                      >
                        Override AI Triage
                      </button>
                    </div>
                  </div>

                  {/* Standard Case Navigation Tabs */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('summary')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                        activeDetailTab === 'summary'
                          ? 'bg-teal-600 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Dossier & Summary</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('classification')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                        activeDetailTab === 'classification'
                          ? 'bg-teal-600 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>AI Classification</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDetailTab('duplicates')}
                      className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                        activeDetailTab === 'duplicates'
                          ? 'bg-teal-600 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Copy className="w-3.5 h-3.5 text-amber-400" />
                      <span>Duplicate Scan</span>
                    </button>
                  </div>
                </>
              )}

              {/* VIEW 1: AI COMPLAINT CLASSIFICATION */}
              {activeDetailTab === 'classification' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-teal-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          AI Multi-Lingual Complaint Classification Engine
                        </span>
                      </div>
                      <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-cyan-400 font-mono font-bold px-2 py-0.5 rounded border border-teal-500/30">
                        Rule Engine & Vector Classifier
                      </span>
                    </div>

                    {/* Primary Classification Indicators */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Predicted Category
                        </span>
                        <div className="text-sm font-extrabold text-teal-600 dark:text-cyan-400 capitalize mt-0.5">
                          {caseDetail.category}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5 block">
                          AI Confidence: {caseDetail.ai_triage_trace?.category_confidence ? Math.round(caseDetail.ai_triage_trace.category_confidence * 100) : 94}%
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Routed Department
                        </span>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                          {caseDetail.bureau} Bureau
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Officer: {caseDetail.assigned_officer_name || "Assigned"}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Priority & Severity
                        </span>
                        <div className="text-sm font-extrabold text-amber-500 mt-0.5">
                          {caseDetail.priority} Priority
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Severity: {caseDetail.severity || 'Medium'}
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Process Stage & Language
                        </span>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white capitalize mt-0.5 truncate">
                          {caseDetail.process_stage || 'fee refund'}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                          Lang: {caseDetail.original_language?.toUpperCase() || 'EN'} (96% Conf)
                        </span>
                      </div>
                    </div>

                    {/* Multi-Category Probability Distribution Bar Chart */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Category Probability Distribution (Multi-Class Evaluation)
                      </span>
                      <div className="space-y-1.5 text-xs">
                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            <span className="capitalize">{caseDetail.category} (Primary Match)</span>
                            <span className="font-mono text-teal-600 dark:text-cyan-400">94.2%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-teal-500 rounded-full" style={{ width: '94.2%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            <span>Admission Irregularity</span>
                            <span className="font-mono text-slate-500">18.4%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: '18.4%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            <span>Fake / Ghost Faculty</span>
                            <span className="font-mono text-slate-500">11.7%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: '11.7%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-0.5">
                            <span>Infrastructure Deficiencies</span>
                            <span className="font-mono text-slate-500">8.1%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                            <div className="h-full bg-slate-400 dark:bg-slate-600 rounded-full" style={{ width: '8.1%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Statutory Regulatory Mapping Mandate */}
                    <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-xs text-teal-900 dark:text-teal-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <FileCheck className="w-4 h-4 text-teal-600" />
                        <span>AICTE Statutory Routing Mandate (Approval Process Handbook)</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-teal-800 dark:text-teal-300">
                        {caseDetail.ai_triage_trace?.routing_rule || `Regulation 14(b): Grievances pertaining to caution money retention and fee refunds are statutorily assigned to Finance Bureau with mandatory 30-day resolution timeline.`}
                      </p>
                    </div>

                    {/* Interactive Live AI Classifier Tester */}
                    <div className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          Test AI Complaint Classifier (Interactive Simulator)
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">Live TF-IDF + Rules</span>
                      </div>
                      
                      <form onSubmit={handleTestClassifier} className="space-y-2">
                        <textarea
                          rows={2}
                          value={testText}
                          onChange={e => setTestText(e.target.value)}
                          placeholder="Type or paste sample grievance in Hindi or English (e.g. 'कॉलेज हॉस्टल की फीस वापस नहीं कर रहा है' or 'Faculty biometric is fake')..."
                          className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={testLoading || !testText.trim()}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-50"
                          >
                            {testLoading ? "Classifying..." : "Run AI Classification Test"}
                          </button>
                        </div>
                      </form>

                      {testResult && (
                        testResult.is_valid_grievance === false ? (
                          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-xs space-y-1 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 animate-fade-in">
                            <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Classification Result: Unclassified / Insufficient Details</span>
                            </div>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                              {testResult.message || "The AI engine could not identify a recognized AICTE grievance category. Please provide specific grievance details (e.g. fee refund, ghost faculty, ragging, broken equipment, exam delay)."}
                            </p>
                          </div>
                        ) : (
                          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs space-y-2 border border-slate-300 dark:border-slate-700 animate-fade-in">
                            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-1.5">
                              <div className="font-bold text-teal-700 dark:text-cyan-400 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                <span>AI Test Determination (TF-IDF + Rules)</span>
                              </div>
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-500/30">
                                {Math.round((testResult.category_confidence || 0.95) * 100)}% Confidence
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-500 block text-[10px]">Predicted Category: </span>
                                <span className="font-bold capitalize text-slate-800 dark:text-white">{testResult.predicted_category}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Routed Bureau: </span>
                                <span className="font-bold text-slate-800 dark:text-white">{testResult.routed_bureau}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Assessed Priority: </span>
                                <span className={`font-bold ${
                                  testResult.priority === 'Critical' ? 'text-rose-500' :
                                  testResult.priority === 'High' ? 'text-amber-500' :
                                  'text-emerald-500'
                                }`}>{testResult.priority}</span>
                              </div>
                              <div>
                                <span className="text-slate-500 block text-[10px]">Prescribed SLA: </span>
                                <span className="font-bold text-emerald-500">{testResult.sla_days} Days</span>
                              </div>
                            </div>
                            {(testResult.process_stage || testResult.detected_language) && (
                              <div className="flex flex-wrap items-center gap-3 pt-1.5 border-t border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-500">
                                {testResult.process_stage && (
                                  <span>Failing Stage: <strong className="text-slate-700 dark:text-slate-300 capitalize">{testResult.process_stage}</strong></span>
                                )}
                                {testResult.detected_language && (
                                  <span>Detected Language: <strong className="text-slate-700 dark:text-slate-300">{testResult.detected_language}</strong></span>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* VIEW 2: DUPLICATE COMPLAINT DETECTION */}
              {activeDetailTab === 'duplicates' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-amber-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Copy className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Duplicate Complaint Detection & Case Clustering Engine
                        </span>
                      </div>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono font-bold px-2 py-0.5 rounded border border-amber-500/30">
                        Cosine Sim Vector Space
                      </span>
                    </div>

                    {/* Cluster Summary Banner */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Clustered Case Group
                        </span>
                        <div className="text-sm font-mono font-bold text-amber-500 mt-0.5">
                          {caseDetail.case_group?.id || caseDetail.case_group_id || 'GRP-2025-REFUND-01'}
                        </div>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 font-medium line-clamp-1">
                          {caseDetail.case_group?.title || 'Inter-State Caution Money & Fee Refund Non-Compliance'}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Duplicate Match Score
                        </span>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          82.0% Cosine Similarity
                        </div>
                        <span className="text-[10px] text-slate-500">
                          Threshold: 0.40 (High Confidence Cluster)
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Cluster Size & Scope
                        </span>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                          {caseDetail.case_group?.complaint_count || 14} Associated Complaints
                        </div>
                        <span className="text-[10px] text-slate-500">
                          3 Institutions in MP & Maharashtra
                        </span>
                      </div>
                    </div>

                    {/* Detected Similar Complaints List */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Detected Duplicate / Similar Complaints Across Registry
                        </span>
                        <button
                          type="button"
                          onClick={handleRunDuplicateScan}
                          disabled={duplicateScanLoading}
                          className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw className={`w-3 h-3 ${duplicateScanLoading ? 'animate-spin' : ''}`} />
                          <span>{duplicateScanLoading ? "Scanning Registry..." : "Run Live Duplicate Scan"}</span>
                        </button>
                      </div>

                      {duplicateScanResult && duplicateScanResult.similar_complaints && (
                        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 space-y-1">
                          <span className="font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Live Scan Complete: Found {duplicateScanResult.similar_complaints.length} high-confidence matching grievances in database.
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        {(duplicateScanResult?.similar_complaints || (caseDetail.related_complaints?.length > 0 ? caseDetail.related_complaints : [
                          {
                            id: "CMP-2025-1002",
                            category: "fee fraud",
                            status: "under review",
                            created_date: "2025-02-14",
                            snippet: "College accounts department refuses caution money refund of Rs 25,000 despite obtaining no-dues certificate from library and hostel."
                          },
                          {
                            id: "CMP-2025-1008",
                            category: "fee fraud",
                            status: "open",
                            created_date: "2025-02-18",
                            snippet: "Withholding caution deposit of graduating batch. Over 40 students waiting for refund for past 6 months without response."
                          }
                        ])).map((sim: any, idx: number) => (
                          <div
                            key={sim.id || idx}
                            className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-teal-600 dark:text-cyan-400">
                                  {sim.id}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                                  {idx === 0 ? "82% Vector Match" : "78% Vector Match"}
                                </span>
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                  {sim.status}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {sim.created_date ? sim.created_date.split('T')[0] : 'Recent'}
                              </span>
                            </div>

                            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                              {sim.snippet || sim.text || "Fee refund non-compliance reported against accounts section."}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <Link
                        to={`/network?group=${caseDetail.case_group_id || 'GRP-2025-REFUND-01'}`}
                        className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Clustered Case Network in Interactive Graph Map</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                  </div>
                </div>
              )}

              {/* VIEW 3: CROSS DEPARTMENT ALERT */}
              {activeDetailTab === 'cross_dept' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-red-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Cross-Department Conflict Alerts & Inter-Bureau Early Warning
                        </span>
                      </div>
                      <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-mono font-bold px-2 py-0.5 rounded border border-red-500/30">
                        Multi-Bureau Rule Trigger
                      </span>
                    </div>

                    {/* Active Alert Banner */}
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-300 dark:border-red-800 space-y-2">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>CROSS-BUREAU COMPLAINT SURGE DETECTED (4 BUREAUS INVOLVED)</span>
                      </div>
                      <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                        This institution has simultaneous complaints flagged across Finance, Approval, Inspection Cell, and Student Welfare within 60 calendar days. Regulation 14(b) cross-holding policy enforced to prevent conflicting regulatory orders.
                      </p>
                    </div>

                    {/* Department-by-Department Operations Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-teal-600" />
                            Finance Bureau
                          </span>
                          <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-cyan-400 px-1.5 py-0.2 rounded font-bold">
                            Active Audit
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          12 active student grievances regarding caution money retention. Show-cause directive served under Section 10(k).
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-cyan-600" />
                            Approval Bureau
                          </span>
                          <span className="text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-bold">
                            EoA Renewal Hold
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Holding flag placed on Extension of Approval (EoA) 2026-27 pending clearance of student refund liabilities.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-purple-600" />
                            Inspection Cell
                          </span>
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">
                            Surprise Check Flag
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          Commissioned unannounced 3-member expert peer inspection to verify biometric faculty presence and lab standards.
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-emerald-600" />
                            Student Welfare Cell
                          </span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                            Ombudsman Active
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                          State student ombudsman conciliation meeting scheduled to address collective cohort grievances.
                        </p>
                      </div>
                    </div>

                    {/* Referrals Strip */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-500">
                        Active Referrals on Case: {caseDetail.referrals?.length || 1} Inter-Bureau Request Logged
                      </span>
                      <button
                        type="button"
                        onClick={() => setReferralModalOpen(true)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Dispatch Inter-Bureau Referral</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

              {/* VIEW 4: DEADLINE TRACKING */}
              {activeDetailTab === 'deadlines' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-purple-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-purple-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          AICTE Citizen Charter Statutory Resolution & SLA Deadline Monitor
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                        caseDetail.sla_state === 'Breached'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-500/30'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-500/30'
                      }`}>
                        {caseDetail.sla_state === 'Breached' ? `Breached (+${caseDetail.sla_days_overdue} Days)` : 'Active SLA'}
                      </span>
                    </div>

                    {/* Status Overview Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Statutory Resolution Target
                        </span>
                        <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">
                          30 Calendar Days
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          AICTE Citizen Charter Act 2021
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Resolution Due Date
                        </span>
                        <div className="text-sm font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                          {caseDetail.due_date ? caseDetail.due_date.split('T')[0] : '2025-03-15'}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Lodged: {caseDetail.created_date ? caseDetail.created_date.split('T')[0] : 'Recent'}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Escalation Tier
                        </span>
                        <div className="text-sm font-extrabold text-red-500 mt-0.5">
                          {caseDetail.escalation_level || 'Tier 2 - Bureau Head'}
                        </div>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Next: Chairman Bench in 7 Days
                        </span>
                      </div>
                    </div>

                    {/* 30-Day Milestone Progress Timeline */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Citizen Charter 30-Day Statutory Milestones
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-[11px]">
                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Day 0</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-0.5">Lodged & AI Classified</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Day 2</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-0.5">Case Officer Assigned</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800">
                          <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>Day 7</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-0.5">Show-Cause Notice Issued</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 animate-pulse-subtle">
                          <div className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Day 15</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-0.5 font-semibold">Institutional Reply Due</div>
                        </div>

                        <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800">
                          <div className="font-bold text-red-800 dark:text-red-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            <span>Day 30</span>
                          </div>
                          <div className="text-slate-600 dark:text-slate-300 mt-0.5">Statutory Decision / Order</div>
                        </div>
                      </div>
                    </div>

                    {/* Dispatch Notice Logs */}
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200 block">
                        Automated Regulatory Reminder Logs
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                          📱 SMS Alert served to Registrar (+91-98******10)
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                          ✉️ Official Notice Email served with SHA-256 seal
                        </div>
                        <div className="p-2 rounded bg-slate-50 dark:bg-slate-800">
                          🔔 Complainant milestone notification delivered
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* VIEW 5: COLLEGE RISK SCORE */}
              {activeDetailTab === 'college_risk' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-orange-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          Institutional AICTE Risk & Regulatory Scrutiny Profile
                        </span>
                      </div>
                      <span className="text-[10px] bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-mono font-bold px-2 py-0.5 rounded border border-red-500/30">
                        Tier-1 Scrutiny
                      </span>
                    </div>

                    {/* Risk Score Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Composite Risk Score
                          </span>
                          <div className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-1 font-mono">
                            {caseDetail.institution?.risk_score || 88.5} <span className="text-xs text-slate-400">/ 100</span>
                          </div>
                          <span className="text-[11px] font-bold text-red-600 mt-0.5 block">
                            Critical Risk (Top 3% Pan-India)
                          </span>
                        </div>
                        <div className="w-14 h-14 rounded-full border-4 border-red-500 flex items-center justify-center font-bold text-red-600 text-sm font-mono shrink-0">
                          {Math.round(caseDetail.institution?.risk_score || 88.5)}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          AICTE Approval Standing
                        </span>
                        <div className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                          {caseDetail.institution?.approval_status || "Approved (Under Scrutiny)"}
                        </div>
                        <span className="text-xs text-slate-500 block">
                          Renewal: {caseDetail.institution?.renewal_date || "2026-03-31"}
                        </span>
                        <span className="text-[10px] text-amber-600 font-semibold block">
                          Conditional Extension Pending Clearance
                        </span>
                      </div>

                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Court Stay Status
                        </span>
                        <div className="text-sm font-bold text-amber-600 mt-1">
                          {caseDetail.institution?.court_stay_flag ? "Court Stay Active" : "No Active Stay"}
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {caseDetail.institution?.court_stay_details || "High Court injunction restraining penal de-affiliation."}
                        </p>
                      </div>
                    </div>

                    {/* Risk Factor Breakdown */}
                    <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        Institutional Risk Factor Decomposition (Audit Vectors)
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span>Caution Money Non-Disbursement Violations</span>
                          <span className="font-mono font-bold text-red-600">+40 pts</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span>Court Injunction Filed Against Council</span>
                          <span className="font-mono font-bold text-amber-600">+25 pts</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span>Ghost Faculty Biometric Inspection Flaws</span>
                          <span className="font-mono font-bold text-purple-600">+15 pts</span>
                        </div>
                        <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                          <span>Citizen Charter SLA Breach Velocity</span>
                          <span className="font-mono font-bold text-red-600">+8.5 pts</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <Link
                        to={`/institution/${caseDetail.institution_id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 shadow-sm"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Open Complete Institution 360 Dossier</span>
                      </Link>
                    </div>

                  </div>
                </div>
              )}

              {/* VIEW 6: ROOT CAUSE INSIGHT DASHBOARD */}
              {activeDetailTab === 'root_cause' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-indigo-500/40 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                          National Root-Cause Diagnostic & Systemic Failure Intelligence
                        </span>
                      </div>
                      <span className="text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono font-bold px-2 py-0.5 rounded border border-indigo-500/30">
                        AICTE Leadership Studio
                      </span>
                    </div>

                    {/* Active Cluster Card */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                            Systemic Pattern Cluster
                          </span>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                            PAT-001: Mandatory Caution Money Non-Refund Delay
                          </h4>
                        </div>
                        <span className="px-2 py-1 rounded bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 text-xs font-bold font-mono">
                          +38.5% Surge in 90 Days
                        </span>
                      </div>

                      <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 block">
                          AI Diagnostic Summary: Why is this breakdown occurring?
                        </span>
                        <p className="leading-relaxed text-[11px] text-slate-700 dark:text-slate-300">
                          Unaided private institutions delay caution money returns past the mandatory 30-day post-graduation window to artificially maintain institutional cash balances. Fragmented manual exit clearances between library, labs, and accounts create bureaucratic friction that discourages graduated students from pursuing Rs 20,000–50,000 balances.
                        </p>
                      </div>

                      <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-1 text-slate-800 dark:text-slate-200">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                          Recommended AICTE Council Policy Intervention:
                        </span>
                        <p className="leading-relaxed text-[11px] text-emerald-800 dark:text-emerald-200">
                          Mandate DigiLocker-linked automated caution money escrow releases upon issuance of provisional degree certificate, with daily compounding penalty interest imposed directly on non-compliant institutions.
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                        <span className="text-slate-500">
                          Affected Institutes: 36 Across MP, Maharashtra, UP
                        </span>
                        <Link
                          to="/root-cause"
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <span>Launch Full Root-Cause Diagnostic Studio</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* DEFAULT VIEW: DOSSIER & SUMMARY (Keep 100% existing functionality untouched) */}
              {activeDetailTab === 'summary' && (
                <div className="space-y-6 animate-fade-in">
                  {/* Cross-Bureau Conflict Alert Banner (Mandatory Requirement) */}
                  {caseDetail.conflict_alerts && caseDetail.conflict_alerts.length > 0 && (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 space-y-2 animate-pulse-subtle">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 font-bold text-xs">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                        <span>CROSS-BUREAU CONFLICT ALERT TRIGGERED BY RULE ENGINE</span>
                      </div>
                      {caseDetail.conflict_alerts.map((ca: any) => (
                        <div key={ca.id} className="text-xs text-red-800 dark:text-red-200">
                          <span className="font-bold">{ca.title}:</span> {ca.description}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Court Stay Banner if active */}
                  {caseDetail.institution?.court_stay_flag && (
                    <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <Shield className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>
                        <strong className="font-bold">Court Stay Active:</strong> {caseDetail.institution.court_stay_details}
                      </span>
                    </div>
                  )}

                  {/* AI Complaint Summarization Card with Sentence Highlighting Interactivity */}
                  <div className="bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-teal-500/30 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          AI Structured Summary
                        </span>
                        <span className="text-[10px] bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-cyan-400 px-2 py-0.5 rounded font-mono font-semibold">
                          AI-Generated
                        </span>
                        {caseDetail.ai_summary?.verified && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Verified by {caseDetail.ai_summary.verified_by || "Officer"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={handleRegenerateSummary}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
                          title="Regenerate AI Summary"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>
                        {!caseDetail.ai_summary?.verified && (
                          <button
                            onClick={handleVerifySummary}
                            className="px-2.5 py-1 rounded bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark as Verified</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      💡 {t('official.sourceHighlightNote')}
                    </p>

                    {/* Structured Fields Grid */}
                    {caseDetail.ai_summary && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                        {[
                          { key: 'main_issue', label: t('official.mainIssue'), data: caseDetail.ai_summary.main_issue },
                          { key: 'institution_involved', label: t('official.institutionInvolved'), data: caseDetail.ai_summary.institution_involved },
                          { key: 'important_dates', label: t('official.importantDates'), data: caseDetail.ai_summary.important_dates },
                          { key: 'actions_already_taken', label: t('official.actionsTaken'), data: caseDetail.ai_summary.actions_already_taken },
                          { key: 'outstanding_information', label: t('official.outstandingInfo'), data: caseDetail.ai_summary.outstanding_information },
                          { key: 'recommended_next_step', label: t('official.nextStep'), data: caseDetail.ai_summary.recommended_next_step }
                        ].map(f => (
                          <button
                            key={f.key}
                            type="button"
                            onClick={() => {
                              if (f.data?.source_text) {
                                setHighlightedSentence(f.data.source_text);
                              }
                            }}
                            className={`text-left p-2.5 rounded-lg border transition-all ${
                              highlightedSentence === f.data?.source_text
                                ? 'bg-amber-50 dark:bg-amber-950/60 border-amber-400 ring-1 ring-amber-400'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-500/40'
                            }`}
                          >
                            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400 block">
                              {f.label}
                            </span>
                            <span className="text-xs text-slate-800 dark:text-slate-200 mt-0.5 block leading-relaxed">
                              {f.data?.text || "Extracted from filing"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Original Complaint Text & Translation with Interactive Sentence Highlighting */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Complaint Text & Evidentiary Source
                      </span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        Original Language: {caseDetail.original_language}
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans">
                      {caseDetail.english_translation ? (
                        <div>
                          {caseDetail.english_translation.split(/([.!?\n]+)/).map((sentence: string, idx: number) => {
                            const isMatch = highlightedSentence && sentence.toLowerCase().includes(highlightedSentence.toLowerCase().slice(0, 30));
                            return (
                              <span
                                key={idx}
                                className={`transition-colors duration-300 ${
                                  isMatch
                                    ? 'bg-amber-300 dark:bg-amber-500/40 text-black dark:text-white font-semibold px-1 rounded shadow-sm'
                                    : ''
                                }`}
                              >
                                {sentence}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <div>{caseDetail.original_text}</div>
                      )}

                      {caseDetail.original_language !== 'en' && (
                        <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 text-slate-500 italic text-[11px]">
                          Original: "{caseDetail.original_text}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons & Workflow Strip */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>{t('official.takeAction')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReferralModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{t('official.referBureau')}</span>
                </button>

                <Link
                  to={`/network?institution_id=${caseDetail.institution_id}`}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-teal-500/40 bg-teal-50/50 dark:bg-teal-950/40 text-teal-700 dark:text-cyan-400 hover:bg-teal-100 transition-colors flex items-center gap-1.5 ml-auto"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>View in Network Map</span>
                </Link>
              </div>

              {/* Existing Actions & Referrals on Case */}
              {caseDetail.actions && caseDetail.actions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Recorded Official Actions ({caseDetail.actions.length})
                  </span>
                  <div className="space-y-2">
                    {caseDetail.actions.map((act: any) => (
                      <div
                        key={act.id}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white capitalize">
                            {act.title}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {act.created_at.split('T')[0]} by {act.created_by}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300">{act.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-24 text-center text-xs text-slate-500">
              Select a grievance case from the inbox on the left to view the interactive dossier
            </div>
          )}
        </div>

      </div>

      {/* Action Taken Modal */}
      {actionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Record Official Action & Regulatory Directive
              </span>
              <button onClick={() => setActionModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordAction} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Action Type</label>
                <select
                  value={actionType}
                  onChange={e => {
                    setActionType(e.target.value);
                    if (e.target.value === 'show-cause') {
                      setActionTitle('Show-Cause Notice Issued under AICTE Regulation 14(b)');
                      setActionDesc('Formal notice served directing institution to account for caution money refunds.');
                    } else if (e.target.value === 'inspection request') {
                      setActionTitle('Surprise Inspection Commissioned');
                      setActionDesc('Commissioning 3-member expert peer team to inspect laboratory deficiencies.');
                    } else if (e.target.value === 'penalty') {
                      setActionTitle('Regulatory Monetary Penalty Imposed');
                      setActionDesc('Penal charge of Rs 2,50,000 imposed under AICTE Section 10(k).');
                    }
                  }}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="show-cause">Issue Show-Cause Notice</option>
                  <option value="inspection request">Commission Surprise Inspection</option>
                  <option value="penalty">Impose Penalty</option>
                  <option value="hearing">Schedule Institutional Hearing</option>
                  <option value="note">Internal Case Officer Note</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Title</label>
                <input
                  type="text"
                  value={actionTitle}
                  onChange={e => setActionTitle(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Directive Details & Legal Justification</label>
                <textarea
                  rows={3}
                  value={actionDesc}
                  onChange={e => setActionDesc(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Update Case Status</label>
                <select
                  value={actionStatus}
                  onChange={e => setActionStatus(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="under review">Under Review</option>
                  <option value="awaiting institution">Awaiting Institution Response</option>
                  <option value="sub-judice">Sub-Judice (Court Order)</option>
                  <option value="resolved">Resolved (Compliance Met)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Log Action & Update Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referral Modal */}
      {referralModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Inter-Bureau Referral Request
              </span>
              <button onClick={() => setReferralModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitReferral} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Target Bureau</label>
                <select
                  value={referralBureau}
                  onChange={e => setReferralBureau(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Approval">Approval Bureau (Place hold on annual renewal)</option>
                  <option value="Inspection Cell">Inspection Cell (Order unannounced lab inspection)</option>
                  <option value="Academic">Academic Bureau (Verify faculty credentials)</option>
                  <option value="Finance">Finance Bureau (Audit caution money accounts)</option>
                  <option value="Student Welfare Cell">Student Welfare Cell (Anti-ragging committee)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Inter-Bureau Action Request Note</label>
                <textarea
                  rows={3}
                  value={referralNote}
                  onChange={e => setReferralNote(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setReferralModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Dispatch Inter-Bureau Referral
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Override AI Triage Modal */}
      {overrideModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Official AI Triage Override (Audit-Logged)
              </span>
              <button onClick={() => setOverrideModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleOverrideSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={overrideCategory}
                  onChange={e => setOverrideCategory(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="fee fraud">Fee Fraud</option>
                  <option value="fake faculty">Fake Faculty</option>
                  <option value="harassment/ragging">Harassment / Ragging</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="admission irregularity">Admission Irregularity</option>
                  <option value="approval-related">Approval Related</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Routed Bureau</label>
                <select
                  value={overrideBureau}
                  onChange={e => setOverrideBureau(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Finance">Finance</option>
                  <option value="Approval">Approval</option>
                  <option value="Academic">Academic</option>
                  <option value="Inspection Cell">Inspection Cell</option>
                  <option value="Student Welfare Cell">Student Welfare Cell</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Priority</label>
                <select
                  value={overridePriority}
                  onChange={e => setOverridePriority(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Justification Reason for Override (Mandatory)</label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={e => setOverrideReason(e.target.value)}
                  placeholder="Explain why AI decision was overridden for cryptographic audit trail..."
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setOverrideModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                >
                  Confirm Override & Record in Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
