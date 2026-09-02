import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const IS_BROWSER = typeof window !== 'undefined';

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        if (this.accessToken) {
          config.headers.Authorization = `Bearer ${this.accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - handle errors and token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 - token expired
        if (error.response?.status === 401 && !originalRequest._retry && this.refreshToken) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${this.accessToken}`;
            return this.client(originalRequest);
          } catch {
            this.clearTokens();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        // Handle other errors
        const message = error.response?.data?.detail || error.message || 'An error occurred';
        return Promise.reject({ message, status: error.response?.status });
      }
    );
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    this.refreshToken = refresh;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
    }
  }

  loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private async refreshAccessToken() {
    if (!this.refreshToken) throw new Error('No refresh token');
    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refresh_token: this.refreshToken,
    });
    this.setTokens(response.data.access_token, response.data.refresh_token);
  }

  // Health
  async healthCheck() {
    return this.client.get('/health');
  }

  // Victims
  async getVictims() {
    return this.client.get('/api/v1/victims');
  }

  async getVictim(victimId: string) {
    return this.client.get(`/api/v1/victims/${victimId}`);
  }

  async getVictimDistress(victimId: string) {
    return this.client.get(`/api/v1/victims/${victimId}/distress`);
  }

  async getVictimDistressHistory(victimId: string) {
    return this.client.get(`/api/v1/victims/${victimId}/distress/history`);
  }

  async getVictimExplanation(victimId: string) {
    return this.client.get(`/api/v1/victims/${victimId}/explanation`);
  }

  async createSupportRequest(data: {
    victim_id: string;
    request_type: 'urgent_safety' | 'counselling' | 'legal_aid';
    message?: string;
  }) {
    return this.client.post('/api/v1/support-requests', data);
  }

  async getSupportRequests(params?: { role?: string; since?: string }) {
    return this.client.get('/api/v1/support-requests', { params });
  }

  async submitCheckin(data: {
    victim_id: string;
    scores: Record<string, number>;
    message?: string;
  }) {
    return this.client.post('/api/v1/checkins', data);
  }

  // Emotion prediction
  async predictEmotion(text: string) {
    return this.client.post('/api/v1/emotion/predict', { text });
  }

  // Distress scoring
  async computeDistressScore(data: any) {
    return this.client.post('/api/v1/distress/score', data);
  }

  // Alerts
  async getAlerts(params?: { band?: string; limit?: number }) {
    return this.client.get('/api/v1/alerts', { params });
  }

  async getReviewAlerts(params?: {
    status?: string;
    priority?: string;
    assigned_to?: string;
    victim_id?: string;
    limit?: number;
  }) {
    return this.client.get('/api/v1/review/alerts', { params });
  }

  async getAlert(alertId: string) {
    return this.client.get(`/api/v1/review/alerts/${alertId}`);
  }

  async assignAlert(alertId: string, assignedTo: string, assignedRole: string) {
    return this.client.post(`/api/v1/review/alerts/${alertId}/assign`, {
      assigned_to: assignedTo,
      assigned_role: assignedRole,
    });
  }

  async reviewAlert(alertId: string, data: {
    actor_id: string;
    actor_role: string;
    decision: string;
    notes?: string;
    review_duration_seconds?: number;
  }) {
    return this.client.post(`/api/v1/review/alerts/${alertId}/review`, data);
  }

  async generateAlerts() {
    return this.client.post('/api/v1/review/alerts/generate');
  }

  async getAlertHistory(alertId: string) {
    return this.client.get(`/api/v1/review/alerts/${alertId}/history`);
  }

  // Interventions
  async getInterventions(params?: {
    alert_id?: string;
    victim_id?: string;
    status?: string;
    assigned_to?: string;
    limit?: number;
  }) {
    return this.client.get('/api/v1/review/interventions', { params });
  }

  async createIntervention(alertId: string, data: {
    created_by: string;
    type: string;
    title: string;
    description: string;
    priority: string;
    assigned_to?: string;
    assigned_role?: string;
    planned_start?: string;
    planned_end?: string;
  }) {
    return this.client.post(`/api/v1/review/alerts/${alertId}/interventions`, data);
  }

  async startIntervention(interventionId: string, actorId: string) {
    return this.client.post(`/api/v1/review/interventions/${interventionId}/start`, { actor_id: actorId });
  }

  async completeIntervention(interventionId: string, data: {
    actor_id: string;
    outcome: string;
    effectiveness_rating: number;
    victim_feedback?: string;
  }) {
    return this.client.post(`/api/v1/review/interventions/${interventionId}/complete`, data);
  }

  // Review stats
  async getReviewSummary() {
    return this.client.get('/api/v1/review/stats/summary');
  }

  async getOfficerWorkload(officerId: string, role: string) {
    return this.client.get(`/api/v1/review/stats/officer/${officerId}`, { params: { role } });
  }

  // Audit logs
  async getAuditLogs(params?: {
    resource_type?: string;
    resource_id?: string;
    actor_id?: string;
    action?: string;
    limit?: number;
  }) {
    return this.client.get('/api/v1/review/audit-logs', { params });
  }

  // Dashboards
  async getDistrictDashboard(districtId: string) {
    return this.client.get(`/api/v1/dashboard/district/${districtId}`);
  }

  async getStateDashboard(stateId: string) {
    return this.client.get(`/api/v1/dashboard/state/${stateId}`);
  }

  async getNationalDashboard() {
    return this.client.get(`/api/v1/dashboard/national`);
  }
}

export const api = new ApiClient();
