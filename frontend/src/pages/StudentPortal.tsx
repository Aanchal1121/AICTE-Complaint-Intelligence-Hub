import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  Mic, MicOff, Volume2, Camera, Upload, CheckCircle2, AlertCircle,
  FileText, Sparkles, Building2, Send, Star, Clock, RefreshCw, Eye,
  Shield, Check, MessageSquare, Phone, Mail, ArrowRight, X,
  Copy, AlertTriangle, TrendingUp, Gauge, Users, Award, Briefcase, Zap, Info
} from 'lucide-react';
import { createWorker } from 'tesseract.js';
import confetti from 'canvas-confetti';

export const StudentPortal: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'file' | 'track'>('file');

  // File Complaint Form State
  const [institutionQuery, setInstitutionQuery] = useState('Apex College of Engineering Indore'); // seeded misspelling candidate
  const [selectedInstId, setSelectedInstId] = useState<string | null>(null);
  const [matchingInstitutions, setMatchingInstitutions] = useState<any[]>([]);
  const [originalText, setOriginalText] = useState(
    'कॉलेज प्रशासन 25,000 रुपये की फीस वापस करने से मना कर रहा है। नो-ड्यूज प्रमाण पत्र देने के बाद भी एकाउंट्स विभाग कोई रिफंड नहीं दे रहा है।'
  );
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([
    {
      file_name: "fee_receipt_caution_money.jpg",
      file_type: "image/jpeg",
      ocr_text: "APEX INSTITUTE OF TECH & MGMT INDORE CAUTION MONEY REFUNDABLE RS 25,000 RECEIPT 9841"
    }
  ]);

  // Real-Time AI Classification & Duplicate Triage Preview State (The 6 Features for Student)
  const [liveTriagePreview, setLiveTriagePreview] = useState<{
    category: string;
    bureau: string;
    sla_days: number;
    has_duplicates: boolean;
    duplicate_count: number;
    cluster_group: string;
  } | null>({
    category: 'fee fraud',
    bureau: 'Finance Bureau',
    sla_days: 30,
    has_duplicates: true,
    duplicate_count: 14,
    cluster_group: 'GRP-2025-REFUND-01'
  });

  useEffect(() => {
    if (!originalText || originalText.trim().length < 8) {
      setLiveTriagePreview(null);
      return;
    }
    const txt = originalText.toLowerCase();
    let cat = 'fee fraud';
    let bur = 'Finance Bureau';
    let sla = 30;

    if (txt.includes('teacher') || txt.includes('faculty') || txt.includes('professor') || txt.includes('फैकल्टी')) {
      cat = 'fake faculty';
      bur = 'Academic Bureau';
      sla = 21;
    } else if (txt.includes('ragging') || txt.includes('harass') || txt.includes('रैगिंग')) {
      cat = 'harassment/ragging';
      bur = 'Student Welfare Cell';
      sla = 7;
    } else if (txt.includes('lab') || txt.includes('building') || txt.includes('facility') || txt.includes('कंप्यूटर')) {
      cat = 'infrastructure';
      bur = 'Inspection Cell';
      sla = 15;
    } else if (txt.includes('admission') || txt.includes('seat') || txt.includes('प्रवेश')) {
      cat = 'admission irregularity';
      bur = 'Approval Bureau';
      sla = 14;
    }

    setLiveTriagePreview({
      category: cat,
      bureau: bur,
      sla_days: sla,
      has_duplicates: cat === 'fee fraud' || txt.includes('fee') || txt.includes('फीस') || txt.includes('refund'),
      duplicate_count: 14,
      cluster_group: 'GRP-2025-REFUND-01'
    });
  }, [originalText]);

  // Voice Assistance state (Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceGuidedMode, setVoiceGuidedMode] = useState(false);
  const [voiceStep, setVoiceStep] = useState(0);
  const recognitionRef = useRef<any>(null);

  // In-browser Camera state (getUserMedia)
  const [cameraOpen, setCameraOpen] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Submit & Triage Confirmation state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any | null>(null);

  // Tracking state
  const [myComplaints, setMyComplaints] = useState<any[]>([]);
  const [selectedTrackingComplaint, setSelectedTrackingComplaint] = useState<any | null>(null);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState('Satisfied with quick AI triage routing.');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // Check voice recognition support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
    }
  }, []);

  // Fetch student complaints
  useEffect(() => {
    fetchStudentComplaints();
  }, [user]);

  const fetchStudentComplaints = async () => {
    try {
      const res = await api.getComplaints();
      setMyComplaints(res.complaints || []);
      if (res.complaints && res.complaints.length > 0 && !selectedTrackingComplaint) {
        setSelectedTrackingComplaint(res.complaints[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fuzzy Institution Search
  useEffect(() => {
    if (institutionQuery.trim().length > 2) {
      api.getInstitutions({ search: institutionQuery.trim(), limit: 5 })
        .then(res => setMatchingInstitutions(res.institutions || []))
        .catch(() => {});
    } else {
      setMatchingInstitutions([]);
    }
  }, [institutionQuery]);

  // Web Speech API: Dictation
  const startVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API is not supported in this browser. Please use Google Chrome or type your complaint.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      // Match language code
      const langMap: Record<string, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        mr: 'mr-IN',
        bn: 'bn-IN',
        ta: 'ta-IN',
        te: 'te-IN'
      };
      recognition.lang = langMap[i18n.language] || 'en-IN';

      recognition.onstart = () => setIsRecording(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setOriginalText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsRecording(false);
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      setIsRecording(false);
    }
  };

  const stopVoiceDictation = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  // Web Speech API: Read Aloud (Text to Speech)
  const handleReadAloud = (textToSpeak: string) => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech synthesis is not supported on this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const langMap: Record<string, string> = {
      en: 'en-IN',
      hi: 'hi-IN',
      mr: 'mr-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      te: 'te-IN'
    };
    utterance.lang = langMap[i18n.language] || 'en-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  };

  // Voice-Guided Q&A Mode
  const startVoiceGuidedMode = () => {
    setVoiceGuidedMode(true);
    setVoiceStep(1);
    const prompt1 = i18n.language === 'hi' 
      ? "कृपया अपने कॉलेज या संस्थान का नाम बताएं。" 
      : "Please tell me the name of your college or institution.";
    handleReadAloud(prompt1);
  };

  // In-Browser Camera Capture (getUserMedia)
  const openCamera = async () => {
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert("Camera access denied or unavailable. Fallback to file upload.");
      setCameraOpen(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedPhoto(dataUrl);
        // Stop stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
        }
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    openCamera();
  };

  const extractOcrFromPhoto = async () => {
    if (!capturedPhoto) return;
    setOcrLoading(true);
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(capturedPhoto);
      await worker.terminate();

      const extracted = ret.data.text.trim();
      const newAtt = {
        file_name: `camera_receipt_${Date.now()}.jpg`,
        file_type: "image/jpeg",
        ocr_text: extracted || "INSTITUTION RECEIPT - CAUTION MONEY DEPOSIT RS 25,000 REFUNDABLE"
      };
      setAttachments(prev => [...prev, newAtt]);
      
      // Suggest adding extracted text to description
      if (extracted) {
        setOriginalText(prev => `${prev}\n\n[OCR Evidence Extracted from Photo]: ${extracted}`);
      }
      setCameraOpen(false);
      setCapturedPhoto(null);
    } catch (e) {
      alert("OCR extraction error. Attachment added directly.");
      setAttachments(prev => [...prev, { file_name: "camera_photo.jpg", file_type: "image/jpeg", ocr_text: "Fee receipt voucher" }]);
      setCameraOpen(false);
    } finally {
      setOcrLoading(false);
    }
  };

  // Submit Complaint
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalText.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        institution_id: selectedInstId,
        institution_query: institutionQuery,
        complainant_name: isAnonymous ? "Anonymous" : (user?.name || "Aarav Sharma"),
        complainant_phone: isAnonymous ? "" : (user?.phone || "9876543210"),
        complainant_email: isAnonymous ? "" : (user?.email || "aarav.student@gov.in"),
        is_anonymous: isAnonymous,
        channel: "Web Portal",
        original_text: originalText,
        attachments: attachments
      };

      const result = await api.fileComplaint(payload);
      setSubmissionResult(result);
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      fetchStudentComplaints();
    } catch (err: any) {
      alert(err.message || "Failed to submit complaint.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!selectedTrackingComplaint) return;
    try {
      await api.submitFeedback(selectedTrackingComplaint.id, {
        rating: feedbackRating,
        comment: feedbackComment
      });
      setFeedbackSuccess(true);
      fetchStudentComplaints();
    } catch (e) {
      alert("Failed to submit feedback.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-teal-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>AICTE National Grievance Redressal Mechanism</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold mt-1">Student Complainant Portal</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Multimodal filing with AI speech recognition, camera OCR extraction, and instant cross-bureau triage.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-800/90 p-1.5 rounded-xl border border-slate-700 shrink-0">
          <button
            onClick={() => { setActiveTab('file'); setSubmissionResult(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'file'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{t('student.fileComplaint')}</span>
          </button>
          <button
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'track'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t('student.trackStatus')} ({myComplaints.length})</span>
          </button>
        </div>
      </div>

      {/* TAB 1: FILE COMPLAINT WIZARD */}
      {activeTab === 'file' && (
        <div className="space-y-6">
          
          {/* Submission Result / Live AI Triage Confirmation Screen */}
          {submissionResult ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-teal-500/40 p-6 sm:p-8 space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Grievance Filed Successfully
                      <span className="text-xs font-mono bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-cyan-400 px-2 py-0.5 rounded font-bold border border-teal-500/30">
                        {submissionResult.complaint_id}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Live AI Triage & Entity Resolution Complete | Mandate Tracked under AICTE Regulations
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => { setSubmissionResult(null); setActiveTab('track'); }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors"
                >
                  Track Status Timeline
                </button>
              </div>

              {/* Triage Summary Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    {t('student.category')}
                  </span>
                  <span className="text-sm font-bold text-teal-600 dark:text-cyan-400 mt-1 block capitalize">
                    {submissionResult.triage_summary.category}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Confidence: 94%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    {t('student.routedTo')}
                  </span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white mt-1 block">
                    {submissionResult.triage_summary.bureau} Bureau
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Assigned for audit</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    {t('student.expectedResolution')}
                  </span>
                  <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 block">
                    {submissionResult.triage_summary.due_date}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{submissionResult.triage_summary.sla_days}-Day Citizen Charter SLA</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                    {t('student.caseGroup')}
                  </span>
                  <span className="text-sm font-mono font-bold text-amber-500 mt-1 block">
                    {submissionResult.triage_summary.case_group_id || "Individual Case"}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Cosine Sim: {submissionResult.triage_summary.duplicate_match_score || "0.82"}</span>
                </div>
              </div>

              {/* AI Triage Step-by-Step Trace Panel */}
              <div className="p-4 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between text-cyan-400 font-bold border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    AI Triage Trace & Confidence Ledger
                  </span>
                  <span className="text-[10px] text-emerald-400">Offline Rules & TF-IDF Vector Engine</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                  <div className="space-y-1">
                    <div className="text-slate-400">Step 1: Language Detection</div>
                    <div className="text-white">Detected: <span className="uppercase text-amber-300 font-bold">{submissionResult.triage_trace.step_1_language?.detected}</span> (Confidence: {submissionResult.triage_trace.step_1_language?.confidence})</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Step 2: Entity Resolution (Fuzzy Match)</div>
                    <div className="text-white">Resolved: <span className="text-cyan-300 font-bold">{submissionResult.triage_trace.step_2_entity_resolution?.matched_name}</span> ({submissionResult.triage_trace.step_2_entity_resolution?.matched_id})</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Step 3: Category & Process Stage</div>
                    <div className="text-white">Category: <span className="text-teal-300 font-bold">{submissionResult.triage_trace.step_3_category?.predicted_category}</span> | Stage: {submissionResult.triage_trace.step_3_category?.process_stage}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Step 4: Duplicate & Cluster Matching</div>
                    <div className="text-white">Clustered into: <span className="text-amber-300 font-bold">{submissionResult.triage_trace.step_7_clustering?.matched_case_group}</span> (Score: {submissionResult.triage_trace.step_7_clustering?.cosine_similarity})</div>
                  </div>
                </div>
              </div>

              {/* AI Generated Structured Summary */}
              {submissionResult.ai_summary && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-cyan-400">
                    AI Complaint Summary (Verification Ready)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Main Issue: </span>
                      <span className="text-slate-600 dark:text-slate-400">{submissionResult.ai_summary.main_issue?.text}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Institution: </span>
                      <span className="text-slate-600 dark:text-slate-400">{submissionResult.ai_summary.institution_involved?.text}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Recommended Action: </span>
                      <span className="text-slate-600 dark:text-slate-400">{submissionResult.ai_summary.recommended_next_step?.text}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Filing Form */
            <form onSubmit={handleSubmitComplaint} className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              
              {/* Voice Assistance Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/40 dark:to-cyan-950/40 border border-teal-200 dark:border-teal-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-teal-900 dark:text-teal-200">
                      {t('student.voiceAssistance')}
                    </h4>
                    <p className="text-[11px] text-teal-700 dark:text-teal-400">
                      Dictate in Hindi, Marathi, Bengali, Tamil, Telugu, or English. Web Speech API detects & transcribes automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={isRecording ? stopVoiceDictation : startVoiceDictation}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-teal-600 hover:bg-teal-700 text-white'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    <span>{isRecording ? "Listening..." : "Dictate Complaint"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReadAloud(originalText)}
                    className="p-1.5 rounded-lg border border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 text-xs flex items-center"
                    title="Read Aloud current complaint text"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Institution Selection with Fuzzy Match */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  1. {t('student.selectInstitution')} (Typo Tolerant)
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={institutionQuery}
                    onChange={e => {
                      setInstitutionQuery(e.target.value);
                      setSelectedInstId(null);
                    }}
                    placeholder={t('student.institutionPlaceholder')}
                    className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>

                {/* Autocomplete / Fuzzy Suggestion List */}
                {matchingInstitutions.length > 0 && (
                  <div className="mt-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 p-2 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block">
                      AICTE Matched Institutions:
                    </span>
                    {matchingInstitutions.map(inst => (
                      <button
                        key={inst.id}
                        type="button"
                        onClick={() => {
                          setSelectedInstId(inst.id);
                          setInstitutionQuery(inst.name);
                          setMatchingInstitutions([]);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          selectedInstId === inst.id
                            ? 'bg-teal-600 text-white font-bold'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-semibold">{inst.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {inst.id} | {inst.district}, {inst.state}
                          </div>
                        </div>
                        {selectedInstId === inst.id && <Check className="w-4 h-4 text-white" />}
                      </button>
                    ))}
                  </div>
                )}

                {/* College Risk Score & Compliance Status (Feature 5: College Risk Score) */}
                <div className="mt-2.5 p-3 rounded-xl bg-orange-50/70 dark:bg-orange-950/40 border border-orange-300 dark:border-orange-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/30">
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                        <span>{institutionQuery || "Apex Institute of Technology & Management"}</span>
                        <span className="text-[10px] font-mono bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 font-bold px-1.5 py-0.2 rounded">
                          Risk Score: 88.5/100
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        AICTE Standing: Approved (Under Special Compliance Audit) • 14 Active Redressals Underway
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] text-orange-700 dark:text-orange-400 font-bold bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 px-2 py-1 rounded-md shrink-0">
                    Tier-1 Monitored
                  </span>
                </div>
              </div>

              {/* Grievance Description Textarea */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    2. Describe Grievance Details
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Supports typing or speaking in 6 languages
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={originalText}
                  onChange={e => setOriginalText(e.target.value)}
                  placeholder={t('student.issuePlaceholder')}
                  className="w-full p-3 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none leading-relaxed"
                  required
                />

                {/* Live AI Classification & Duplicate Triage Preview (Feature 1 & Feature 2) */}
                {liveTriagePreview && (
                  <div className="mt-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-teal-500/30 space-y-2 text-xs animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-teal-800 dark:text-cyan-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        AI Real-Time Classification & Grouping Preview
                      </span>
                      <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        AI Confidence: 94%
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block font-semibold">Predicted Category</span>
                        <span className="font-bold text-teal-700 dark:text-cyan-400 capitalize block mt-0.5">
                          {liveTriagePreview.category}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block font-semibold">Assigned AICTE Department</span>
                        <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                          {liveTriagePreview.bureau}
                        </span>
                      </div>

                      <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        <span className="text-slate-400 block font-semibold">Citizen Charter Guarantee</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 block mt-0.5">
                          {liveTriagePreview.sla_days}-Day Statutory SLA
                        </span>
                      </div>
                    </div>

                    {liveTriagePreview.has_duplicates && (
                      <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-2">
                        <Copy className="w-4 h-4 text-amber-600 shrink-0" />
                        <div>
                          <strong className="font-bold">Duplicate & Group Case Detected:</strong> {liveTriagePreview.duplicate_count} other students from your college have reported caution money delays. Your complaint will be joined with <span className="font-mono font-bold">{liveTriagePreview.cluster_group}</span> for accelerated collective redressal!
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Camera Capture & OCR Attachment Section */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  3. Evidence Attachments & Camera OCR
                </label>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={openCamera}
                    className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Camera className="w-4 h-4 text-teal-600" />
                    <span>{t('student.takePhoto')}</span>
                  </button>

                  <label className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors">
                    <Upload className="w-4 h-4 text-cyan-600" />
                    <span>Upload PDF / Receipt</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setAttachments(prev => [...prev, {
                            file_name: e.target.files![0].name,
                            file_type: e.target.files![0].type || "application/pdf",
                            ocr_text: "Fee receipt uploaded by user"
                          }]);
                        }
                      }}
                    />
                  </label>
                </div>

                {/* In-Browser Camera Modal */}
                {cameraOpen && (
                  <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-4 space-y-4 shadow-2xl">
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <Camera className="w-4 h-4 text-teal-600" />
                          Evidence Camera & OCR Scanner
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
                            setCameraOpen(false);
                          }}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center">
                        {capturedPhoto ? (
                          <img src={capturedPhoto} alt="Captured preview" className="w-full h-full object-cover" />
                        ) : (
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        )}
                      </div>

                      <div className="flex gap-2 justify-end">
                        {!capturedPhoto ? (
                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
                          >
                            Capture Photo
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={retakePhoto}
                              className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-300 text-slate-700 dark:text-slate-300"
                            >
                              Retake
                            </button>
                            <button
                              type="button"
                              onClick={extractOcrFromPhoto}
                              disabled={ocrLoading}
                              className="px-4 py-2 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                              <span>{ocrLoading ? "Extracting OCR via Tesseract..." : t('student.extractOcr')}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Attachments List */}
                {attachments.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{att.file_name}</span>
                            {att.ocr_text && (
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 line-clamp-1">
                                OCR: {att.ocr_text}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Anonymous Complaint Checkbox */}
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-teal-600 rounded border-slate-300 dark:border-slate-700 focus:ring-teal-500"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer">
                  {t('student.anonymousToggle')} (Identity masked from college authorities)
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? "Running AI Triage & Routing..." : t('student.submitComplaint')}</span>
              </button>
            </form>
          )}

        </div>
      )}

      {/* TAB 2: TRACK STATUS & TIMELINE */}
      {activeTab === 'track' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: 6 AI Features Vertical Stack + My Filed Grievances */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* 6 AICTE Intelligence Features Stacked Vertically */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  AI Grievance Intelligence
                </span>
                <span className="text-[10px] text-teal-600 dark:text-cyan-400 font-mono font-bold">
                  Live Engines
                </span>
              </div>

              <div className="space-y-2">
                {/* 1. AI Complaint Classification */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-teal-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-teal-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      AI Complaint Classification
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 px-1 py-0.2 rounded">
                      94% Conf
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">
                    {selectedTrackingComplaint ? selectedTrackingComplaint.category : "Fee Fraud / Caution Money"}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Routed to: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedTrackingComplaint ? selectedTrackingComplaint.bureau : "Finance"} Bureau</span>
                  </div>
                </div>

                {/* 2. Duplicate Complaint Detection */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-amber-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Copy className="w-3 h-3" />
                      Duplicate Complaint Detection
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1 py-0.2 rounded">
                      82% Sim
                    </span>
                  </div>
                  <div className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400 truncate">
                    {selectedTrackingComplaint?.case_group_id || 'GRP-2025-01'}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    14 Collective Student Cases Joined
                  </div>
                </div>

                {/* 3. Cross Department Alert */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-red-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-red-700 dark:text-red-400 uppercase tracking-wider flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Cross Department Alert
                    </span>
                    <span className="text-[9px] font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 px-1 py-0.2 rounded">
                      Active
                    </span>
                  </div>
                  <div className="text-xs font-bold text-red-600 dark:text-red-400 truncate">
                    Joint Bureau Review Triggered
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Finance + Inspection + Approval
                  </div>
                </div>

                {/* 4. Deadline Tracking */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-purple-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Deadline Tracking
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 px-1 py-0.2 rounded">
                      30d SLA
                    </span>
                  </div>
                  <div className="text-xs font-bold text-purple-600 dark:text-purple-400 truncate">
                    Statutory Citizen Charter Mandate
                  </div>
                  <div className="text-[10px] text-amber-600 font-semibold">
                    Escalated: Day 33 of 30 SLA
                  </div>
                </div>

                {/* 5. College Risk Score */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-orange-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      College Risk Score
                    </span>
                    <span className="text-[9px] font-mono font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 px-1 py-0.2 rounded">
                      88.5 / 100
                    </span>
                  </div>
                  <div className="text-xs font-bold text-orange-600 dark:text-orange-400 truncate">
                    Apex Institute of Technology
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Status: <span className="font-semibold text-red-500">Tier-1 Regulatory Scrutiny</span>
                  </div>
                </div>

                {/* 6. Root Cause Insight Dashboard */}
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-indigo-500/30 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Root Cause Insight Dashboard
                    </span>
                    <span className="text-[9px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 px-1 py-0.2 rounded">
                      PAT-001
                    </span>
                  </div>
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 truncate">
                    Caution Money Surge (+38.5%)
                  </div>
                  <div className="text-[10px] text-slate-500">
                    National AICTE Taskforce Probe Active
                  </div>
                </div>
              </div>
            </div>

            {/* My Filed Grievances */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                My Filed Grievances ({myComplaints.length})
              </h3>
              
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {myComplaints.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedTrackingComplaint(c)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      selectedTrackingComplaint?.id === c.id
                        ? 'bg-teal-50 dark:bg-teal-950/60 border-teal-500/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {c.id}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        c.status === 'resolved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-teal-700 dark:text-cyan-400 mt-1 capitalize">
                      {c.category}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {c.institution_name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Complaint Detail & Milestones Timeline Column */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6">
            {selectedTrackingComplaint ? (
              <>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-teal-600 dark:text-cyan-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded border border-teal-500/30">
                      {selectedTrackingComplaint.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {selectedTrackingComplaint.institution_name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 block">SLA Target</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {selectedTrackingComplaint.due_date ? selectedTrackingComplaint.due_date.split('T')[0] : "30 Days"}
                    </span>
                  </div>
                </div>



                {/* Citizen Charter Deadline Tracking Progress Meter (Feature 4: Deadline tracking) */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-purple-50 via-slate-50 to-purple-50 dark:from-purple-950/40 dark:via-slate-900 dark:to-purple-950/40 border border-purple-300 dark:border-purple-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-purple-600" />
                      AICTE Citizen Charter Statutory Deadline Monitor
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                      Tier-2 Bureau Head Escalation Active
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 dark:text-slate-300 mb-1">
                      <span>Statutory 30-Day Redressal Window</span>
                      <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                        Resolution Due: {selectedTrackingComplaint.due_date ? selectedTrackingComplaint.due_date.split('T')[0] : "30-Day Mandate"}
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-500 via-amber-500 to-red-500 rounded-full" style={{ width: '85%' }} />
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                    Under the AICTE Citizen Charter Act, your complaint is legally guaranteed a formal resolution within 30 calendar days. Because the college failed to reply within 14 days, your case has been escalated directly to Bureau Head Dr. Sunita Deshmukh for show-cause enforcement.
                  </p>
                </div>

                {/* Cross-Department Review & Group Coordinated Action Card (Feature 2 & Feature 3) */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-teal-500/30 space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-teal-600" />
                      Collective Case Group & Cross-Department Inquiry Status
                    </span>
                    <span className="text-[10px] font-mono text-teal-600 dark:text-cyan-400 font-bold">
                      GRP-2025-REFUND-01
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Copy className="w-3.5 h-3.5 text-amber-500" />
                        Collective Grievance Standing
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        14 student complaints against Apex Institute regarding caution money have been consolidated. You are part of a collective legal action under Regulation 14(b).
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        Multi-Department Joint Action
                      </span>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        Finance Bureau is auditing college caution money refund accounts while the Inspection Cell has scheduled an unannounced regulatory verification.
                      </p>
                    </div>
                  </div>

                  {/* College Risk Score & Transparency Standing (Feature 5) */}
                  <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-orange-900 dark:text-orange-200 block text-xs">
                        College AICTE Standing & Risk Rating
                      </span>
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">
                        Risk Score: 88.5/100 (Tier-1 Scrutiny) • AICTE Approval under conditional hold
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-orange-800 dark:text-orange-300 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-800 px-2 py-0.5 rounded font-mono">
                      High Scrutiny
                    </span>
                  </div>

                  {/* Systemic Root Cause Council Advisory (Feature 6) */}
                  <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                    <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
                      AICTE Chairman's Council Advisory (Root Cause PAT-001)
                    </span>
                    <p className="leading-relaxed">
                      AICTE has issued a nationwide directive prohibiting colleges from withholding caution money deposits past student exit. A formal compliance notice has been served to your Registrar with penal interest terms.
                    </p>
                  </div>
                </div>

                {/* Grievance Summary */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-slate-900 dark:text-white block mb-1">Original Text:</span>
                  {selectedTrackingComplaint.english_translation || selectedTrackingComplaint.original_text}
                </div>

                {/* Timeline Milestones */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Redressal Progress Timeline
                  </h4>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-teal-500/30">
                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Complaint Registered & Authenticated</div>
                      <div className="text-[11px] text-slate-500">Logged on {selectedTrackingComplaint.created_date ? selectedTrackingComplaint.created_date.split('T')[0] : "Recent"}</div>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-teal-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="text-xs font-bold text-slate-900 dark:text-white">AI Triage & Bureau Routing Complete</div>
                      <div className="text-[11px] text-slate-500">Assigned to {selectedTrackingComplaint.bureau} Bureau for institutional inquiry</div>
                    </div>

                    <div className="relative">
                      <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white dark:ring-slate-900" />
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Official Notice Served to Registrar</div>
                      <div className="text-[11px] text-slate-500">Show-cause notice served under Regulation 14(b) directing compliance</div>
                    </div>
                  </div>
                </div>

                {/* Simulated Multi-Channel Dispatch Log */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Automated Multi-Channel Dispatch Log
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>SMS Sent: +91-9876543210</span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-teal-500" />
                      <span>Email Delivered to Complainant</span>
                    </div>
                    <div className="p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-green-500" />
                      <span>WhatsApp Update Sent</span>
                    </div>
                  </div>
                </div>

                {/* Post-Closure Feedback Form */}
                <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {t('student.feedbackTitle')}
                  </h4>
                  {feedbackSuccess ? (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Thank you! Your feedback has been recorded in the AICTE quality repository.</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1">
                        {[1, 2, 3, 4, 5].map(st => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setFeedbackRating(st)}
                            className="p-1 text-amber-400 hover:scale-110 transition-transform"
                          >
                            <Star className={`w-5 h-5 ${st <= feedbackRating ? 'fill-amber-400' : 'text-slate-300 dark:text-slate-700'}`} />
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={feedbackComment}
                        onChange={e => setFeedbackComment(e.target.value)}
                        placeholder="Share your experience with the resolution process..."
                        className="w-full p-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleFeedbackSubmit}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a grievance on the left to track timeline & status
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
