import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import {
  Building2, Shield, AlertTriangle, CheckCircle2, Clock,
  FileText, ExternalLink, Calendar, MapPin, Award,
  ChevronRight, Network, Layers, AlertCircle, RefreshCw
} from 'lucide-react';

export const Institution360: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [instId, setInstId] = useState<string>(id || 'AICTE-1-1002931'); // default to Apex Institute
  const [institutionList, setInstitutionList] = useState<any[]>([]);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    api.getInstitutions({ limit: 60 })
      .then(res => setInstitutionList(res.institutions || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (id) {
      setInstId(id);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile(instId);
  }, [instId]);

  const fetchProfile = async (targetId: string) => {
    setLoading(true);
    try {
      const res = await api.getInstitution360(targetId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredInsts = institutionList.filter(i => 
    i.name.toLowerCase().includes(searchFilter.toLowerCase()) || 
    i.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
    i.district.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Selector Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              AICTE Institution 360 Dossier
            </h2>
            <p className="text-xs text-slate-500">
              One institution, one unified complaint view, across every AICTE bureau and regional cell
            </p>
          </div>
        </div>

        {/* Institution Quick Switcher Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={instId}
            onChange={e => setInstId(e.target.value)}
            className="w-full md:w-80 p-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
          >
            {filteredInsts.map(i => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.district}) - Risk: {i.risk_score}
              </option>
            ))}
          </select>

          <Link
            to={`/network?institution_id=${instId}`}
            className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-md transition-all flex items-center gap-1.5 shrink-0"
          >
            <Network className="w-4 h-4" />
            <span className="hidden sm:inline">Network View</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-500 animate-pulse">
          Loading Institution 360 intelligence dossier...
        </div>
      ) : !data ? (
        <div className="py-24 text-center text-xs text-red-500">
          Institution record not found.
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Institution Header Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-teal-500/30">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-teal-500/20 text-cyan-300 border border-teal-500/40">
                    AICTE ID: {data.institution.id}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    data.institution.approval_status === 'Approved'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    Status: {data.institution.approval_status}
                  </span>
                  {data.institution.court_stay_flag && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/30 text-red-300 border border-red-500/50 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Court Stay Order Active
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  {data.institution.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    {data.institution.district}, {data.institution.state}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Annual EoA Renewal: {data.institution.renewal_date}
                  </span>
                  {data.institution.aliases && data.institution.aliases.length > 0 && (
                    <span className="text-slate-400 italic">
                      Aliases: {data.institution.aliases.join(", ")}
                    </span>
                  )}
                </div>
              </div>

              {/* Explainable Risk Score Gauge (0 to 100) */}
              <div className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex items-center space-x-4 shrink-0 shadow-inner">
                <div className="text-center">
                  <div className={`text-3xl font-extrabold ${
                    data.institution.risk_score > 75
                      ? 'text-red-400'
                      : data.institution.risk_score > 50
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}>
                    {data.institution.risk_score}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono uppercase mt-0.5">
                    Risk Score / 100
                  </div>
                </div>

                <div className="border-l border-slate-700 pl-4 space-y-1 text-xs">
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-400">Severity Factor:</span>
                    <span className="text-white font-mono">{data.institution.risk_factors?.severity_score || 35.0}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-400">Repeat Frequency:</span>
                    <span className="text-white font-mono">{data.institution.risk_factors?.repeat_frequency || 28.5}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-400">SLA Ageing:</span>
                    <span className="text-white font-mono">{data.institution.risk_factors?.sla_ageing || 15.0}</span>
                  </div>
                  <div className="flex justify-between gap-3 text-[11px]">
                    <span className="text-slate-400">Penalties:</span>
                    <span className="text-white font-mono">{data.institution.risk_factors?.penalties || 10.0}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Cross-Bureau Conflict Alerts Section (Rule Engine) */}
          {data.conflict_alerts && data.conflict_alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                Active Cross-Bureau Regulatory Conflict Alerts ({data.conflict_alerts.length})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.conflict_alerts.map((ca: any) => (
                  <div
                    key={ca.id}
                    className="p-4 rounded-xl border border-red-300 dark:border-red-900 bg-red-50/70 dark:bg-red-950/40 text-xs space-y-2 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-red-900 dark:text-red-200">
                        {ca.title}
                      </span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-200 text-red-900 dark:bg-red-900 dark:text-red-100">
                        {ca.severity} Conflict
                      </span>
                    </div>

                    <p className="text-red-800 dark:text-red-300 leading-relaxed">
                      {ca.description}
                    </p>

                    <div className="flex items-center gap-2 pt-1 border-t border-red-200 dark:border-red-900/60 text-[11px] text-red-700 dark:text-red-400 font-mono">
                      <span>Bureaus Involved:</span>
                      {ca.bureaus_involved?.map((b: string) => (
                        <span key={b} className="bg-red-100 dark:bg-red-900/50 px-1.5 py-0.5 rounded">
                          {b}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Complaints</span>
              <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
                {data.stats.total_complaints}
              </span>
              <span className="text-[10px] text-slate-400">Across 12 months</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Open / Under Review</span>
              <span className="text-2xl font-bold text-amber-500 mt-1 block">
                {data.stats.open_complaints}
              </span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">Pending action</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Resolved Cases</span>
              <span className="text-2xl font-bold text-emerald-500 mt-1 block">
                {data.stats.resolved_complaints}
              </span>
              <span className="text-[10px] text-slate-400">Compliance verified</span>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">SLA Breached Cases</span>
              <span className="text-2xl font-bold text-red-500 mt-1 block">
                {data.stats.breached_complaints}
              </span>
              <span className="text-[10px] text-red-500 font-medium">Escalated to Bureau Head</span>
            </div>
          </div>

          {/* Bureau-Wise Status Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Bureau-Wise Grievance Distribution
              </h3>

              <div className="space-y-2">
                {Object.entries(data.stats.bureau_breakdown || {}).map(([bur, cnt]: any) => (
                  <div key={bur} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{bur} Bureau</span>
                      <span className="font-mono text-slate-900 dark:text-white font-bold">{cnt} cases</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full"
                        style={{ width: `${Math.min(100, (cnt / data.stats.total_complaints) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Category Breakdown & Repeat Patterns
              </h3>

              <div className="space-y-2">
                {Object.entries(data.stats.category_breakdown || {}).map(([cat, cnt]: any) => (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs capitalize">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{cat}</span>
                      <span className="font-mono text-slate-900 dark:text-white font-bold">{cnt}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 rounded-full"
                        style={{ width: `${Math.min(100, (cnt / data.stats.total_complaints) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Timeline of Complaints across Bureaus */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Full Grievance Timeline Across All AICTE Bureaus ({data.timeline.length})
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Chronological Audit Log</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {data.timeline.map((c: any) => (
                <div
                  key={c.id}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800/40 text-xs transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-teal-700 dark:text-cyan-400">{c.id}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {c.bureau}
                      </span>
                      <span className="text-[10px] capitalize text-slate-500 font-semibold">
                        {c.category}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 line-clamp-1">{c.text}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-right">
                    <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      c.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Regulatory Penalties & Actions */}
          {data.official_actions && data.official_actions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Enforcement Actions, Notices & Penalties ({data.official_actions.length})
              </h3>

              <div className="space-y-2">
                {data.official_actions.map((act: any) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{act.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{act.date}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{act.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
