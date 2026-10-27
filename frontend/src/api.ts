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
  getSankey: () => request("/analytics/sankey"),
  getHeatmap: () => request("/analytics/calendar-heatmap"),
  getChoropleth: () => request("/analytics/state-choropleth"),
  getTrends: () => request("/analytics/monthly-trends"),
  getTreemap: () => request("/analytics/treemap"),
  getRadar: (ids?: string) => request(`/analytics/radar-compare${ids ? `?inst_ids=${ids}` : ''}`),
  getBubble: () => request("/analytics/bubble-chart"),
  getBureauWorkload: () => request("/analytics/bureau-workload"),
  getFunnel: () => request("/analytics/funnel"),
  getAiInsights: () => request("/analytics/ai-insights"),
  getTopRisky: () => request("/analytics/top-risky"),
  getExportUrl: (format: string, params: Record<string, any> = {}) => {
    const query = new URLSearchParams();
    query.append("format", format);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") query.append(k, String(v));
    });
    return `${API_BASE}/analytics/export?${query.toString()}`;
  },

  // Root Cause
  getRootCauseOverview: () => request("/root-cause/overview"),

  // Settings & Audit
  getUsers: () => request("/settings/users"),
  updateUser: (id: number, data: any) => request(`/settings/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  getRules: () => request("/settings/rules"),
  updateRules: (rules: any[]) => request("/settings/rules", { method: "POST", body: JSON.stringify({ rules }) }),
  getAuditLogs: (limit: number = 50) => request(`/settings/audit-logs?limit=${limit}`),
  verifyAuditTrail: () => request("/settings/audit/verify", { method: "POST" }),
  getNotifications: () => request("/settings/notifications"),
  markNotificationRead: (id: number) => request(`/settings/notifications/${id}/read`, { method: "POST" })
};
