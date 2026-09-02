'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  History,
  Send,
  ShieldQuestion,
  User,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, StatusBadge, PriorityBadge, DistressBandBadge,
  Button, Textarea,
} from '@/components/ui';
import { RadialDistressGauge } from '@/components/charts/RadialDistressGauge';
import { formatDateTime, formatRelativeTime, cn, getInterventionTypeLabel, getInterventionStatusColor } from '@/lib/utils';
import type { Alert, Intervention, ReviewDecision } from '@/types';

interface PageProps {
  params: { id: string };
}

const decisionOptions: { value: ReviewDecision; label: string; description: string }[] = [
  { value: 'confirm_intervene', label: 'Confirm & Plan Intervention', description: 'Distress is genuine — plan a support intervention' },
  { value: 'confirm_monitor', label: 'Confirm & Increase Monitoring', description: 'Distress is genuine — increase check-in frequency for now' },
  { value: 'request_more_info', label: 'Request More Information', description: 'Not enough signal yet to decide' },
  { value: 'escalate', label: 'Escalate to Supervisor', description: 'Needs a higher-authority decision' },
  { value: 'dismiss', label: 'Dismiss (False Positive)', description: 'Not a genuine distress signal' },
];

const REVIEWABLE_STATUSES = ['new', 'assigned', 'in_review'];

