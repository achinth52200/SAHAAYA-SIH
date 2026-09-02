export interface Victim {
  victim_id: string;
  case_type: string;
  district: string;
  state: string;
  preferred_language: string;
  latest_score?: number;
  latest_band?: DistressBand;
  trend?: TrendDirection;
}

export type DistressBand = 'Green' | 'Yellow' | 'Orange' | 'Red';
export type TrendDirection = 'improving' | 'stable' | 'worsening';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'assigned' | 'in_review' | 'intervention_decided' | 'intervention_in_progress' | 'resolved' | 'escalated' | 'false_positive';
export type ReviewDecision = 'confirm_intervene' | 'confirm_monitor' | 'dismiss' | 'escalate' | 'request_more_info';
export type InterventionType = 'counselling' | 'legal_aid' | 'protection_support' | 'financial_assistance' | 'rehabilitation_referral' | 'safety_planning' | 'crisis_hotline' | 'medical_referral';
export type InterventionStatus = 'planned' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
export type UserRole = 'victim' | 'counsellor' | 'district_officer' | 'state_officer' | 'national_admin';

export interface DistressComponents {
  self_report: number;
  text_emotion: number;
  behavioural: number;
  voice: number;
  case_events: number;
  trend: number;
}

export interface DistressScore {
  victim_id: string;
  timestamp: string;
  distress_score: number;
  band: DistressBand;
  components: DistressComponents;
  personal_baseline: number;
  contributing_factors: ContributingFactor[];
  escalation_probability_7d: number;
  escalation_probability_30d: number;
  trend_direction: TrendDirection;
  confidence: number;
}

export interface ContributingFactor {
  factor: string;
  contribution: number;
  component_score: number;
  weight: number;
}

export interface Explanation {
  victim_id: string;
  timestamp: string;
  distress_score: number;
  band: DistressBand;
  narrative: string;
  clinical_summary: string;
  recommended_actions: string[];
  primary_factors: FactorExplanation[];
  secondary_factors: FactorExplanation[];
  protective_factors: FactorExplanation[];
  risk_factors: FactorExplanation[];
  counterfactuals: Counterfactual[];
  confidence: number;
  requires_human_review: boolean;
}

export interface FactorExplanation {
  factor_name: string;
  contribution: number;
  direction: 'increasing' | 'decreasing';
  description: string;
  evidence: Record<string, any>;
  confidence: number;
}

export interface Counterfactual {
  component: string;
  current_score: number;
  target_score: number;
  required_change: number;
  impact_on_total: number;
  description: string;
}

export interface Alert {
  alert_id: string;
  victim_id: string;
  distress_score: number;
  band: DistressBand;
  priority: AlertPriority;
  status: AlertStatus;
  assigned_to?: string;
  assigned_role?: UserRole;
  created_at: string;
  updated_at: string;
  narrative: string;
  clinical_summary: string;
  primary_factors: FactorExplanation[];
  recommended_actions: string[];
  reviewed_by?: string;
  review_decision?: ReviewDecision;
  resolved_at?: string;
  trend_direction?: TrendDirection;
  escalation_probability_7d: number;
  escalation_probability_30d: number;
}

export interface Intervention {
  intervention_id: string;
  alert_id: string;
  victim_id: string;
  type: InterventionType;
  title: string;
  description: string;
  status: InterventionStatus;
  priority: AlertPriority;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  actual_start?: string;
  actual_end?: string;
  outcome: string;
  effectiveness_rating?: number;
}

export interface DashboardStats {
  alerts: {
    total: number;
    by_status: Record<AlertStatus, number>;
    by_priority: Record<AlertPriority, number>;
    pending_review: number;
  };
  interventions: {
    total: number;
    by_status: Record<InterventionStatus, number>;
    overdue: number;
  };
  review_actions_today: number;
}

export interface OfficerWorkload {
  officer_id: string;
  role: UserRole;
  assigned_alerts: number;
  active_alerts: number;
  high_priority_alerts: number;
  assigned_interventions: number;
  active_interventions: number;
  overdue_interventions: number;
  alerts: Alert[];
  interventions: Intervention[];
}

export interface DistrictDashboard {
  district: string;
  total_victims: number;
  band_distribution: Record<DistressBand, number>;
  high_risk_count: number;
  victims: VictimSummary[];
}

export interface VictimSummary {
  victim_id: string;
  case_type: string;
  district: string;
  state: string;
  preferred_language: string;
  latest_score: number | null;
  latest_band: DistressBand | null;
  trend: TrendDirection | null;
  escalation_probability_7d?: number;
}

export interface StateDashboard {
  state: string;
  total_victims: number;
  total_districts: number;
  band_distribution: Record<DistressBand, number>;
  high_risk_count: number;
  high_risk_percentage: number;
  districts: DistrictSummary[];
}

export interface DistrictSummary {
  district: string;
  total_victims: number;
  band_distribution: Record<DistressBand, number>;
  high_risk_count: number;
}

export interface NationalDashboard {
  total_victims: number;
  total_states: number;
  band_distribution: Record<DistressBand, number>;
  high_risk_count: number;
  high_risk_percentage: number;
  states: Record<string, Record<DistressBand, number>>;
}

export interface EmotionPrediction {
  emotion: string;
  confidence: number;
  all_probabilities: Record<string, number>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  detail: string;
  status: number;
}