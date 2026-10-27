import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Users, Sliders, FileText, CheckCircle2,
  AlertTriangle, RefreshCw, KeyRound, Lock, Search, Check, X
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'audit' | 'rules' | 'users'>('audit');

  // Audit Logs & Hash Chain Verification state
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Rules State
  const [rulesList, setRulesList] = useState<any[]>([]);

  useEffect(() => {
    loadAuditLogs();
    loadRules();
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.getAuditLogs(50);
      setAuditLogs(res.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  };

  const loadRules = async () => {
    try {
      const res = await api.getRules();
      setRulesList(res.rules || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.getUsers();
      setUsersList(res.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  // Cryptographic Hash Chain Verification (Phase 9 & Demo Step 8 requirement)
  const handleVerifyAuditTrail = async () => {
    setIsVerifying(true);
    setVerificationResult(null);
    try {
      const res = await api.verifyAuditTrail();
      setVerificationResult(res);
    } catch (e: any) {
      alert(e.message || "Audit trail verification request failed.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.updateUser(editingUser.id, {
        role: editingUser.role,
        level: editingUser.level,
        bureau: editingUser.bureau,
        state: editingUser.state,
        is_active: editingUser.is_active
      });
      setEditingUser(null);
      loadUsers();
    } catch (e) {
      alert("Failed to update user");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Settings Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>AICTE System Governance & Regulatory Compliance</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            System Settings & Tamper-Evident Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographic SHA-256 hash-chain verification, SLA rule matrix, and role administration.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'audit' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Audit Trail & Cryptography</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'rules' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>SLA & Conflict Rules</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                activeTab === 'users' ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Users ({usersList.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: AUDIT TRAIL & HASH-CHAIN VERIFICATION */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          
          {/* Cryptographic Verification Action Card */}
          <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white rounded-2xl p-6 shadow-xl border border-teal-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Tamper-Evident SHA-256 Hash Chain Verification
              </span>
              <h3 className="text-base font-bold text-white">
                Cryptographic Audit Log Integrity Ledger
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Every grievance filing, official action, AI override, and report export stores the cryptographic SHA-256 digest of the preceding record.
              </p>
            </div>

            <button
              onClick={handleVerifyAuditTrail}
              disabled={isVerifying}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-glow transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? "Verifying Hash Chaining..." : "Verify Audit Trail Integrity"}</span>
            </button>
          </div>

          {/* Verification Result Modal / Banner */}
          {verificationResult && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in ${
              verificationResult.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/60 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  verificationResult.valid ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-700' : 'bg-red-200 dark:bg-red-900 text-red-700'
                }`}>
                  {verificationResult.valid ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>{verificationResult.status}</span>
                    <span className="text-xs font-mono font-normal">
                      Verified {verificationResult.total_records} entries
                    </span>
                  </div>
                  <div className="text-xs mt-0.5 font-mono">
                    {verificationResult.message}
                  </div>
                </div>
              </div>

              <div className="text-right text-[11px] font-mono text-slate-500 shrink-0">
                <div>Genesis: {verificationResult.genesis_hash}</div>
                <div>Head: {verificationResult.head_hash}</div>
              </div>
            </div>
          )}

          {/* Audit Logs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Immutable Ledger ({auditLogs.length} recent entries)
              </span>
              <span className="text-[10px] text-teal-600 font-mono">
                SHA-256 Link Chained
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3"># Seq</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Officer / User</th>
                    <th className="py-2.5 px-3">Action Event</th>
                    <th className="py-2.5 px-3">Target Entity</th>
                    <th className="py-2.5 px-3">Preceding Hash (Link)</th>
                    <th className="py-2.5 px-3">Current Hash Digest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2 px-3 text-slate-400 font-bold">{log.id}</td>
                      <td className="py-2 px-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                      <td className="py-2 px-3 text-slate-900 dark:text-white font-sans font-semibold">{log.user_name}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-cyan-400 font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-sans">
                        {log.entity_type}: {log.entity_id}
                      </td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]" title={log.prev_hash}>
                        {log.prev_hash.slice(0, 12)}...
                      </td>
                      <td className="py-2 px-3 text-cyan-600 dark:text-cyan-400 font-bold truncate max-w-[120px]" title={log.current_hash}>
                        {log.current_hash.slice(0, 12)}...
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: SLA & CONFLICT RULES MATRIX */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Regulatory SLA & Conflict Rule Engine Configuration
              </h3>
              <p className="text-[11px] text-slate-500">
                Rule engine automatically intercepts filings and flags regulatory contradictions
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Rule ID</th>
                  <th className="py-2.5 px-3">Policy Rule Title</th>
                  <th className="py-2.5 px-3">Trigger Condition</th>
                  <th className="py-2.5 px-3">Regulatory Enforcement Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rulesList.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 font-mono font-bold text-teal-600 dark:text-cyan-400">{r.id}</td>
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{r.name}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">{r.condition}</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-200">{r.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS ADMINISTRATION */}
      {activeTab === 'users' && user?.role === 'admin' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Role-Based Access Control Administration
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email / Phone</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Designation Level</th>
                  <th className="py-2 px-3">Bureau</th>
                  <th className="py-2 px-3">State</th>
                  <th className="py-2 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400">{u.id}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono">{u.email || u.phone}</td>
                    <td className="py-2.5 px-3 uppercase text-[10px] font-bold text-teal-600">{u.role}</td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 font-medium">{u.level}</td>
                    <td className="py-2.5 px-3 text-slate-500">{u.bureau || "-"}</td>
                    <td className="py-2.5 px-3 text-slate-500">{u.state || "All India"}</td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => setEditingUser(u)}
                        className="text-xs font-semibold text-teal-600 hover:underline"
                      >
                        Edit Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Edit User: {editingUser.name}
              </span>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Role</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="student">Student</option>
                  <option value="official">Official</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Level / Designation</label>
                <input
                  type="text"
                  value={editingUser.level}
                  onChange={e => setEditingUser({ ...editingUser, level: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Bureau</label>
                <input
                  type="text"
                  value={editingUser.bureau || ''}
                  onChange={e => setEditingUser({ ...editingUser, bureau: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">State Jurisdiction</label>
                <input
                  type="text"
                  value={editingUser.state || ''}
                  onChange={e => setEditingUser({ ...editingUser, state: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold"
                >
                  Save User Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
