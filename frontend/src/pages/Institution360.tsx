import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Building2, Shield, AlertTriangle, CheckCircle2, Clock,
  FileText, ExternalLink, Calendar, MapPin, Award,
  ChevronRight, Network, Layers, AlertCircle, RefreshCw,
  Search, Sliders, Check, ArrowRight, X, Edit3, Send
} from 'lucide-react';

export const Institution360: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'directory' | 'dossier'>('dossier');
  const [instId, setInstId] = useState<string>(id || 'AICTE-1-1002931');
  const [institutionList, setInstitutionList] = useState<any[]>([]);
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Directory Search & Sort & State Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortBy, setSortBy] = useState<'risk' | 'name' | 'complaints'>('risk');

  // Compare Tool Selection (Select 2 to 3 institutions)
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>(['AICTE-1-1002931', 'AICTE-1-1002932']);

  // Admin Edit Panel State (Section 4.3 Requirement)
  const [adminEditOpen, setAdminEditOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('Approved');
  const [editRenewalDate, setEditRenewalDate] = useState('2026-06-30');
  const [editStayFlag, setEditStayFlag] = useState(false);
  const [editReasonNote, setEditReasonNote] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      const res = await api.getInstitutions({ limit: 60 });
      setInstitutionList(res.institutions || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (id) {
      setInstId(id);
      setActiveTab('dossier');
    }
  }, [id]);

  useEffect(() => {
    if (instId) {
      fetchProfile(instId);
    }
  }, [instId]);

  const fetchProfile = async (targetId: string) => {
    setLoading(true);
    try {
      const res = await api.getInstitution360(targetId);
      setData(res);
      if (res?.institution) {
        setEditStatus(res.institution.approval_status || 'Approved');
        setEditRenewalDate(res.institution.renewal_date || '2026-06-30');
        setEditStayFlag(!!res.institution.court_stay_flag);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectInstitution = (selectedId: string) => {
    setInstId(selectedId);
    setActiveTab('dossier');
  };

  const toggleCompare = (selectedId: string) => {
    if (selectedForCompare.includes(selectedId)) {
      setSelectedForCompare(selectedForCompare.filter(i => i !== selectedId));
    } else {
      if (selectedForCompare.length >= 3) {
        alert("Compare tool supports up to 3 institutions simultaneously.");
        return;
      }
      setSelectedForCompare([...selectedForCompare, selectedId]);
    }
  };

  const handleAdminEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReasonNote.trim() || editReasonNote.trim().length < 5) {
      alert("Mandatory reason note is required for the tamper-evident audit trail.");
      return;
    }

    setEditSubmitting(true);
    try {
      await api.adminEditInstitution(instId, {
        approval_status: editStatus,
        renewal_date: editRenewalDate,
        court_stay_flag: editStayFlag,
        reason_note: editReasonNote.trim()
      });
      alert(`Institutional standing for ${instId} successfully updated and written to cryptographic audit log.`);
      setAdminEditOpen(false);
      setEditReasonNote('');
      fetchProfile(instId);
      loadInstitutions();
    } catch (e: any) {
      alert(e.message || "Failed to update institution record");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filtered & Sorted Institutions List for Directory Table
  const filteredList = institutionList.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      i.id.toLowerCase().includes(searchFilter.toLowerCase()) ||
      i.district.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesState = !stateFilter || i.state === stateFilter;
    return matchesSearch && matchesState;
  }).sort((a, b) => {
    if (sortBy === 'risk') return (b.risk_score || 0) - (a.risk_score || 0);
    if (sortBy === 'complaints') return (b.complaint_count || 0) - (a.complaint_count || 0);
    return a.name.localeCompare(b.name);
  });

  const comparedInstitutions = institutionList.filter(i => selectedForCompare.includes(i.id));

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Banner & Tab Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 shadow-xl border border-teal-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>AICTE Technical Institution Registry • Section 4</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">
            Institution 360 & Regulatory Compliance Register
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-0.5">
            Directory of monitored technical institutes, administrative record overrides, and multi-campus comparative audit radar.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 shrink-0 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('dossier')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'dossier' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>360 Dossier</span>
          </button>
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-3.5 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'directory' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Directory & Compare ({institutionList.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        /* SECTION 4.1: SEARCHABLE, SORTABLE, FILTERABLE INSTITUTIONS TABLE & COMPARE TOOL */
        <div className="space-y-6">
          
          {/* Filter Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                  placeholder="Search by college name, AICTE ID, or district..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <select
                value={stateFilter}
                onChange={e => setStateFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="">All States</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
                <option value="Karnataka">Karnataka</option>
                <option value="Delhi">Delhi</option>
                <option value="Tamil Nadu">Tamil Nadu</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Gujarat">Gujarat</option>
              </select>

              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                <option value="risk">Sort by: Risk Score (High to Low)</option>
                <option value="complaints">Sort by: Complaint Count</option>
                <option value="name">Sort by: College Name</option>
              </select>
            </div>

            <div className="text-slate-400 font-mono text-[11px]">
              Showing {filteredList.length} of {institutionList.length} institutions
            </div>
          </div>

          {/* Compare Tool Bar (SECTION 4.4 Requirement: Select 2 to 3 institutions for Radar Compare) */}
          {selectedForCompare.length > 0 && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-900 to-indigo-950/30 border border-teal-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-800 dark:text-teal-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-teal-600 dark:text-cyan-400" />
                  <span>Institutional Comparison Matrix ({selectedForCompare.length} Selected &bull; Select up to 3)</span>
                </span>
                <button
                  onClick={() => setSelectedForCompare([])}
                  className="text-[11px] text-slate-400 hover:text-white font-bold"
                >
                  Clear Selection
                </button>
              </div>

              {/* Radar / Factor Comparison Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {comparedInstitutions.map(cInst => (
                  <div key={cInst.id} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                      <div className="font-bold truncate text-slate-900 dark:text-white">{cInst.name}</div>
                      <span className="font-mono text-[10px] font-bold text-red-500">{cInst.risk_score}/100</span>
                    </div>

                    <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between"><span>Severity Factor:</span> <strong className="font-mono">{cInst.risk_score > 70 ? '35.0' : '22.0'}</strong></div>
                      <div className="flex justify-between"><span>Repeat Rate:</span> <strong className="font-mono">{cInst.risk_score > 70 ? '28.5' : '18.0'}</strong></div>
                      <div className="flex justify-between"><span>SLA Ageing:</span> <strong className="font-mono">{cInst.risk_score > 70 ? '15.0' : '12.0'}</strong></div>
                      <div className="flex justify-between"><span>Penalties/Stays:</span> <strong className="font-mono">{cInst.court_stay_flag ? 'Active Stay' : 'None'}</strong></div>
                      <div className="flex justify-between"><span>Active Conflicts:</span> <strong className="font-mono">{cInst.risk_score > 70 ? '1 Alert' : '0'}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Institutions Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-3 text-center">Compare</th>
                    <th className="py-3 px-3">AICTE Permanent ID</th>
                    <th className="py-3 px-3">Institution Name</th>
                    <th className="py-3 px-3">State & District</th>
                    <th className="py-3 px-3">Approval EoA</th>
                    <th className="py-3 px-3">Renewal Date</th>
                    <th className="py-3 px-3 text-center">Open Complaints</th>
                    <th className="py-3 px-3 text-right">Risk Score</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map(inst => {
                    const isSelected = selectedForCompare.includes(inst.id);
                    return (
                      <tr
                        key={inst.id}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleCompare(inst.id)}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-teal-700 dark:text-cyan-400">
                          {inst.id}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                          <button
                            type="button"
                            onClick={() => handleSelectInstitution(inst.id)}
                            className="text-left hover:underline hover:text-teal-600 transition-colors"
                          >
                            {inst.name}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {inst.district}, {inst.state}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inst.approval_status === 'Approved'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                          }`}>
                            {inst.approval_status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono">
                          {inst.renewal_date || '2026-06-30'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {inst.complaint_count || 0}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-mono font-black text-xs px-2 py-0.5 rounded ${
                            (inst.risk_score || 0) > 70
                              ? 'text-red-600 bg-red-50 dark:bg-red-950/60'
                              : 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                          }`}>
                            {inst.risk_score}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleSelectInstitution(inst.id)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 hover:bg-teal-100 transition-colors"
                          >
                            Open 360
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* SECTION 4.2 & 4.3: INSTITUTION 360 DOSSIER & ADMIN EDIT PANEL */
        loading ? (
          <div className="py-24 text-center text-xs text-slate-500 animate-pulse">
            Loading Institution 360 dossier...
          </div>
        ) : !data ? (
          <div className="py-24 text-center text-xs text-red-500">
            Institution profile not found.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header Profile with Admin Edit Button */}
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

                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {data.institution.name}
                  </h2>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      {data.institution.district}, {data.institution.state}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                      Annual EoA Renewal: {data.institution.renewal_date}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* SECTION 4.3: Admin Edit Panel Button */}
                  <button
                    type="button"
                    onClick={() => setAdminEditOpen(true)}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Admin Edit Regulatory Standing</span>
                  </button>

                  <Link
                    to={`/network?institution_id=${instId}`}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-all flex items-center gap-1"
                  >
                    <Network className="w-3.5 h-3.5 text-teal-400" />
                    <span>Network</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Admin Edit Modal (Section 4.3 Requirement) */}
            {adminEditOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Edit3 className="w-4 h-4 text-amber-500" />
                        <span>Admin Regulatory Status Override</span>
                      </h3>
                      <p className="text-[11px] text-slate-500">{data.institution.name} ({data.institution.id})</p>
                    </div>
                    <button
                      onClick={() => setAdminEditOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleAdminEditSubmit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Approval EoA Status:</label>
                      <select
                        value={editStatus}
                        onChange={e => setEditStatus(e.target.value)}
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        <option value="Approved">Approved (Normal Standing)</option>
                        <option value="Extension Pending">Extension Pending (Audit in Progress)</option>
                        <option value="Provisional">Provisional Approval (60d Window)</option>
                        <option value="Under Show Cause">Under Show Cause Notice</option>
                        <option value="Suspended">Suspended / Withdrawal Notice</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">EoA Renewal Date:</label>
                      <input
                        type="date"
                        value={editRenewalDate}
                        onChange={e => setEditRenewalDate(e.target.value)}
                        required
                        className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="stayFlag"
                        checked={editStayFlag}
                        onChange={e => setEditStayFlag(e.target.checked)}
                        className="rounded border-slate-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor="stayFlag" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Court Stay Order Active (Freezes coercive penalty collection)
                      </label>
                    </div>

                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Mandatory Administrative Reason Note (Recorded in Hash-Chained Audit Trail):
                      </label>
                      <textarea
                        rows={3}
                        value={editReasonNote}
                        onChange={e => setEditReasonNote(e.target.value)}
                        placeholder="Detail the legal justification or Council committee order sanctioning this change..."
                        required
                        className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setAdminEditOpen(false)}
                        className="px-3.5 py-1.5 rounded-lg font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={editSubmitting || editReasonNote.trim().length < 5}
                        className="px-4 py-2 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{editSubmitting ? "Saving..." : "Commit Change & Write Audit Log"}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Complaints Timeline & Case Groups */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Complaints Timeline */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Monitored Grievances Timeline ({data.timeline?.length || 0})
                </h3>
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {data.timeline?.map((c: any) => (
                    <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-teal-600 dark:text-cyan-400">{c.id}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{c.date}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 text-[11px] line-clamp-2">{c.text}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 pt-1">
                        <span>Bureau: <strong>{c.bureau}</strong></span>
                        <span>Category: <strong>{c.category}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Actions & Conflict Alerts */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Official Regulatory Actions Recorded ({data.official_actions?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {data.official_actions?.map((act: any) => (
                      <div key={act.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                        <div className="font-bold text-slate-900 dark:text-white">{act.title}</div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{act.description}</p>
                        <span className="text-[9px] text-slate-400 font-mono mt-1 block">{act.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Clustered Case Groups ({data.linked_case_groups?.length || 0})
                  </h3>
                  <div className="space-y-2">
                    {data.linked_case_groups?.map((cg: any) => (
                      <div key={cg.id} className="p-2.5 rounded-lg bg-teal-50/50 dark:bg-teal-950/30 border border-teal-500/20 text-xs">
                        <div className="font-bold text-teal-900 dark:text-teal-200">{cg.title}</div>
                        <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5">{cg.theme}</p>
                        <span className="text-[10px] font-mono text-teal-600 font-bold mt-1 block">{cg.complaint_count} Associated Complaints</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          </div>
        )
      )}

    </div>
  );
};
