import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserRole, Victim, Alert, Intervention, DistressScore, Explanation } from '@/types';

interface AuthState {
  user: {
    id: string;
    role: UserRole;
    name: string;
    district?: string;
    state?: string;
  } | null;
  isAuthenticated: boolean;
  login: (user: AuthState['user']) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'sahaaya-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);

interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleTheme: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
}));

interface VictimState {
  victims: Victim[];
  selectedVictim: Victim | null;
  distressScores: Record<string, DistressScore>;
  explanations: Record<string, Explanation>;
  isLoading: boolean;
  error: string | null;
  setVictims: (victims: Victim[]) => void;
  setSelectedVictim: (victim: Victim | null) => void;
  setDistressScore: (victimId: string, score: DistressScore) => void;
  setExplanation: (victimId: string, explanation: Explanation) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVictimStore = create<VictimState>((set) => ({
  victims: [],
  selectedVictim: null,
  distressScores: {},
  explanations: {},
  isLoading: false,
  error: null,
  setVictims: (victims) => set({ victims }),
  setSelectedVictim: (victim) => set({ selectedVictim: victim }),
  setDistressScore: (victimId, score) =>
    set((state) => ({
      distressScores: { ...state.distressScores, [victimId]: score },
    })),
  setExplanation: (victimId, explanation) =>
    set((state) => ({
      explanations: { ...state.explanations, [victimId]: explanation },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

interface AlertState {
  alerts: Alert[];
  selectedAlert: Alert | null;
  interventions: Record<string, Intervention[]>;
  isLoading: boolean;
  error: string | null;
  setAlerts: (alerts: Alert[]) => void;
  setSelectedAlert: (alert: Alert | null) => void;
  updateAlert: (alert: Alert) => void;
  addAlert: (alert: Alert) => void;
  setInterventions: (alertId: string, interventions: Intervention[]) => void;
  addIntervention: (alertId: string, intervention: Intervention) => void;
  updateIntervention: (alertId: string, intervention: Intervention) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  alerts: [],
  selectedAlert: null,
  interventions: {},
  isLoading: false,
  error: null,
  setAlerts: (alerts) => set({ alerts }),
  setSelectedAlert: (alert) => set({ selectedAlert: alert }),
  updateAlert: (alert) =>
    set((state) => ({
      alerts: state.alerts.map((a) => (a.alert_id === alert.alert_id ? alert : a)),
      selectedAlert: state.selectedAlert?.alert_id === alert.alert_id ? alert : state.selectedAlert,
    })),
  addAlert: (alert) => set((state) => ({ alerts: [alert, ...state.alerts] })),
  setInterventions: (alertId, interventions) =>
    set((state) => ({
      interventions: { ...state.interventions, [alertId]: interventions },
    })),
  addIntervention: (alertId, intervention) =>
    set((state) => ({
      interventions: {
        ...state.interventions,
        [alertId]: [...(state.interventions[alertId] || []), intervention],
      },
    })),
  updateIntervention: (alertId, intervention) =>
    set((state) => ({
      interventions: {
        ...state.interventions,
        [alertId]: state.interventions[alertId]?.map((i) =>
          i.intervention_id === intervention.intervention_id ? intervention : i
        ),
      },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));

interface DashboardState {
  stats: {
    alerts: { total: number; pending_review: number; by_status: Record<string, number>; by_priority: Record<string, number> };
    interventions: { total: number; overdue: number; by_status: Record<string, number> };
  } | null;
  officerWorkload: Record<string, any>;
  isLoading: boolean;
  setStats: (stats: DashboardState['stats']) => void;
  setOfficerWorkload: (officerId: string, workload: any) => void;
  setLoading: (loading: boolean) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  officerWorkload: {},
  isLoading: false,
  setStats: (stats) => set({ stats }),
  setOfficerWorkload: (officerId, workload) =>
    set((state) => ({
      officerWorkload: { ...state.officerWorkload, [officerId]: workload },
    })),
  setLoading: (loading) => set({ isLoading: loading }),
}));