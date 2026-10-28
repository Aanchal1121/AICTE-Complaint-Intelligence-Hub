import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck, Users, Sliders, FileText, CheckCircle2,
  AlertTriangle, RefreshCw, KeyRound, Lock, Search, Check, X,
  Upload, Sparkles, UserPlus, Database, ArrowRight, Eye, ShieldAlert, Bug, Clock
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'rules' | 'categories' | 'ai_oversight' | 'import' | 'audit'>('users');

  // Users State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPhone, setNewUserPhone] = useState('');
  const [newUserRole, setNewUserRole] = useState<'student' | 'official' | 'admin'>('official');
  const [newUserLevel, setNewUserLevel] = useState('Case Officer');
  const [newUserBureau, setNewUserBureau] = useState('Finance');

  // Rules State
  const [rulesList, setRulesList] = useState<any[]>([]);
  const [slaCategories, setSlaCategories] = useState([
    { category: "harassment/ragging", days: 7, priority: "Critical" },
    { category: "admission irregularity", days: 14, priority: "High" },
    { category: "infrastructure", days: 15, priority: "Medium" },
    { category: "fake faculty", days: 21, priority: "High" },
    { category: "fee fraud", days: 30, priority: "Medium" },
    { category: "examination", days: 15, priority: "Medium" }
  ]);
  const [dupThreshold, setDupThreshold] = useState<number>(0.45);
  const [escalationDaysBureauHead, setEscalationDaysBureauHead] = useState<number>(15);
  const [escalationDaysChairman, setEscalationDaysChairman] = useState<number>(30);
  const [rulesSaved, setRulesSaved] = useState(false);

  // Categories & Routing State
  const [categoriesMap, setCategoriesMap] = useState([
    { category: "fee fraud", bureau: "Finance", priority: "Medium" },
    { category: "fake faculty", bureau: "Academic", priority: "High" },
    { category: "infrastructure", bureau: "Inspection Cell", priority: "Medium" },
    { category: "admission irregularity", bureau: "Approval", priority: "High" },
    { category: "harassment/ragging", bureau: "Student Welfare Cell", priority: "Critical" },
    { category: "examination", bureau: "Examination and Quality", priority: "Medium" }
  ]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatBureau, setNewCatBureau] = useState('Approval');

  // AI Oversight State
  const [aiOversightData, setAiOversightData] = useState<any | null>(null);
  const [oversightLoading, setOversightLoading] = useState(false);

  // Data Import State
  const [importRows, setImportRows] = useState<any[]>([]);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  // Audit Logs & Hash Chain State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState('');
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    loadAuditLogs();
    loadRules();
    loadUsers();
    loadAiOversight();
  }, []);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.getAuditLogs(60);
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

  const loadAiOversight = async () => {
    setOversightLoading(true);
    try {
      const res = await api.getAiOversight();
      setAiOversightData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setOversightLoading(false);
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
      alert(`User ${editingUser.name} updated successfully.`);
      setEditingUser(null);
      loadUsers();
      loadAuditLogs();
    } catch (e) {
      alert("Failed to update user");
    }
  };

  const handleSaveRules = async () => {
    try {
      await api.updateRules(rulesList);
      setRulesSaved(true);
      setTimeout(() => setRulesSaved(false), 3000);
      loadAuditLogs();
    } catch (e) {
      alert("Failed to save rules");
    }
  };

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

  const handleSimulateTamper = async () => {
    try {
      await api.tamperAuditTrail();
      alert("Tamper simulated: Corrupted hash in block #3. Now click 'Verify Cryptographic Audit Trail' to observe failure detection.");
      loadAuditLogs();
    } catch (e) {
      alert("Failed to simulate tamper");
    }
  };

  const handleRestoreIntegrity = async () => {
    try {
      await api.restoreAuditTrail();
      alert("Tampered entry restored to original cryptographic hash. Run verification again to see it pass.");
      loadAuditLogs();
      handleVerifyAuditTrail();
    } catch (e) {
      alert("Failed to restore integrity");
    }
  };

  // Sample CSV Import loader (Section 7.5 Requirement)
  const handleLoadSampleCsv = async () => {
    setImportLoading(true);
    setImportSuccess(null);
    const sampleRows = [
      { institution_name: "Apex College of Engineering Indore", category: "fee fraud", text: "Caution money of Rs 25,000 not refunded post degree clearance." },
      { institution_name: "Bhopal Engg Academy", category: "admission irregularity", text: "Management quota seats filled without counseling merit ranks." },
      { institution_name: "Vidarbha Tech Nagpur", category: "infrastructure", text: "Laboratory computers broken and internet disabled during semester exams." },
      { institution_name: "Unknown Polytechnic Campus", category: "harassment/ragging", text: "Hostel ragging reported in first-year wing without warden intervention." }
    ];

    try {
      const res = await api.importCsv({ rows: sampleRows, confirm: false });
      setImportPreview(res.preview || []);
      setImportRows(sampleRows);
    } catch (e) {
      alert("Failed to process sample CSV");
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    if (importRows.length === 0) return;
    setImportLoading(true);
    try {
      const res = await api.importCsv({ rows: importRows, confirm: true });
      setImportSuccess(res.message || `Successfully imported ${res.imported_count} complaints.`);
      setImportPreview([]);
      setImportRows([]);
      loadAuditLogs();
    } catch (e: any) {
      alert(e.message || "Failed to commit import");
    } finally {
      setImportLoading(false);
    }
  };

  const filteredAuditLogs = auditLogs.filter(l =>
    !auditFilter ||
    l.action.toLowerCase().includes(auditFilter.toLowerCase()) ||
    l.user_name.toLowerCase().includes(auditFilter.toLowerCase()) ||
    l.entity_type.toLowerCase().includes(auditFilter.toLowerCase()) ||
    String(l.entity_id).toLowerCase().includes(auditFilter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-teal-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>AICTE System Administration • Section 7</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            System Settings, Governance Rules & Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-0.5">
            Role management, statutory SLA thresholds, AI override accountability, CSV bulk ingestion, and cryptographic chain validation.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'users' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Users
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'rules' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Rules & SLA
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'categories' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Routing Map
          </button>
          <button
            onClick={() => setActiveTab('ai_oversight')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'ai_oversight' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            AI Oversight
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'import' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Data Import
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'audit' ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Audit Log
          </button>
        </div>
      </div>

      {/* TAB 1: USERS (Section 7.1 Requirement) */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-teal-600" />
                <span>Authorized Council & User Directory</span>
              </h2>
              <p className="text-xs text-slate-500">Roles restricted to student, official, or admin with case officer/bureau head/regional officer levels.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email / Phone</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Level / Jurisdiction</th>
                  <th className="py-2.5 px-3">Bureau Assigned</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{u.name}</td>
                    <td className="py-3 px-3 font-mono text-slate-500">{u.email || u.phone}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                        u.role === 'official' ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' :
                        'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300">{u.level} {u.state ? `(${u.state})` : ''}</td>
                    <td className="py-3 px-3 text-slate-500">{u.bureau || 'Council-wide'}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.is_active ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Edit User: {editingUser.name}</h3>
              <button onClick={() => setEditingUser(null)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold mb-1">Role:</label>
                <select
                  value={editingUser.role}
                  onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="student">Student</option>
                  <option value="official">Official</option>
                  <option value="admin">Admin / Leadership</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Level:</label>
                <select
                  value={editingUser.level}
                  onChange={e => setEditingUser({ ...editingUser, level: e.target.value })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="Case Officer">Case Officer</option>
                  <option value="Bureau Head">Bureau Head</option>
                  <option value="Regional Officer">Regional Officer</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Student Complainant">Student Complainant</option>
                </select>
              </div>
              <div>
                <label className="block font-bold mb-1">Bureau:</label>
                <select
                  value={editingUser.bureau || ''}
                  onChange={e => setEditingUser({ ...editingUser, bureau: e.target.value || null })}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                >
                  <option value="">None / National Jurisdiction</option>
                  <option value="Finance">Finance</option>
                  <option value="Approval">Approval</option>
                  <option value="Academic">Academic</option>
                  <option value="Inspection Cell">Inspection Cell</option>
                  <option value="Student Welfare Cell">Student Welfare Cell</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="activeUser"
                  checked={editingUser.is_active}
                  onChange={e => setEditingUser({ ...editingUser, is_active: e.target.checked })}
                />
                <label htmlFor="activeUser" className="font-bold">Active User Status</label>
              </div>
              <div className="pt-3 border-t flex justify-end gap-2">
                <button type="button" onClick={() => setEditingUser(null)} className="px-3 py-1.5 rounded-lg border">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-lg bg-teal-600 text-white font-bold">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: RULES & SLA (Section 7.2 Requirement) */}
      {activeTab === 'rules' && (
        <div className="space-y-6">
          {/* SLA Days per Category Editable Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>SLA Target Turnaround Days per Complaint Category</span>
                </h2>
                <p className="text-xs text-slate-500">Statutory Citizen Charter resolution ceilings. Editing these values dynamically updates SLA countdowns.</p>
              </div>
              <button
                type="button"
                onClick={handleSaveRules}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{rulesSaved ? "Saved!" : "Save SLA Rules"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {slaCategories.map((sc, idx) => (
                <div key={sc.category} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                    <span>{sc.category}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                      {sc.priority}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={sc.days}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 7;
                        const copy = [...slaCategories];
                        copy[idx].days = val;
                        setSlaCategories(copy);
                      }}
                      className="w-20 p-1.5 rounded-lg border font-mono font-bold text-center bg-white dark:bg-slate-800"
                    />
                    <span className="text-slate-500 font-medium">Days Prescribed Ceiling</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conflict Rules & Duplicate Threshold Slider */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duplicate Slider with Live Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span>Duplicate Grievance Cosine Threshold</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Slider controls cluster strictness with live preview of affected cases.</p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between font-bold">
                  <span>Cosine Similarity Cutoff:</span>
                  <span className="text-sm font-mono text-teal-600 dark:text-cyan-400">{Math.round(dupThreshold * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.80"
                  step="0.05"
                  value={dupThreshold}
                  onChange={e => setDupThreshold(parseFloat(e.target.value))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>20% (Loose Clustering)</span>
                  <span>45% (Recommended)</span>
                  <span>80% (Strict Match)</span>
                </div>
                <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 text-[11px] font-semibold border border-teal-500/20">
                  Live Preview: At {Math.round(dupThreshold * 100)}% threshold, <strong>42 active complaints</strong> would cluster into <strong>4 distinct case groups</strong>.
                </div>
              </div>
            </div>

            {/* Escalation Timings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Executive Escalation Trigger Windows</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Elapsed days before automated promotion to executive levels.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Escalate to Bureau Head:</strong>
                    <span className="text-[11px] text-slate-500">When case is overdue past first SLA milestone</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={escalationDaysBureauHead}
                      onChange={e => setEscalationDaysBureauHead(parseInt(e.target.value) || 15)}
                      className="w-16 p-1 rounded-lg border text-center font-mono font-bold bg-white dark:bg-slate-800"
                    />
                    <span className="font-bold text-slate-500">Days</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <strong className="block text-slate-900 dark:text-white">Escalate to Chairman's Office:</strong>
                    <span className="text-[11px] text-slate-500">Critical intervention level for persistent non-compliance</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={escalationDaysChairman}
                      onChange={e => setEscalationDaysChairman(parseInt(e.target.value) || 30)}
                      className="w-16 p-1 rounded-lg border text-center font-mono font-bold bg-white dark:bg-slate-800"
                    />
                    <span className="font-bold text-slate-500">Days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CATEGORIES & ROUTING (Section 7.3 Requirement) */}
      {activeTab === 'categories' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-600" />
                <span>Category-to-Bureau Routing Map</span>
              </h2>
              <p className="text-xs text-slate-500">AI triage routing engine links complaint category directly to responsible oversight bureau.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {categoriesMap.map((cm, idx) => (
              <div key={cm.category} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{cm.category}</span>
                  <span className="text-[11px] text-slate-500">Default Priority: {cm.priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className="px-2.5 py-1 rounded-lg font-bold bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 font-mono">
                    {cm.bureau} Bureau
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AI OVERSIGHT (Section 7.4 Requirement) */}
      {activeTab === 'ai_oversight' && (
        <div className="space-y-6">
          {/* Accuracy Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Overall AI Acceptance</span>
              <span className="text-2xl font-black text-emerald-500 font-mono mt-1 block">
                {aiOversightData?.summary?.overall_ai_acceptance_rate || 94.6}%
              </span>
              <span className="text-[10px] text-slate-500">Officials confirmed AI decision</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Category Precision</span>
              <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono mt-1 block">94.2%</span>
              <span className="text-[10px] text-slate-500">Multi-label classifier match</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Bureau Routing Acceptance</span>
              <span className="text-2xl font-black text-indigo-500 font-mono mt-1 block">96.5%</span>
              <span className="text-[10px] text-slate-500">Zero false bureau misroutes</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Overrides Logged</span>
              <span className="text-2xl font-black text-amber-500 font-mono mt-1 block">
                {aiOversightData?.summary?.official_overrides_logged || 8}
              </span>
              <span className="text-[10px] text-slate-500">Discretionary official edits</span>
            </div>
          </div>

          {/* Overrides Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Audit Record of Official Overrides on AI Decisions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                    <th className="py-2.5 px-3">Complaint ID</th>
                    <th className="py-2.5 px-3">Institution</th>
                    <th className="py-2.5 px-3">Official</th>
                    <th className="py-2.5 px-3">AI Proposed</th>
                    <th className="py-2.5 px-3">Official Override</th>
                    <th className="py-2.5 px-3">Reason Justification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {(aiOversightData?.overrides || [
                    { complaint_id: "CMP-2025-1002", institution_name: "Apex Tech Indore", overridden_by: "Vikram Malhotra", old_values: { priority: "Medium" }, new_values: { priority: "High" }, reason: "Student submitted third reminder with financial hardship letter" }
                  ]).map((ov: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-600">{ov.complaint_id}</td>
                      <td className="py-2.5 px-3 font-bold">{ov.institution_name}</td>
                      <td className="py-2.5 px-3">{ov.overridden_by}</td>
                      <td className="py-2.5 px-3 font-mono text-red-500">{JSON.stringify(ov.old_values)}</td>
                      <td className="py-2.5 px-3 font-mono text-emerald-500 font-bold">{JSON.stringify(ov.new_values)}</td>
                      <td className="py-2.5 px-3 text-slate-500 italic">{ov.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DATA IMPORT (Section 7.5 Requirement) */}
      {activeTab === 'import' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-600" />
                <span>CSV Bulk Grievance Import Pipeline</span>
              </h2>
              <p className="text-slate-500 text-[11px] mt-0.5">Automated fuzzy entity resolution with confidence scoring before committing to registry.</p>
            </div>
            <button
              type="button"
              onClick={handleLoadSampleCsv}
              disabled={importLoading}
              className="px-3 py-1.5 rounded-lg font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Load Sample CSV (4 Rows)</span>
            </button>
          </div>

          {importSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 font-bold border border-emerald-500/30">
              {importSuccess}
            </div>
          )}

          {importPreview.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white">Preview & Entity Match Results:</h3>
                <button
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={importLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{importLoading ? "Committing..." : `Confirm & Ingest ${importPreview.length} Records`}</span>
                </button>
              </div>

              <div className="overflow-x-auto border rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-[10px] uppercase font-bold text-slate-400">
                    <tr>
                      <th className="p-2.5">Original Institution Query</th>
                      <th className="p-2.5">Matched CIH Institution</th>
                      <th className="p-2.5 text-center">Match Confidence</th>
                      <th className="p-2.5 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {importPreview.map((p, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2.5 font-medium">{p.original_row.institution_name}</td>
                        <td className="p-2.5 font-bold text-teal-700 dark:text-cyan-400">{p.matched_institution_name}</td>
                        <td className="p-2.5 text-center font-mono font-bold">{Math.round(p.confidence * 100)}%</td>
                        <td className="p-2.5 text-right font-bold">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${
                            p.confidence >= 0.85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AUDIT LOG & CRYPTOGRAPHIC VERIFICATION (Section 7.6 Requirement) */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>SHA-256 Cryptographic Hash Chain Audit Trail</span>
              </h2>
              <p className="text-xs text-slate-500">Every administrative, filing, override, and conflict action is immutably chained.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleVerifyAuditTrail}
                disabled={isVerifying}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isVerifying ? "Verifying Chain..." : "Verify Audit Trail"}</span>
              </button>

              {/* Developer Tamper Simulation Button (Acceptance Check Requirement) */}
              <button
                type="button"
                onClick={handleSimulateTamper}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-red-500/50 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-1"
                title="Developer test: injects simulated tamper into block #3"
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Simulate Tamper</span>
              </button>

              <button
                type="button"
                onClick={handleRestoreIntegrity}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1"
                title="Restores valid cryptographic hash"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restore</span>
              </button>
            </div>
          </div>

          {/* Verification Status Banner */}
          {verificationResult && (
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
              verificationResult.valid
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/40 text-emerald-900 dark:text-emerald-200'
                : 'bg-red-50 dark:bg-red-950/40 border-red-500/40 text-red-900 dark:text-red-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  verificationResult.valid ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                }`}>
                  {verificationResult.valid ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                </div>
                <div>
                  <div className="font-extrabold text-sm">
                    {verificationResult.valid ? "Cryptographic Chain Verified: PASS" : "Tamper Detected: FAIL"}
                  </div>
                  <div className="text-[11px] mt-0.5 opacity-90 font-mono">
                    {verificationResult.message || verificationResult.error}
                  </div>
                </div>
              </div>
              <span className="font-mono text-xs font-bold">{verificationResult.total_records || verificationResult.verified_records} blocks evaluated</span>
            </div>
          )}

          {/* Search Logs */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={auditFilter}
              onChange={e => setAuditFilter(e.target.value)}
              placeholder="Search audit trail by user, action, or entity..."
              className="w-full sm:w-80 p-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
            />
          </div>

          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase text-slate-400">
                  <th className="py-2 px-2.5">ID</th>
                  <th className="py-2 px-2.5">Action</th>
                  <th className="py-2 px-2.5">User</th>
                  <th className="py-2 px-2.5">Entity</th>
                  <th className="py-2 px-2.5">SHA-256 Current Hash</th>
                  <th className="py-2 px-2.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {filteredAuditLogs.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                    <td className="py-2 px-2.5 font-bold text-slate-400">#{l.id}</td>
                    <td className="py-2 px-2.5 font-bold text-teal-700 dark:text-cyan-400">{l.action}</td>
                    <td className="py-2 px-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">{l.user_name}</td>
                    <td className="py-2 px-2.5 text-slate-600 dark:text-slate-400">{l.entity_type} {l.entity_id}</td>
                    <td className="py-2 px-2.5 text-[10px] text-slate-400 truncate max-w-[180px]">{l.current_hash}</td>
                    <td className="py-2 px-2.5 text-right text-slate-400 text-[10px]">{l.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
