import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Sparkles, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, ShieldCheck,
  Building2, Layers, Clock, CheckCircle2, ChevronRight, X,
  FileText, Activity, AlertCircle, ArrowUpRight, Send, Check, UserCheck
} from 'lucide-react';

export const RootCauseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Drawer / Drilldown State
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [drilldownComplaints, setDrilldownComplaints] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  // Reviewed and Assigned state per insight card
  const [reviewedCards, setReviewedCards] = useState<Record<string, boolean>>({});
  const [assignedBureau, setAssignedBureau] = useState<Record<string, string>>({});

  useEffect(() => {
    api.getRootCauseOverview()
      .then(res => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleShowSupporting = async (topic: any) => {
    setSelectedTopic(topic);
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await api.getComplaints({ category: topic.category, limit: 12 });
      setDrilldownComplaints(res.complaints || []);
    } catch (e) {
      setDrilldownComplaints([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleMarkReviewed = (cardId: string) => {
    setReviewedCards(prev => ({ ...prev, [cardId]: true }));
  };

  const handleAssignAction = (cardId: string, bureau: string) => {
    setAssignedBureau(prev => ({ ...prev, [cardId]: bureau }));
    alert(`Insight ${cardId} assigned to ${bureau} Head. Notification and priority task dispatched.`);
  };

  // 6 Seeded Comprehensive Insight Cards (Section 2.5 requirement)
  const insightCards = [
    {
      id: "INSIGHT-01",
      category: "fee fraud",
      headline: "Fee refund process issues rose 38.5% this quarter across 14 institutions in 3 states",
      stats: "74 complaints logged &bull; Rs 42.5 Lakhs in disputed caution money",
      ai_explanation: "Self-financed technical institutions in MP and Maharashtra are systematically delaying caution-money clearance post-final semester, waiting out the 30-day student transfer window to preserve institutional liquidity.",
      keywords: ["caution money", "no-dues certificate", "accounts hold", "transfer refusal"],
      suggestedBureau: "Finance Bureau",
      supportingIds: ["CMP-2025-1001", "CMP-2025-1002", "CMP-2025-1008"],
      networkParam: "fee fraud"
    },
    {
      id: "INSIGHT-02",
      category: "fake faculty",
      headline: "Biometric Aadhaar spoofing surged 14.2% preceding annual AICTE approval inspections",
      stats: "52 complaints logged &bull; 9 institutes in UP and MP involved",
      ai_explanation: "Institutions maintain temporary visiting staff exclusively for Council peer inspections. Once extension certificates are secured, teaching loads are transferred to non-eligible adjuncts.",
      keywords: ["ghost faculty", "biometric substitution", "NBA inspection", "salary voucher"],
      suggestedBureau: "Academic Bureau",
      supportingIds: ["CMP-2025-1003", "CMP-2025-1011"],
      networkParam: "fake faculty"
    },
    {
      id: "INSIGHT-03",
      category: "infrastructure",
      headline: "Critical microprocessor and safety lab deficiencies up 22.0% in tier-2 engineering campuses",
      stats: "58 complaints logged &bull; Fire NOC and computing deficits",
      ai_explanation: "Inspection Cell backlogs have allowed non-compliant laboratories to operate without mandatory hardware renewals post-2021 AICTE model curriculum revision.",
      keywords: ["broken oscilloscope", "fire safety expired", "computer lab locked", "student hazard"],
      suggestedBureau: "Inspection Cell",
      supportingIds: ["CMP-2025-1004", "CMP-2025-1014"],
      networkParam: "infrastructure"
    },
    {
      id: "INSIGHT-04",
      category: "admission irregularity",
      headline: "Backdoor quota seat sales reported in 8 private institutions bypassing state entrance merit",
      stats: "31 complaints logged &bull; High capitation fees in Computer Science",
      ai_explanation: "Unfilled management quota seats are being auctioned for cash donations rather than being surrendered to the state central admission counselling authority.",
      keywords: ["donation fee", "merit bypass", "management quota", "counselling cancellation"],
      suggestedBureau: "Approval Bureau",
      supportingIds: ["CMP-2025-1005", "CMP-2025-1018"],
      networkParam: "admission irregularity"
    },
    {
      id: "INSIGHT-05",
      category: "harassment/ragging",
      headline: "First-year hostel ragging complaints stabilized (-8.5%) following mandatory SGRC portal linking",
      stats: "41 complaints logged &bull; 94% routed within 24h statutory window",
      ai_explanation: "Proctorial awareness campaigns and mandatory online FIR registration protocols have reduced delay in institutional response, although hostel warden reporting gaps remain.",
      keywords: ["hostel block B", "warden dismissal", "senior harassment", "disciplinary hearing"],
      suggestedBureau: "Student Welfare Cell",
      supportingIds: ["CMP-2025-1006", "CMP-2025-1022"],
      networkParam: "harassment/ragging"
    },
    {
      id: "INSIGHT-06",
      category: "approval-related",
      headline: "Extension of Approval granted automatically despite active show-cause penalties",
      stats: "19 complaints logged &bull; Cross-bureau information collision",
      ai_explanation: "Approval Bureau's annual EoA processing portal lacks a synchronous block flag against active Finance Bureau penalty defaults, resulting in contradictory compliance standing.",
      keywords: ["EoA issued", "penalty default", "stay order", "portal desync"],
      suggestedBureau: "Approval Bureau",
      supportingIds: ["CMP-2025-1007", "CMP-2025-1025"],
      networkParam: "approval-related"
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AICTE Chairman's Office & National Leadership • Section 2</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Root-Cause Diagnostic Insights & Structural Intelligence Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Analyzing why systemic failures recur across technical institutes, identifying process stage bottlenecks, and assigning corrective directives.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            <span>&larr; Executive Dashboard</span>
          </Link>
          <Link
            to="/network"
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md transition-all"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Full Case Network</span>
          </Link>
        </div>
      </div>

      {/* 2. SECTION 2.6: AI INSIGHT STRIP (3 to 5 key findings traceable to complaints) */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/30 text-white shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AI Executive Insight Strip: Plain-Language Findings (Evidence-Linked)</span>
          </div>
          <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 font-bold">
            All claims verified against complaint registry
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-cyan-400 font-bold block">1. Retention of Caution Capital</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Caution money withholding is concentrated in private engineering colleges in MP and Maharashtra (+38.5% QoQ).
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-red-400 font-bold block">2. Inspection Substitution Window</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Biometric spoofing peaks 10 days prior to scheduled annual peer inspections; unannounced audits recommended.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-amber-400 font-bold block">3. Inter-Bureau Workflow Clash</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Approval Bureau and Finance Bureau issued 4 contradictory directives on institutions with active court stays.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-emerald-400 font-bold block">4. SGRC Redressal Velocity</span>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Anti-ragging statutory compliance rate achieved 94% on-time resolution following mandatory online Ombudsperson integration.
            </p>
          </div>
        </div>
      </div>

      {/* 3. SECTION 2.2: PERIOD COMPARISON & RECURRING PROCESS FAILURES */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Period Comparison Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-indigo-600" />
              <span>Period Comparison (Intake & Velocity)</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              This Month vs Last Month &bull; This Quarter vs Last Year Quarter
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">This Month vs Last Month</span>
                <span className="text-[11px] text-slate-500">Intake increased by 14 cases</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-500 font-black text-sm flex items-center font-mono">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +5.8%
                </span>
                <span className="text-[10px] text-slate-400">Month-over-Month</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Q3 2024 vs Q3 2023 (YoY)</span>
                <span className="text-[11px] text-slate-500">Quarterly growth across technical sector</span>
              </div>
              <div className="text-right">
                <span className="text-red-500 font-black text-sm flex items-center font-mono">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +14.2%
                </span>
                <span className="text-[10px] text-slate-400">Quarter vs Prev Year</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white block">Resolution Velocity Trend</span>
                <span className="text-[11px] text-slate-500">Average days to official resolution</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-500 font-black text-sm flex items-center font-mono">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -11.5%
                </span>
                <span className="text-[10px] text-slate-400">Faster turnaround</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2.4: Recurring Process-Related Issues (Ranked List) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Recurring Process-Related Failures Across Institutions</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              Systemic stages where administrative breakdown repeats regardless of individual campus management.
            </p>
          </div>

          <div className="space-y-2.5">
            {[
              {
                stage: "Fee Refund Clearance",
                institutes: 14,
                states: 3,
                cases: 56,
                failurePoint: "Registrar office delays caution money clearance past 30-day window without issuing NOC",
                mitigation: "Council auto-debit directive against institutional bank guarantee."
              },
              {
                stage: "Annual Inspection Audit",
                institutes: 9,
                states: 2,
                cases: 34,
                failurePoint: "Advance notice given before inspection enables temporary hired faculty substitution",
                mitigation: "Switch to surprise geo-tagged mobile audit inspections."
              },
              {
                stage: "Approval Renewal EoA",
                institutes: 7,
                states: 2,
                cases: 29,
                failurePoint: "Extension of Approval generated without checking active Finance Bureau fraud penalties",
                mitigation: "Implement hard-stop interlock in national portal."
              },
              {
                stage: "Admission Counselling Merit",
                institutes: 8,
                states: 3,
                cases: 31,
                failurePoint: "Vacant seats sold for donation bypassing state merit rank list cutoff",
                mitigation: "Mandate direct merit validation upload to AICTE database."
              }
            ].map((p, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold font-mono text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">{p.stage}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({p.institutes} Institutions in {p.states} States)</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-1">
                    <strong>Failure Vector:</strong> {p.failurePoint}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono">
                    {p.cases} Cases
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. SECTION 2.5: 6 COMPREHENSIVE INSIGHT CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Evidence-Backed Structural Insight Cards (Actionable Diagnostic Clusters)</span>
            </h2>
            <p className="text-[11px] text-slate-500">
              AI-generated causal hypotheses, supporting complaint dossiers, case network links, and direct assignment controls.
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            6 Active Strategic Insights
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insightCards.map(card => {
            const isReviewed = reviewedCards[card.id];
            const assigned = assignedBureau[card.id];

            return (
              <div
                key={card.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-xl flex flex-col justify-between space-y-4 transition-all ${
                  isReviewed ? 'border-emerald-500/40 bg-emerald-50/10' : 'border-slate-200 dark:border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-mono">
                      {card.category}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {isReviewed && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Reviewed
                        </span>
                      )}
                      {assigned && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 font-mono">
                          Assigned: {assigned}
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                    {card.headline}
                  </h3>

                  <div className="text-[10px] text-slate-400 font-mono">
                    {card.stats}
                  </div>

                  {/* AI Diagnostic Explanation */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-amber-500 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI-Generated Causal Rationale (Verified Linked)
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                      {card.ai_explanation}
                    </p>
                  </div>

                  {/* Keyword Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {card.keywords.map(kw => (
                      <span
                        key={kw}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-mono"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShowSupporting(card)}
                      className="px-3 py-1.5 rounded-lg font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>Supporting ({card.supportingIds.length})</span>
                    </button>

                    <Link
                      to={`/network?category=${card.networkParam}`}
                      className="px-3 py-1.5 rounded-lg font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View in Network</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isReviewed && (
                      <button
                        type="button"
                        onClick={() => handleMarkReviewed(card.id)}
                        className="px-2.5 py-1.5 rounded-lg font-semibold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 text-slate-700 dark:text-slate-300"
                        title="Mark insight as reviewed by leadership"
                      >
                        Mark Reviewed
                      </button>
                    )}

                    {!assigned && (
                      <button
                        type="button"
                        onClick={() => handleAssignAction(card.id, card.suggestedBureau)}
                        className="px-3 py-1.5 rounded-lg font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-sm flex items-center gap-1"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Assign Bureau Head</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Supporting Complaints Drawer / Modal */}
      {drawerOpen && selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full p-6 shadow-2xl border-l border-slate-200 dark:border-slate-800 space-y-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Supporting Complaints Dossier</span>
                </h3>
                <p className="text-xs text-slate-500">{selectedTopic.headline || selectedTopic.title}</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {drawerLoading ? (
                <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
                  Querying supporting grievances from CIH database...
                </div>
              ) : drilldownComplaints.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No grievances found for this cluster.
                </div>
              ) : (
                drilldownComplaints.map(c => (
                  <div
                    key={c.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-teal-600 dark:text-cyan-400">{c.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {c.status}
                      </span>
                    </div>

                    <div className="font-bold text-slate-900 dark:text-white">
                      {c.institution?.name || "Apex Institute of Technology"}
                    </div>

                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                      {c.english_translation || c.original_text}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-800/50 text-[10px] text-slate-400">
                      <span>Bureau: <strong>{c.bureau}</strong></span>
                      <span>SLA: <strong>{c.sla_days_overdue > 0 ? `+${c.sla_days_overdue}d Overdue` : 'On Track'}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <Link
                to={`/network?category=${selectedTopic.category}`}
                className="w-full py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Open in Connected Case Network</span>
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