export default function AlertDetailPage({ params }: PageProps) {
  const alertId = params.id;
  const { user } = useAuthStore();
  const [alert, setAlert] = useState<Alert | null>(null);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [decision, setDecision] = useState<ReviewDecision>('confirm_monitor');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [startedAt] = useState(() => Date.now());

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [alertRes, interventionsRes, historyRes] = await Promise.all([
        api.getAlert(alertId),
        api.getInterventions({ alert_id: alertId }),
        api.getAlertHistory(alertId),
      ]);
      setAlert(alertRes.data);
      setInterventions(interventionsRes.data);
      setHistory(historyRes.data);
    } catch (err) {
      console.error('Failed to load alert:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertId]);

  const handleSubmitReview = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      await api.reviewAlert(alertId, {
        actor_id: user.id,
        actor_role: user.role,
        decision,
        notes,
        review_duration_seconds: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
      });
      setNotes('');
      await loadData();
    } catch (err) {
      console.error('Failed to submit review:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-secondary-100 rounded" />
        <Card padding="lg" className="h-48" />
        <Card padding="lg" className="h-64" />
      </div>
    );
  }

  if (error || !alert) {
    return (
      <div className="text-center py-16">
        <AlertTriangle className="w-12 h-12 mx-auto text-border mb-4" />
        <h2 className="text-heading-lg font-semibold text-text-secondary mb-2">Unable to load alert</h2>
        <Button variant="outline" onClick={loadData}>Retry</Button>
      </div>
    );
  }

  const canReview = REVIEWABLE_STATUSES.includes(alert.status);

  return (
    <div className="space-y-6">
      <Link href="/dashboard/alerts" className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to alerts inbox
      </Link>

      {/* Header */}
      <motion.div
        className="card p-6 flex flex-col lg:flex-row lg:items-center gap-6"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <RadialDistressGauge score={alert.distress_score} band={alert.band} size="lg" showLabel />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <DistressBandBadge band={alert.band} />
            <PriorityBadge priority={alert.priority} />
            <StatusBadge status={alert.status} />
          </div>
          <h1 className="text-display-sm font-heading font-bold text-text-primary font-mono">{alertId}</h1>
          <Link href={`/dashboard/victims/${alert.victim_id}`} className="text-body text-primary-500 hover:text-primary-600 font-mono mt-1 inline-block">
            {alert.victim_id} →
          </Link>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 mt-3 text-body-sm text-text-secondary">
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4 text-text-muted" /> Created {formatRelativeTime(alert.created_at)}</span>
            {alert.assigned_to && (
              <span className="inline-flex items-center gap-1.5"><User className="w-4 h-4 text-text-muted" /> {alert.assigned_to}</span>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 lg:flex lg:flex-col gap-3 lg:w-44 flex-shrink-0">
          <div className="p-3 rounded-xl bg-secondary-50 text-center lg:text-left">
            <p className="text-caption text-text-muted">7-day risk</p>
            <p className="text-heading-md font-heading font-bold text-distress-orange">{Math.round(alert.escalation_probability_7d * 100)}%</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary-50 text-center lg:text-left">
            <p className="text-caption text-text-muted">30-day risk</p>
            <p className="text-heading-md font-heading font-bold text-distress-orange">{Math.round(alert.escalation_probability_30d * 100)}%</p>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Explanation */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Why This Alert Was Raised</CardTitle>
              <CardDescription>Explainable AI output — never the sole basis for action</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-body text-text-primary leading-relaxed">{alert.narrative}</p>
              <div className="p-4 rounded-xl bg-secondary-50 border border-border">
                <p className="text-body-sm font-semibold text-text-primary mb-1">Clinical Summary</p>
                <p className="text-body-sm text-text-secondary">{alert.clinical_summary}</p>
              </div>
              {alert.primary_factors?.length > 0 && (
                <div className="space-y-2 pt-2">
                  <p className="text-body-sm font-semibold text-text-primary">Primary Contributing Factors</p>
                  {alert.primary_factors.map((f: any, i: number) => (
                    <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-secondary-50">
                      <span className="text-body-sm text-text-primary">{f.factor_name || f.factor}</span>
                      <Badge variant={f.direction === 'decreasing' ? 'green' : 'orange'} size="sm">
                        {f.direction === 'decreasing' ? '-' : '+'}{Math.abs(f.contribution ?? 0).toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2 pt-2">
                <p className="text-body-sm font-semibold text-text-primary">Recommended Actions</p>
                <ul className="space-y-1.5">
                  {alert.recommended_actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-body-sm text-text-secondary">
                      <CheckCircle2 className="w-4 h-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Interventions */}
          {interventions.length > 0 && (
            <Card padding="md">
              <CardHeader>
                <CardTitle>Interventions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {interventions.map((iv) => (
                  <div key={iv.intervention_id} className="p-3 rounded-xl bg-secondary-50">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-body-sm font-semibold text-text-primary">{iv.title}</span>
                      <span className={cn('text-caption px-2 py-0.5 rounded-full font-medium', getInterventionStatusColor(iv.status))}>
                        {iv.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-body-sm text-text-secondary">{getInterventionTypeLabel(iv.type)} — {iv.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Review history */}
          <Card padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="w-5 h-5 text-text-muted" /> Review History</CardTitle>
              <CardDescription>Complete audit trail of human actions on this alert</CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-body-sm text-text-muted">No review actions recorded yet.</p>
              ) : (
                <ol className="space-y-3">
                  {history.map((h: any, i: number) => (
                    <li key={h.action_id || i} className="flex items-start gap-3 text-body-sm">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-1.5 flex-shrink-0" />
                      <div>
                        <p className="text-text-primary">
                          <strong>{h.actor_id}</strong> ({h.actor_role?.replace('_', ' ')}) — {h.action?.replace('_', ' ')}
                        </p>
                        {h.notes && <p className="text-text-secondary mt-0.5">{h.notes}</p>}
                        <p className="text-caption text-text-muted mt-0.5">{formatDateTime(h.timestamp)}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Review action panel */}
        <div>
          <Card padding="md" className="lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldQuestion className="w-5 h-5 text-primary-500" /> Human Review</CardTitle>
              <CardDescription>Every serious action requires a documented human decision</CardDescription>
            </CardHeader>
            <CardContent>
              {!canReview ? (
                <div className="p-4 rounded-xl bg-secondary-50 text-center">
                  <p className="text-body-sm text-text-secondary">
                    This alert is <strong>{alert.status.replace('_', ' ')}</strong>
                    {alert.reviewed_by && <> — reviewed by <strong>{alert.reviewed_by}</strong></>}. No further review action is available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="label">Decision</label>
                    <div className="space-y-2">
                      {decisionOptions.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDecision(opt.value)}
                          className={cn(
                            'w-full text-left p-3 rounded-xl border-2 transition-all',
                            decision === opt.value
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-border bg-surface hover:border-primary-200'
                          )}
                        >
                          <p className={cn('text-body-sm font-semibold', decision === opt.value ? 'text-primary-700' : 'text-text-primary')}>
                            {opt.label}
                          </p>
                          <p className="text-caption text-text-secondary mt-0.5">{opt.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <Textarea
                    label="Notes"
                    placeholder="Add review notes (optional but recommended)..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                  />
                  <Button fullWidth onClick={handleSubmitReview} loading={submitting} leftIcon={<Send className="w-4 h-4" />}>
                    Submit Decision
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
