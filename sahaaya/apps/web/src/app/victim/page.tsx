'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { HeartHandshake, LogOut, MessageCircle, ShieldCheck, LifeBuoy, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { RadialDistressGauge } from '@/components/charts/RadialDistressGauge';
import { VictimDistressChart } from '@/components/charts/VictimDistressChart';
import { Button, Card, CardContent, CardHeader, CardTitle, DistressBandBadge } from '@/components/ui';
import type { DistressScore, Victim } from '@/types';

type HistoryPoint = { date: string; score: number; band: string };

export default function VictimPortalPage() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [victim, setVictim] = useState<Victim | null>(null);
  const [score, setScore] = useState<DistressScore | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supportOpen, setSupportOpen] = useState(false);
  const [supportType, setSupportType] = useState<'urgent_safety' | 'counselling' | 'legal_aid'>('counselling');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSending, setSupportSending] = useState(false);
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [checkinSending, setCheckinSending] = useState(false);
  const [mood, setMood] = useState(50);
  const [anxiety, setAnxiety] = useState(50);
  const [sleep, setSleep] = useState(50);
  const [safety, setSafety] = useState(50);
  const [hopelessness, setHopelessness] = useState(50);
  const [isolation, setIsolation] = useState(50);
  const [checkinMessage, setCheckinMessage] = useState('');

  const loadData = async () => {
    if (!user || user.role !== 'victim') return;
    setLoading(true);
    setError('');
    try {
      const [victimResponse, scoreResponse, historyResponse] = await Promise.all([
        api.getVictim(user.id),
        api.getVictimDistress(user.id),
        api.getVictimDistressHistory(user.id),
      ]);
      setVictim(victimResponse.data.profile);
      setScore(scoreResponse.data);
      setHistory(historyResponse.data.map((point: HistoryPoint) => ({
        ...point,
        distress_score: point.score,
        checkin_date: point.date,
      })));
    } catch (loadError) {
      console.error('Failed to load victim portal:', loadError);
      setError('We could not load your wellbeing information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.replace('/login?redirect=%2Fvictim');
    } else if (user.role !== 'victim') {
      router.replace('/dashboard');
    } else {
      loadData();
    }
  }, [router, user]);

  if (!user || user.role !== 'victim') return null;

  const handleSignOut = () => {
    logout();
    router.replace('/');
  };

  const submitSupportRequest = async () => {
    setSupportSending(true);
    setError('');
    try {
      const response = await api.createSupportRequest({
        victim_id: user.id,
        request_type: supportType,
        message: supportMessage || undefined,
      });
      setSupportOpen(false);
      setSupportMessage('');
      setError(`Request sent to: ${response.data.routed_roles.join(' and ')}. A trained human will follow up.`);
    } catch (requestError) {
      console.error('Failed to send support request:', requestError);
      setError('We could not send your request. Please try again or use your approved emergency channel.');
    } finally {
      setSupportSending(false);
    }
  };

  const submitCheckin = async () => {
    setCheckinSending(true);
    setError('');
    try {
      await api.submitCheckin({
        victim_id: user.id,
        scores: { mood, anxiety_stress: anxiety, sleep_quality: sleep, safety, hopelessness, isolation },
        message: checkinMessage || undefined,
      });
      setCheckinOpen(false);
      setCheckinMessage('');
      await loadData();
      setError('Check-in submitted. Your wellbeing view has been updated.');
    } catch (submitError) {
      console.error('Failed to submit check-in:', submitError);
      setError('We could not submit your check-in. Please try again.');
    } finally {
      setCheckinSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2" aria-label="SAHAAYA home">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500">
              <HeartHandshake className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-text-primary">SAHAAYA</p>
              <p className="text-caption text-text-muted">Your support space</p>
            </div>
          </Link>
          <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl px-3 py-2 text-body-sm text-text-secondary hover:bg-secondary-100">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-3xl bg-gradient-to-br from-primary-50 to-secondary-50 p-6 sm:p-8">
          <p className="text-body-sm font-medium text-primary-600">Welcome, {user.name}</p>
          <h1 className="mt-2 font-heading text-display-sm font-semibold text-text-primary">How are you feeling today?</h1>
          <p className="mt-2 max-w-2xl text-body text-text-secondary">
            This is a private space to check in, understand your recent wellbeing trend, and ask for support when you need it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={() => setCheckinOpen(true)}>
              <HeartHandshake className="h-4 w-4" />
              Start a check-in
            </Button>
            <Button variant="outline" onClick={() => setSupportOpen(true)}>
              <LifeBuoy className="h-4 w-4" />
              Ask for support
            </Button>
          </div>
        </section>

        {error && (
          <div className="flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-body-sm text-primary-700">
            <span>{error}</span>
            <button onClick={() => setError('')} aria-label="Dismiss message">Dismiss</button>
          </div>
        )}

        {supportOpen && (
          <div className="rounded-2xl border border-primary-200 bg-surface p-5 shadow-card">
            <h2 className="font-heading text-heading-md font-semibold text-text-primary">Ask a trained person for support</h2>
            <p className="mt-1 text-body-sm text-text-secondary">Your request is routed to people, not handled automatically.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['counselling', 'Counselling'],
                ['urgent_safety', 'Urgent safety'],
                ['legal_aid', 'Legal aid'],
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setSupportType(value as typeof supportType)} className={`rounded-xl border p-3 text-left text-body-sm ${supportType === value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border text-text-secondary'}`}>
                  {label}
                </button>
              ))}
            </div>
            <textarea value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} placeholder="Optional: tell the support team what you need" className="mt-4 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-body-sm outline-none focus:border-primary-500" />
            <div className="mt-4 flex gap-3">
              <Button onClick={submitSupportRequest} loading={supportSending}>Send request</Button>
              <Button variant="outline" onClick={() => setSupportOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {checkinOpen && (
          <div className="rounded-2xl border border-primary-200 bg-surface p-5 shadow-card">
            <h2 className="font-heading text-heading-md font-semibold text-text-primary">Your private check-in</h2>
            <p className="mt-1 text-body-sm text-text-secondary">Use the sliders gently. There are no right or wrong answers.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {[
                ['Mood', mood, setMood], ['Anxiety or stress', anxiety, setAnxiety],
                ['Sleep quality', sleep, setSleep], ['Sense of safety', safety, setSafety],
                ['Hopefulness', hopelessness, setHopelessness], ['Feeling connected', isolation, setIsolation],
              ].map(([label, value, setter]) => (
                <label key={label as string} className="text-body-sm text-text-secondary">
                  <span className="flex justify-between"><span>{label as string}</span><strong className="text-text-primary">{value as number}</strong></span>
                  <input className="mt-2 w-full accent-primary-500" type="range" min="0" max="100" value={value as number} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} />
                </label>
              ))}
            </div>
            <textarea value={checkinMessage} onChange={(event) => setCheckinMessage(event.target.value)} placeholder="Optional: anything you want the support team to understand?" className="mt-4 min-h-24 w-full rounded-xl border border-border bg-background p-3 text-body-sm outline-none focus:border-primary-500" />
            <div className="mt-4 flex gap-3">
              <Button onClick={submitCheckin} loading={checkinSending}>Submit check-in</Button>
              <Button variant="outline" onClick={() => setCheckinOpen(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center text-text-secondary">Loading your private wellbeing view...</div>
        ) : score && victim ? (
          <>
            <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
              <Card>
                <CardContent className="flex flex-col items-center p-6">
                  <p className="text-body-sm font-medium text-text-secondary">Your latest check-in</p>
                  <RadialDistressGauge score={score.distress_score} band={score.band} size="lg" showLabel />
                  <DistressBandBadge band={score.band} className="mt-2" />
                  <p className="mt-3 text-center text-caption text-text-muted">This view is for reflection, not a diagnosis.</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Your wellbeing trend</CardTitle>
                  <p className="text-body-sm text-text-secondary">Compared with your own recent history</p>
                </CardHeader>
                <CardContent>
                  <VictimDistressChart history={history} currentScore={score.distress_score} baseline={score.personal_baseline} />
                </CardContent>
              </Card>
            </section>

            <section className="grid gap-6 md:grid-cols-3">
              <Card><CardContent className="p-5"><p className="text-caption text-text-muted">Personal baseline</p><p className="mt-1 text-heading-lg font-semibold text-text-primary">{score.personal_baseline.toFixed(1)}</p><p className="mt-1 text-body-sm text-text-secondary">Your comparison point</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-caption text-text-muted">Recent direction</p><p className="mt-1 text-heading-lg font-semibold capitalize text-text-primary">{score.trend_direction}</p><p className="mt-1 text-body-sm text-text-secondary">Based on multiple check-ins</p></CardContent></Card>
              <Card><CardContent className="p-5"><p className="text-caption text-text-muted">Case reference</p><p className="mt-1 text-body-sm font-semibold text-text-primary">{victim.case_type}</p><p className="mt-1 text-body-sm text-text-secondary">{victim.district}, {victim.state}</p></CardContent></Card>
            </section>

            <section className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader><CardTitle><ShieldCheck className="mr-2 inline h-5 w-5 text-primary-500" />Privacy and consent</CardTitle></CardHeader>
                <CardContent><p className="text-body-sm text-text-secondary">Your wellbeing information is shown only to authorised support staff. You can review or withdraw consent through your support team.</p></CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle><MessageCircle className="mr-2 inline h-5 w-5 text-primary-500" />Need to talk?</CardTitle></CardHeader>
                <CardContent><p className="text-body-sm text-text-secondary">You are not alone. Contact your assigned counsellor or approved local emergency support if you feel unsafe.</p></CardContent>
              </Card>
            </section>
          </>
        ) : (
          <div className="rounded-2xl border border-border bg-surface p-8 text-center">
            <p className="text-body text-text-secondary">{error || 'No wellbeing information is available yet.'}</p>
            <Button variant="outline" className="mt-4" onClick={loadData}><RefreshCw className="h-4 w-4" />Try again</Button>
          </div>
        )}
      </div>
    </main>
  );
}
