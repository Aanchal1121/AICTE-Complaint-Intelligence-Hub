import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import {
  Sparkles, TrendingUp, AlertTriangle, ArrowRight, ShieldCheck,
  Building2, Layers, Clock, CheckCircle2, ChevronRight, X,
  FileText, Activity, AlertCircle, ArrowUpRight
} from 'lucide-react';

export const RootCauseDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTopic, setSelectedTopic] = useState<any | null>(null);
  const [drilldownComplaints, setDrilldownComplaints] = useState<any[]>([]);
  const [drilldownModalOpen, setDrilldownModalOpen] = useState(false);

  useEffect(() => {
    api.getRootCauseOverview()
      .then(res => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleShowSupporting = async (topic: any) => {
    setSelectedTopic(topic);
    try {
      const res = await api.getComplaints({ category: topic.category, limit: 10 });
      setDrilldownComplaints(res.complaints || []);
      setDrilldownModalOpen(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Leadership Title Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>AICTE Chairman's Office & National Leadership Home</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Root-Cause Diagnostic Intelligence Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Investigating systemic failure origins, cross-institution process bottlenecks, and department backlog trajectories.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/analytics"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Visual Analytics Studio</span>
          </Link>
          <Link
            to="/network"
            className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Case Network</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-500 animate-pulse">
          Computing systemic root-cause vectors...
        </div>
      ) : !data ? (
        <div className="py-24 text-center text-xs text-red-500">
          Failed to load root-cause data.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Executive Intelligence KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Monitored Technical Institutes
              </span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1 block">
                {data.national_summary.total_monitored_institutions}
              </span>
              <span className="text-[10px] text-teal-600 dark:text-cyan-400 font-medium">Pan-India coverage</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                High-Risk Flagged Institutes
              </span>
              <span className="text-2xl font-extrabold text-red-500 mt-1 block">
                {data.national_summary.high_risk_institutions}
              </span>
              <span className="text-[10px] text-red-500 font-medium">Risk Score &gt; 70</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Active Cross-Bureau Conflicts
              </span>
              <span className="text-2xl font-extrabold text-amber-500 mt-1 block">
                {data.national_summary.cross_bureau_conflicts}
              </span>
              <span className="text-[10px] text-amber-600 font-medium">Contradictory directives</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Quarterly Surge Rate
              </span>
              <span className="text-2xl font-extrabold text-indigo-500 mt-1 block flex items-center">
                {data.national_summary.quarterly_growth}
              </span>
              <span className="text-[10px] text-slate-400">Quarter vs previous year</span>
            </div>
          </div>

          {/* Section 1: Frequently Occurring Complaint Themes (Topic Clusters) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Frequently Occurring Topic Clusters (Root-Cause Themes)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Topic clusters with keyword signatures, period change rates, and AI generative rationale
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">
                AI NLP Pattern Engine
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data.topic_clusters.map((tc: any) => (
                <div
                  key={tc.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xl border border-slate-200 dark:border-slate-800 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded font-mono">
                        {tc.category}
                      </span>
                      <span className={`text-xs font-extrabold flex items-center ${
                        tc.trend === 'rising' ? 'text-red-500' : 'text-emerald-500'
                      }`}>
                        {tc.pct_change} this quarter
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {tc.title} ({tc.count} cases)
                    </h4>

                    {/* Keywords Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {tc.primary_keywords.map((kw: string) => (
                        <span
                          key={kw}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-mono"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>

                    {/* Plain Language AI Explanation */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <span className="font-bold text-amber-500 flex items-center gap-1 text-[11px]">
                        <Sparkles className="w-3 h-3" />
                        AI Diagnostic: Why It Is Happening
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                        {tc.ai_explanation}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Show Supporting & View in Network */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleShowSupporting(tc)}
                      className="flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>Show Supporting ({tc.supporting_complaints.length})</span>
                    </button>

                    <Link
                      to={`/network?category=${tc.category}`}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white transition-colors flex items-center justify-center gap-1"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>View in Network</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Department Backlogs & Recurring Process Stage Failures */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Department Backlog Acceleration */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Departments with Growing Backlogs
                </h3>
                <span className="text-[10px] text-red-500 font-bold">Overdue Risk Alert</span>
              </div>

              <div className="space-y-3">
                {data.department_backlogs.map((db: any) => (
                  <div
                    key={db.bureau}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {db.bureau} Bureau
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        db.status_badge === 'Backlog Growing'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 animate-pulse'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}>
                        {db.status_badge} ({db.growth_rate_pct})
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                      <span>Active Backlog: <strong className="text-slate-900 dark:text-white">{db.active_backlog}</strong></span>
                      <span>Overdue (Breached): <strong className="text-red-500">{db.overdue_cases}</strong></span>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono">
                      6-Month Growth Trajectory: [{db.trend_line.join(", ")}]
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurring Process Stage Failures across Institutions */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Recurring Process Stage Failure Hotspots
                </h3>
                <span className="text-[10px] text-teal-600 dark:text-cyan-400 font-mono">Process Intelligence</span>
              </div>

              <div className="space-y-3">
                {data.recurring_process_issues.map((pi: any) => (
                  <div
                    key={pi.stage}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white capitalize">
                        {pi.stage} Process Stage
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {pi.institutions_impacted} Institutes • {pi.complaint_count} Cases
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                      <strong className="text-slate-900 dark:text-white">Failure Point:</strong> {pi.failure_point}
                    </p>

                    <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-[11px] text-teal-800 dark:text-cyan-300">
                      <strong>AICTE Policy Mitigation:</strong> {pi.mitigation_rule}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Supporting Complaints Drill-Down Modal */}
      {drilldownModalOpen && selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-xs font-bold uppercase text-teal-600 dark:text-cyan-400">
                  Supporting Grievance Cases
                </span>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedTopic.title}
                </h3>
              </div>
              <button onClick={() => setDrilldownModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2.5 pr-1">
              {drilldownComplaints.map(c => (
                <div
                  key={c.id}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-teal-700 dark:text-cyan-400">{c.id}</span>
                    <span className="text-slate-500 font-medium">{c.institution_name}</span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {c.status}
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                    {c.english_translation || c.original_text}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDrilldownModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300 text-xs font-semibold"
              >
                Close
              </button>
              <Link
                to={`/network?category=${selectedTopic.category}`}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <span>Open in Network</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
