import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Clock, ArrowRight,
  RefreshCw, Building2, User, ChevronRight, X, FileText, Send, AlertOctagon
} from 'lucide-react';

export const AdminEscalationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'escalations' | 'conflicts'>('escalations');
  const [escalations, setEscalations] = useState<any[]>([]);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected Escalation for Action Modal
  const [selectedEscalation, setSelectedEscalation] = useState<any | null>(null);
  const [actionType, setActionType] = useState<'direction_note' | 'reassign' | 'extend_due_date' | 'resolve'>('direction_note');
  const [actionNote, setActionNote] = useState('');
  const [newBureau, setNewBureau] = useState('Finance');
  const [newDueDate, setNewDueDate] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Conflict Resolution Modal
  const [selectedConflict, setSelectedConflict] = useState<any | null>(null);
  const [conflictNote, setConflictNote] = useState('');
  const [conflictSubmitting, setConflictSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [escRes, confRes] = await Promise.all([
        api.getEscalations().catch(() => ({ escalations: [] })),
        api.getConflicts().catch(() => ({ conflicts: [] }))
      ]);
      setEscalations(escRes.escalations || []);
      setConflicts(confRes.conflicts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeEscalationAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEscalation || !actionNote.trim()) return;

    setActionSubmitting(true);
    try {
      await api.takeEscalationAction(selectedEscalation.id, {
        action_type: actionType,
        note: actionNote.trim(),
        new_bureau: actionType === 'reassign' ? newBureau : undefined,
        new_due_date: actionType === 'extend_due_date' ? newDueDate : undefined
      });
      alert(`Chairman action recorded successfully for ${selectedEscalation.id}`);
      setSelectedEscalation(null);
      setActionNote('');
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to record executive action");
    } finally {
      setActionSubmitting(false);
    }
  };

  const handleResolveConflict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConflict || conflictNote.trim().length < 5) {
      alert("Please provide a mandatory resolution explanation (minimum 5 characters).");
      return;
    }

    setConflictSubmitting(true);
    try {
      await api.resolveConflict(selectedConflict.id, conflictNote.trim());
      alert(`Conflict Alert #${selectedConflict.id} resolved and written to tamper-evident audit log.`);
      setSelectedConflict(null);
      setConflictNote('');
      loadData();
    } catch (e: any) {
      alert(e.message || "Failed to resolve conflict");
    } finally {
      setConflictSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950 to-slate-900 text-white rounded-2xl p-6 shadow-2xl border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>AICTE Chairman's Office • Section 5</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white mt-1">
            Executive Escalations & Cross-Bureau Conflicts Queue
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1">
            Authoritative executive intervention console: cases escalated to the Chairman's level and cross-department contradictory directives.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 shrink-0 gap-1 text-xs">
          <button
            onClick={() => setActiveTab('escalations')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'escalations' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Escalation Queue ({escalations.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'conflicts' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Conflict Alerts ({conflicts.filter(c => c.status === 'active').length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-500 animate-pulse">
          Loading executive queues from national server...
        </div>
      ) : activeTab === 'escalations' ? (
        /* SECTION 5.1 & 5.2: ESCALATIONS QUEUE */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cases Requiring Chairman's Office Intervention
            </h2>
            <span className="text-[11px] text-slate-400">
              Sorted by overdue SLA severity &bull; Full history audit recorded
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {escalations.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No cases currently escalated to Chairman's level.
              </div>
            ) : (
              escalations.map(esc => (
                <div
                  key={esc.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-4 hover:border-amber-500/40 transition-all"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-mono font-bold text-xs border border-amber-500/20">
                        {esc.priority === 'Critical' ? 'CRIT' : 'ESC'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">{esc.id}</span>
                          <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono">
                            {esc.category}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">| {esc.bureau}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                          {esc.institution_name} ({esc.state})
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-red-500 block">
                          +{esc.sla_days_overdue} Days Overdue
                        </span>
                        <span className="text-[10px] text-slate-400">Target was {esc.due_date}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedEscalation(esc);
                          setActionType('direction_note');
                          setActionNote('');
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all shadow-sm"
                      >
                        Take Executive Action
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                    "{esc.original_text}"
                  </p>

                  {/* Escalation History Timeline */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Escalation Trail & Chain of Custody:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      {esc.escalation_history.map((hist: any, hIdx: number) => (
                        <div key={hIdx} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px]">
                          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                            <span>{hist.stage}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{hist.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">{hist.note}</p>
                          <span className="text-[9px] text-teal-600 dark:text-cyan-400 font-mono mt-1 block">Actor: {hist.actor}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* SECTION 5.3: CROSS-BUREAU CONFLICT ALERTS */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Inter-Bureau Collision Alerts
            </h2>
            <span className="text-[11px] text-slate-400">
              Rule-triggered conflicts between approval, finance, inspection, and welfare mandates
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {conflicts.map(conf => (
              <div
                key={conf.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl p-5 border shadow-md space-y-3 ${
                  conf.status === 'resolved'
                    ? 'border-emerald-500/30 opacity-75'
                    : 'border-red-500/40 hover:border-red-500'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      conf.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {conf.status === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{conf.title}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          conf.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        }`}>
                          {conf.status.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">
                        Institution: {conf.institution_name} ({conf.state}) &bull; Rule: <code className="font-mono">{conf.conflict_type}</code>
                      </span>
                    </div>
                  </div>

                  {conf.status !== 'resolved' && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedConflict(conf);
                        setConflictNote('');
                      }}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
                    >
                      Resolve Conflict
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {conf.description}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                  <span className="font-bold text-slate-500">Bureaus Involved:</span>
                  {conf.bureaus_involved?.map((b: string) => (
                    <span key={b} className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
                      {b}
                    </span>
                  ))}
                  <span className="text-slate-400 ml-auto font-mono">{conf.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Modal for Escalated Case (Reassign, Direction Note, Due Date, Resolve) */}
      {selectedEscalation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  <span>Chairman Executive Action</span>
                </h3>
                <p className="text-[11px] text-slate-500">Case #{selectedEscalation.id} &bull; {selectedEscalation.institution_name}</p>
              </div>
              <button
                onClick={() => setSelectedEscalation(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTakeEscalationAction} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Select Action Type:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'direction_note', label: 'Issue Direction Note' },
                    { id: 'reassign', label: 'Reassign Bureau' },
                    { id: 'extend_due_date', label: 'Set New Due Date' },
                    { id: 'resolve', label: 'Mark Resolved' }
                  ].map(act => (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => setActionType(act.id as any)}
                      className={`p-2 rounded-lg font-bold border text-left transition-all ${
                        actionType === act.id
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {act.label}
                    </button>
                  ))}
                </div>
              </div>

              {actionType === 'reassign' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Target Bureau:</label>
                  <select
                    value={newBureau}
                    onChange={e => setNewBureau(e.target.value)}
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="Approval">Approval Bureau</option>
                    <option value="Academic">Academic Bureau</option>
                    <option value="Finance">Finance Bureau</option>
                    <option value="Inspection Cell">Inspection Cell</option>
                    <option value="Student Welfare Cell">Student Welfare Cell</option>
                    <option value="Examination and Quality">Examination and Quality</option>
                  </select>
                </div>
              )}

              {actionType === 'extend_due_date' && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">New Resolution Deadline:</label>
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Chairman Direction / Directive Note (Recorded in Audit Trail):
                </label>
                <textarea
                  rows={3}
                  value={actionNote}
                  onChange={e => setActionNote(e.target.value)}
                  placeholder="Enter specific directives, instructions to bureau head, or grounds for executive closure..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedEscalation(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting || !actionNote.trim()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionSubmitting ? "Committing..." : "Commit Executive Action"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Conflict Modal with Mandatory Note */}
      {selectedConflict && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-red-500" />
                  <span>Resolve Inter-Bureau Conflict</span>
                </h3>
                <p className="text-[11px] text-slate-500">Conflict #{selectedConflict.id} &bull; {selectedConflict.institution_name}</p>
              </div>
              <button
                onClick={() => setSelectedConflict(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResolveConflict} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <strong>Conflict Context:</strong> {selectedConflict.title}
                <div className="text-[11px] text-slate-500 mt-1">{selectedConflict.description}</div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Mandatory Conflict Resolution Explanation Note:
                </label>
                <textarea
                  rows={4}
                  value={conflictNote}
                  onChange={e => setConflictNote(e.target.value)}
                  placeholder="Detail the reconciling directive agreed upon between bureaus (e.g. 'Approval renewal placed in abeyance pending completion of Finance Bureau refund audit')..."
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedConflict(null)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={conflictSubmitting || conflictNote.trim().length < 5}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{conflictSubmitting ? "Resolving..." : "Confirm & Resolve Conflict"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
