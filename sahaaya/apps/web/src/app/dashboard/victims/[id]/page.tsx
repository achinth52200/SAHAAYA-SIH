'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Globe,
  MapPin,
  MessageSquareText,
  Minus,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, StatusBadge, PriorityBadge, DistressBandBadge,
  Button, Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui';
import { RadialDistressGauge } from '@/components/charts/RadialDistressGauge';
import { VictimDistressChart } from '@/components/charts/VictimDistressChart';
import { FactorBreakdown } from '@/components/charts/FactorBreakdown';
import { CaseTimeline } from '@/components/CaseTimeline';
import { formatDate, cn } from '@/lib/utils';
import type { DistressScore, Explanation, Alert } from '@/types';

interface PageProps {
  params: { id: string };
}

const trendMeta = {
  worsening: { icon: TrendingUp, color: 'text-distress-red', label: 'Worsening' },
  improving: { icon: TrendingDown, color: 'text-distress-green', label: 'Improving' },
  stable: { icon: Minus, color: 'text-text-muted', label: 'Stable' },
};

export default function VictimDetailPage({ params }: PageProps) {
  const victimId = params.id;
  const [profile, setProfile] = useState<any | null>(null);
  const [history, setHistory] = useState<any>({ checkins: [], case_events: [] });
  const [distress, setDistress] = useState<DistressScore | null>(null);
  const [distressHistory, setDistressHistory] = useState<any[]>([]);
  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'explanation' | 'history' | 'alerts'>('overview');

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [victimRes, distressRes, historyRes, explanationRes, alertsRes] = await Promise.all([
        api.getVictim(victimId),
        api.getVictimDistress(victimId),
        api.getVictimDistressHistory(victimId),
        api.getVictimExplanation(victimId),
        api.getReviewAlerts({ victim_id: victimId }),
      ]);
      setProfile(victimRes.data.profile);
      setHistory(victimRes.data.history);
      setDistress(distressRes.data);
      setDistressHistory(historyRes.data);
      setExplanation(explanationRes.data);
      setAlerts(alertsRes.data);
    } catch (err) {
      console.error('Failed to load victim data:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [victimId]);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-secondary-100 rounded" />
        <div className="h-4 w-96 bg-secondary-100 rounded" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Card padding="lg" className="lg:col-span-2 h-64" />
          <Card padding="lg" className="h-64" />
        </div>
      </div>
    );
  }

  if (error || !profile || !distress) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 mx-auto text-border mb-4" />
        <h2 className="text-heading-lg font-semibold text-text-secondary mb-2">Unable to load case data</h2>
        <p className="text-body-sm text-text-muted mb-4">The victim record may not exist, or the API is unreachable.</p>
        <Button variant="outline" onClick={loadData}>Retry</Button>
      </div>
    );
  }

  const trend = trendMeta[distress.trend_direction] || trendMeta.stable;
  const TrendIcon = trend.icon;
  const chartHistory = distressHistory.map((p) => ({ checkin_date: p.date, distress_score: p.score }));

  return (
    <div className="space-y-6">
      <Link href="/dashboard/victims" className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to victims
      </Link>

      {/* Header */}
      <motion.div
        className="card p-6 flex flex-col lg:flex-row lg:items-center gap-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <RadialDistressGauge score={distress.distress_score} band={distress.band} size="lg" showLabel />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <DistressBandBadge band={distress.band} />
            <span className={cn('inline-flex items-center gap-1 text-body-sm font-medium', trend.color)}>
              <TrendIcon className="w-4 h-4" /> {trend.label}
            </span>
            {explanation?.requires_human_review && (
              <Badge variant="red" dot>Requires Human Review</Badge>
            )}
          </div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary">{victimId}</h1>
          <p className="text-body text-text-secondary mt-1">{profile.case_type}</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-body-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5"><MapPin className="w-4 h-4 text-text-muted" /> {profile.district}, {profile.state}</span>
            <span className="inline-flex items-center gap-1.5"><Globe className="w-4 h-4 text-text-muted" /> {profile.preferred_language?.toUpperCase()}</span>
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4 text-text-muted" /> Registered {formatDate(profile.case_registered_date)}</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className={cn('w-4 h-4', profile.consent_given ? 'text-distress-green' : 'text-distress-red')} />
              {profile.consent_given ? 'Consent on file' : 'No consent'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 lg:w-44 flex-shrink-0">
          <div className="p-3 rounded-xl bg-secondary-50 text-center lg:text-left">
            <p className="text-caption text-text-muted">Baseline</p>
            <p className="text-heading-md font-heading font-bold text-text-primary">{distress.personal_baseline.toFixed(1)}</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary-50 text-center lg:text-left">
            <p className="text-caption text-text-muted">7-day escalation risk</p>
            <p className="text-heading-md font-heading font-bold text-distress-orange">{Math.round(distress.escalation_probability_7d * 100)}%</p>
          </div>
        </div>
      </motion.div>

      {profile.label && (
        <p className="text-caption text-text-muted italic">{profile.label} — used for prototype demonstration only.</p>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="explanation">Explanation</TabsTrigger>
          <TabsTrigger value="history">Case History</TabsTrigger>
          <TabsTrigger value="alerts">Alerts ({alerts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <Card padding="md" className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Distress Trend</CardTitle>
                <CardDescription>Actual computed score at each check-in, against personal baseline</CardDescription>
              </CardHeader>
              <CardContent>
                <VictimDistressChart history={chartHistory} currentScore={distress.distress_score} baseline={distress.personal_baseline} />
              </CardContent>
            </Card>
            <Card padding="md">
              <CardHeader>
                <CardTitle>Model Confidence</CardTitle>
                <CardDescription>30-day escalation outlook</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-body-sm mb-1">
                    <span className="text-text-secondary">Confidence</span>
                    <span className="font-semibold text-text-primary">{Math.round(distress.confidence * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary-100 overflow-hidden">
                    <div className="h-full bg-primary-500 rounded-full" style={{ width: `${distress.confidence * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-body-sm mb-1">
                    <span className="text-text-secondary">30-day escalation</span>
                    <span className="font-semibold text-distress-orange">{Math.round(distress.escalation_probability_30d * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary-100 overflow-hidden">
                    <div className="h-full bg-distress-orange rounded-full" style={{ width: `${distress.escalation_probability_30d * 100}%` }} />
                  </div>
                </div>
                <p className="text-caption text-text-muted pt-2 border-t border-border">
                  Compared against this individual's own history — not a universal threshold.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card padding="none">
            <CardHeader className="px-6 pt-6">
              <CardTitle>Contributing Factors</CardTitle>
              <CardDescription>Weighted composite breakdown of the current distress score</CardDescription>
            </CardHeader>
            <FactorBreakdown components={distress.components} />
          </Card>
        </TabsContent>

        <TabsContent value="explanation" className="mt-6 space-y-6">
          {!explanation ? (
            <p className="text-body-sm text-text-muted">No explanation available.</p>
          ) : (
            <>
              <Card padding="md">
                <CardHeader>
                  <CardTitle>Narrative</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-body text-text-primary leading-relaxed">{explanation.narrative}</p>
                  <div className="p-4 rounded-xl bg-secondary-50 border border-border">
                    <p className="text-body-sm font-semibold text-text-primary mb-1">Clinical Summary</p>
                    <p className="text-body-sm text-text-secondary">{explanation.clinical_summary}</p>
                  </div>
                </CardContent>
              </Card>

              <Card padding="md">
                <CardHeader>
                  <CardTitle>Recommended Actions</CardTitle>
                  <CardDescription>Support options for a human reviewer to consider — never auto-triggered</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {explanation.recommended_actions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-body-sm text-text-primary">
                        <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <FactorGroup title="Primary Factors" tone="risk" factors={explanation.primary_factors} />
                <FactorGroup title="Secondary Factors" tone="risk" factors={explanation.secondary_factors} />
                <FactorGroup title="Protective Factors" tone="protective" factors={explanation.protective_factors} />
                <FactorGroup title="Risk Factors" tone="risk" factors={explanation.risk_factors} />
              </div>

              {explanation.counterfactuals?.length > 0 && (
                <Card padding="md">
                  <CardHeader>
                    <CardTitle>What Would Change the Score</CardTitle>
                    <CardDescription>Counterfactual scenarios from the explainability layer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {explanation.counterfactuals.map((cf: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-secondary-50 text-body-sm text-text-secondary">
                        {cf.description}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle>Case Timeline</CardTitle>
              <CardDescription>Case events and check-ins from the case-event and interaction pipelines</CardDescription>
            </CardHeader>
            <CardContent>
              <CaseTimeline caseEvents={history.case_events || []} checkins={history.checkins || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="mt-6">
          <Card padding="none">
            {alerts.length === 0 ? (
              <div className="p-12 text-center text-text-muted">
                <AlertTriangle className="w-12 h-12 mx-auto text-border mb-3" />
                <p className="text-body">No alerts for this victim</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {alerts.map((alert) => (
                  <Link
                    key={alert.alert_id}
                    href={`/dashboard/alerts/${alert.alert_id}`}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-secondary-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <RadialDistressGauge score={alert.distress_score} band={alert.band} size="xs" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <PriorityBadge priority={alert.priority} size="sm" />
                          <StatusBadge status={alert.status} size="sm" />
                        </div>
                        <p className="text-body-sm text-text-secondary truncate mt-1">{alert.narrative}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function FactorGroup({ title, factors, tone }: { title: string; factors: any[]; tone: 'risk' | 'protective' }) {
  if (!factors || factors.length === 0) return null;
  return (
    <Card padding="md">
      <CardHeader>
        <CardTitle className="text-heading-md flex items-center gap-2">
          {tone === 'protective' ? <ShieldCheck className="w-5 h-5 text-distress-green" /> : <AlertTriangle className="w-5 h-5 text-distress-orange" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {factors.map((f, i) => (
          <div key={i} className="p-3 rounded-xl bg-secondary-50">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-body-sm font-semibold text-text-primary">{f.factor_name}</span>
              <Badge variant={f.direction === 'increasing' ? 'orange' : 'green'} size="sm">
                {f.direction === 'increasing' ? '+' : '-'}{Math.abs(f.contribution).toFixed(1)}
              </Badge>
            </div>
            <p className="text-body-sm text-text-secondary">{f.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
