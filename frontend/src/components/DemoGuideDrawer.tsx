import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  X, CheckCircle, ArrowRight, Play, Mic, Camera, FileText,
  Network, Search, AlertTriangle, ShieldCheck, Sparkles
} from 'lucide-react';

interface DemoGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DemoGuideDrawer: React.FC<DemoGuideDrawerProps> = ({ isOpen, onClose }) => {
  const { user, quickLoginAs } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const steps = [
    {
      num: 1,
      title: "File Complaint by Voice & Camera (Student)",
      persona: { role: 'student', phone: '9876543210', otp: '123456', name: 'Aarav Sharma' },
      actionText: "Switch to Student & File in Hindi",
      route: "/student",
      description: "Switch to Student Aarav Sharma, use the Microphone in Hindi or Camera OCR to photograph a receipt, typing 'Apexx College Indore' with a deliberate spelling mistake."
    },
    {
      num: 2,
      title: "View Live AI Triage Trace & Duplicate Cluster",
      persona: { role: 'student', phone: '9876543210', otp: '123456', name: 'Aarav Sharma' },
      actionText: "Check Triage Confirmation Screen",
      route: "/student",
      description: "Inspect the live triage card: Language detected (Hindi) & translated, Institution entity resolved with 95% confidence, routed to Finance Bureau, and duplicate cluster GRP-2025-REFUND-01 assigned."
    },
    {
      num: 3,
      title: "Official Workspace & Sentence-Highlighted AI Summary",
      persona: { role: 'official', email: 'officer.finance@aicte.gov.in', password: 'DemoPass@123', name: 'Vikram Malhotra (Case Officer)' },
      actionText: "Switch to Case Officer Vikram Malhotra",
      route: "/official",
      description: "Open CMP-2025-1000. Click fields in the AI Summary Card (e.g. 'Main Issue') to see the interactive yellow highlight jump to the exact sentence span. Notice the Cross-Bureau Conflict Alert banner."
    },
    {
      num: 4,
      title: "Explore Connected Case Network & Timeline Replay",
      persona: { role: 'official', email: 'officer.finance@aicte.gov.in', password: 'DemoPass@123', name: 'Vikram Malhotra' },
      actionText: "Open Connected Case Network",
      route: "/network",
      description: "Full-screen dark canvas with 9 node types and 10 edge types. Click 'PAT-001: Inter-State Fee Refund' in the Pattern Callouts panel to highlight the cluster across MP & MH. Press the Play button to watch the 12-month timeline replay."
    },
    {
      num: 5,
      title: "AI Natural Language Search & PDF Report Export",
      persona: { role: 'official', email: 'ro.mp@aicte.gov.in', password: 'DemoPass@123', name: 'Rajeshwar Verma (Regional Officer MP)' },
      actionText: "Switch to RO Madhya Pradesh & Search",
      route: "/official",
      description: "Type or speak: 'overdue fee complaints from the last three months in Madhya Pradesh'. Notice the editable parsed chips, filtered results, and click 'Export Report' -> 'PDF'."
    },
    {
      num: 6,
      title: "Bureau Head Workload & SLA Escalation Dashboard",
      persona: { role: 'official', email: 'head.finance@aicte.gov.in', password: 'DemoPass@123', name: 'Dr. Sunita Deshmukh (Bureau Head)' },
      actionText: "Switch to Bureau Head Dr. Sunita Deshmukh",
      route: "/official",
      description: "Observe bureau-wide SLA breach count, aging backlog indicators, and escalated complaints that breached standard 30-day deadlines."
    },
    {
      num: 7,
      title: "Admin Root-Cause Studio & Recurring Failure Patterns",
      persona: { role: 'admin', email: 'admin@aicte.gov.in', password: 'DemoPass@123', name: 'Prof. Anil Sahasrabudhe (Leadership)' },
      actionText: "Switch to Admin Leadership",
      route: "/root-cause",
      description: "Open the Root-Cause Dashboard. Review 'Fee refund process issues rising 38.5% this quarter' and 'Inspection Cell backlog growing 42%'. Click 'Show Supporting Complaints' and 'View in Network'."
    },
    {
      num: 8,
      title: "Verify Cryptographic SHA-256 Audit Trail",
      persona: { role: 'admin', email: 'admin@aicte.gov.in', password: 'DemoPass@123', name: 'Prof. Anil Sahasrabudhe' },
      actionText: "Verify Audit Trail Chain",
      route: "/settings",
      description: "Go to Settings -> Audit Log tab. Click 'Verify Audit Trail'. The backend verifies the SHA-256 hash-chain from genesis to head, proving tamper-free compliance."
    }
  ];

  const handleExecuteStep = async (step: typeof steps[0]) => {
    await quickLoginAs(step.persona);
    navigate(step.route);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Interactive Evaluator Demo Script
              </h2>
              <p className="text-[11px] text-slate-500">
                8-step mandatory end-to-end evaluation scenario
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {steps.map((st) => (
            <div
              key={st.num}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-teal-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white text-xs font-bold flex items-center justify-center">
                  {st.num}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">
                  {st.persona.name}
                </span>
              </div>

              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                {st.title}
              </h4>

              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                {st.description}
              </p>

              <button
                type="button"
                onClick={() => handleExecuteStep(st)}
                className="w-full py-1.5 px-3 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <span>{st.actionText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-center">
          <p className="text-[10px] text-slate-500 font-mono">
            AICTE Complaint Intelligence Hub v2.0 | Prototype Demo Ready
          </p>
        </div>

      </div>
    </div>
  );
};
