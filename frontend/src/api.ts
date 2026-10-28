const API_BASE = "http://127.0.0.1:8000/api";

export interface UserProfile {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  role: 'student' | 'official' | 'admin';
  level: string;
  bureau?: string;
  state?: string;
  enrollment_no?: string;
  college_name?: string;
  student_class?: string;
  branch?: string;
  gender?: string;
  year?: string;
}

export const getAuthToken = () => localStorage.getItem("cih_token") || "";
export const setAuthToken = (token: string) => localStorage.setItem("cih_token", token);
export const removeAuthToken = () => localStorage.removeItem("cih_token");

export const getCurrentUser = (): UserProfile | null => {
  const u = localStorage.getItem("cih_user");
  return u ? JSON.parse(u) : null;
};
export const setCurrentUser = (user: UserProfile) => localStorage.setItem("cih_user", JSON.stringify(user));
export const removeCurrentUser = () => localStorage.removeItem("cih_user");

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {})
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(errorBody.detail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  login: (data: any) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  studentRegister: (data: any) => request("/auth/student-register", { method: "POST", body: JSON.stringify(data) }),
  requestOtp: (phone: string) => request("/auth/student-otp", { method: "POST", body: JSON.stringify({ phone }) }),
  getMe: () => request("/auth/me"),
  getDemoUsers: () => request("/auth/demo-users"),

  // Complaints
  getComplaints: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    return request(`/complaints?${query.toString()}`);
  },
  getComplaint: (id: string) => request(`/complaints/${id}`),
  checkDuplicate: (data: { text: string; institution_id?: string }) => request("/complaints/check-duplicate", { method: "POST", body: JSON.stringify(data) }),
  testClassifier: (text: string) => request("/complaints/test-classifier", { method: "POST", body: JSON.stringify({ text }) }),
  fileComplaint: (data: any) => request("/complaints/file", { method: "POST", body: JSON.stringify(data) }),
  overrideTriage: (id: string, data: any) => request(`/complaints/${id}/override`, { method: "POST", body: JSON.stringify(data) }),
  addAction: (id: string, data: any) => request(`/complaints/${id}/actions`, { method: "POST", body: JSON.stringify(data) }),
  createReferral: (id: string, data: any) => request(`/complaints/${id}/referrals`, { method: "POST", body: JSON.stringify(data) }),
  respondReferral: (id: number, data: any) => request(`/complaints/referrals/${id}/respond`, { method: "POST", body: JSON.stringify(data) }),
  verifySummary: (id: string, action: string = "verify") => request(`/complaints/${id}/summary/verify?action=${action}`, { method: "POST" }),
  submitFeedback: (id: string, data: any) => request(`/complaints/${id}/feedback`, { method: "POST", body: JSON.stringify(data) }),

  // Institutions
  getInstitutions: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    return request(`/institutions?${query.toString()}`);
  },
  getInstitution360: (id: string) => request(`/institutions/${id}`),

  // Network
  getNetworkGraph: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    return request(`/network/graph?${query.toString()}`);
  },

  // Analytics
  getAnalyticsOverview: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    return request(`/analytics/overview?${query.toString()}`);
  },
  getSankey: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/sankey${qs ? `?${qs}` : ''}`);
  },
  getHeatmap: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/calendar-heatmap${qs ? `?${qs}` : ''}`);
  },
  getChoropleth: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/state-choropleth${qs ? `?${qs}` : ''}`);
  },
  getTrends: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/monthly-trends${qs ? `?${qs}` : ''}`);
  },
  getTreemap: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/treemap${qs ? `?${qs}` : ''}`);
  },
  getRadar: (ids?: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    if (ids) query.append("inst_ids", ids);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/radar-compare${qs ? `?${qs}` : ''}`);
  },
  getBubble: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/bubble-chart${qs ? `?${qs}` : ''}`);
  },
  getBureauWorkload: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/bureau-workload${qs ? `?${qs}` : ''}`);
  },
  getFunnel: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/funnel${qs ? `?${qs}` : ''}`);
  },
  getAiInsights: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/ai-insights${qs ? `?${qs}` : ''}`);
  },
  getTopRisky: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const qs = query.toString();
    return request(`/analytics/top-risky${qs ? `?${qs}` : ''}`);
  },
  getExportUrl: (format: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    query.append("format", format);
    const token = getAuthToken();
    if (token) query.append("token", token);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    return `${API_BASE}/analytics/export?${query.toString()}`;
  },
  downloadExport: async (format: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    query.append("format", format);
    const token = getAuthToken();
    if (token) query.append("token", token);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    const url = `${API_BASE}/analytics/export?${query.toString()}`;
    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(url, { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(err.detail || `Export failed with status ${response.status}`);
    }
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `aicte_intelligence_report.${format === "pdf" ? "pdf" : "csv"}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    a.remove();
  },

  // Root Cause & Resolution Timeline
  getRootCauseOverview: () => request("/root-cause/overview"),
  getResolutionTimeline: () => request("/analytics/resolution-timeline"),

  // Institution Admin Edit
  adminEditInstitution: (id: string, data: any) => request(`/institutions/${id}/admin-edit`, { method: "PUT", body: JSON.stringify(data) }),

  // Settings & Audit
  getUsers: () => request("/settings/users"),
  updateUser: (id: number, data: any) => request(`/settings/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getRules: () => request("/settings/rules"),
  updateRules: (rules: any[]) => request("/settings/rules", { method: "POST", body: JSON.stringify({ rules }) }),
  getAuditLogs: (limit: number = 50) => request(`/settings/audit-logs?limit=${limit}`),
  verifyAuditTrail: () => request("/settings/audit/verify", { method: "POST" }),
  tamperAuditTrail: () => request("/settings/audit/tamper", { method: "POST" }),
  restoreAuditTrail: () => request("/settings/audit/restore", { method: "POST" }),
  getNotifications: () => request("/settings/notifications"),
  markNotificationRead: (id: number) => request(`/settings/notifications/${id}/read`, { method: "POST" }),

  // Escalations & Conflicts (Prompt 2 Section 5)
  getEscalations: () => request("/settings/escalations"),
  takeEscalationAction: (complaintId: string, data: any) => request(`/settings/escalations/${complaintId}/action`, { method: "POST", body: JSON.stringify(data) }),
  getConflicts: () => request("/settings/conflicts"),
  resolveConflict: (conflictId: number, note: string) => request(`/settings/conflicts/${conflictId}/resolve`, { method: "POST", body: JSON.stringify({ note }) }),

  // AI Oversight & Import (Prompt 2 Section 7)
  getAiOversight: () => request("/settings/ai-oversight"),
  importCsv: (data: { rows: any[]; confirm: boolean }) => request("/settings/import-csv", { method: "POST", body: JSON.stringify(data) })
};
